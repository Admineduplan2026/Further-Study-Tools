/**
 * Eduplan results check: Claude reads the student's results slip (official or trial) and fills in My results.
 *
 * The website POSTs {"action":"results_read","token":"...","exam":"SPM","kind":"Official"|"Trial",
 *   "file":{"type":"image/jpeg"|"image/png"|"image/webp"|"application/pdf","data":"<base64>"}} to /exec (doPost in Code.gs).
 * The student must be signed in (Account.gs) and must have verified their name with their IC first (Identity.gs): the
 * request carries the signed name check {"idv":{name,last4,at,sig}}, and the name printed on the slip must be the
 * same as the name on the IC, so a student cannot use someone else's slip. Claude returns the exam, the subjects and grades it reads on the slip;
 * this script checks them (a real results slip, the exam the student chose, grades that exist for that exam, an
 * official slip when "Official" was chosen) and signs them with a key kept in Script Properties. The slip itself is
 * not stored. Account.gs keeps only signed results in the portfolio, so a student cannot type or change grades;
 * a new slip replaces them.
 *
 * Script Properties:
 *   ANTHROPIC_API_KEY     required (the same key as the AI study assistant, Chat.gs).
 *   RESULTS_MODEL         optional, default claude-opus-5-5 (careful reading of grades).
 *   RESULTS_DAILY_LIMIT   optional, default 200 slips per day for the whole website.
 *   RESULTS_SECRET        made automatically on first use; signs the results. Changing it un-verifies saved results.
 */

var RESULTS_DEFAULT_MODEL = 'claude-opus-5-5';
var RESULTS_DEFAULT_DAILY_LIMIT = 200;
var RESULTS_MAX_BYTES = 5 * 1024 * 1024;
var RESULTS_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
/* Grades each exam can have (the same lists as assets/js/results.js). CGPA exams have a CGPA instead. */
var RESULTS_EXAMS = {
  'SPM': ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'E', 'G', 'TH'],
  'IGCSE': ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'],
  'O-Level': ['A*', 'A', 'B', 'C', 'D', 'E', 'U'],
  'UEC': ['A1', 'A2', 'B3', 'B4', 'B5', 'B6', 'C7', 'C8', 'F9'],
  'STPM': ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
  'A-Level': ['A*', 'A', 'B', 'C', 'D', 'E', 'U'],
  'Foundation': null, 'Matriculation': null, 'Diploma': null
};

var RESULTS_SYSTEM = [
  'You read a Malaysian student\'s exam results slip for Eduplan, a study guidance service. The grades you read decide which scholarships the student is shown, so read exactly what is printed and never guess.',
  'Record with the record_results tool:',
  '- is_results_slip: true only for a results slip, statement or transcript of a national or school exam (SPM, UEC, STPM, IGCSE, O-Level, A-Level, or a foundation, matriculation or diploma transcript). False for anything else.',
  '- exam: which exam it is.',
  '- slip_kind: "official" for the official results from the examining body, "trial" for a school trial or mock exam report, "unclear" only when you truly cannot tell.',
  '  The official SPM result slip (slip keputusan) counts as "official": it is headed KEMENTERIAN PENDIDIKAN / LEMBAGA PEPERIKSAAN with the national crest and SIJIL PELAJARAN MALAYSIA TAHUN <year>, lists NAMA, NO. PENGENALAN DIRI, ANGKA GILIRAN, SEKOLAH and JUMLAH MATA PELAJARAN, shows each grade with its description (for example CEMERLANG TERTINGGI, KEPUJIAN TINGGI), often has a Lembaga Peperiksaan watermark, and ends with lines such as LAYAK MENDAPAT SIJIL or the CEFR level. It is still official when it is a photo, a scan or a printout, or is taken at an angle. The same applies to the official slips of the other examining bodies (MPM for STPM, Dong Zong for UEC, Cambridge for IGCSE / O-Level / A-Level).',
  '  "trial" is a school\'s own report: words such as PEPERIKSAAN PERCUBAAN, TRIAL, MOCK, PEPERIKSAAN AKHIR TAHUN or a school logo as the issuer, often with marks or percentages and a class position.',
  '- subjects: every subject with the grade exactly as printed (for SPM: A+, A, A-, B+, B, C+, C, D, E, G or TH). Write subject names in English (Bahasa Melayu stays Bahasa Melayu).',
  '- cgpa: only for foundation, matriculation or diploma transcripts, the final or latest cumulative GPA; otherwise null.',
  '- candidate_name and year as printed, or "" when not shown.',
  '- problems: anything unreadable, cut off, edited-looking or inconsistent; "" when there is none.',
  'If a grade cannot be read with certainty, leave that subject out and say so in problems.'
].join('\n');

var RESULTS_TOOL = {
  name: 'record_results',
  description: 'Record what the results slip shows.',
  input_schema: {
    type: 'object', additionalProperties: false,
    properties: {
      is_results_slip: { type: 'boolean' },
      exam: { type: 'string', enum: ['SPM', 'UEC', 'STPM', 'IGCSE', 'O-Level', 'A-Level', 'Foundation', 'Matriculation', 'Diploma', 'Other'] },
      slip_kind: { type: 'string', enum: ['official', 'trial', 'unclear'] },
      candidate_name: { type: 'string' },
      year: { type: 'string' },
      subjects: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { subject: { type: 'string' }, grade: { type: 'string' } }, required: ['subject', 'grade'] } },
      cgpa: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      problems: { type: 'string' }
    },
    required: ['is_results_slip', 'exam', 'slip_kind', 'subjects', 'problems']
  }
};

function resultsAllowed_() {
  var props = PropertiesService.getScriptProperties();
  var limit = Number(props.getProperty('RESULTS_DAILY_LIMIT')) || RESULTS_DEFAULT_DAILY_LIMIT;
  var key = 'results-count-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return false;
  try {
    var n = Number(props.getProperty(key)) || 0;
    if (n >= limit) return false;
    props.setProperty(key, String(n + 1));
    return true;
  } finally { lock.releaseLock(); }
}

function resultsSecret_() {
  var props = PropertiesService.getScriptProperties(), k = props.getProperty('RESULTS_SECRET');
  if (!k) { k = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('RESULTS_SECRET', k); }
  return k;
}

/* The signature binds the grades, the exam, the kind of slip, the date and the student's email. */
function resultsSign_(email, exam, x) {
  var payload = JSON.stringify([email, exam, x.kind, x.at, x.g || null, x.cgpa == null ? null : x.cgpa]);
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, resultsSecret_()));
}

/* Used by Account.gs: keeps only the exams whose results were read from a slip for this student. */
function resultsVerified_(exams, email) {
  var out = {};
  Object.keys(exams || {}).forEach(function (id) {
    var x = exams[id];
    if (!x || typeof x !== 'object' || !x.v || !RESULTS_EXAMS.hasOwnProperty(id)) return;
    var s = { kind: x.v.kind, at: x.v.at, g: x.g || null, cgpa: x.cgpa == null || x.cgpa === '' ? null : Number(x.cgpa) };
    if (x.v.sig && x.v.sig === resultsSign_(email, id, s)) out[id] = x;
  });
  return out;
}

function resultsRead_(body) {
  var exam = String(body.exam || ''), kind = body.kind === 'Trial' ? 'Trial' : body.kind === 'Official' ? 'Official' : '';
  var f = body.file || {}, type = String(f.type || '').toLowerCase(), data = String(f.data || '');
  if (!RESULTS_EXAMS.hasOwnProperty(exam) || !kind || RESULTS_TYPES.indexOf(type) < 0 || !data) return { error: 'bad_request' };
  if (data.length * 3 / 4 > RESULTS_MAX_BYTES) return { error: 'too_large' };

  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  var email = String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase();
  if (!idVerified_(body.idv, email)) return { error: 'id_first' };
  return resultsReadFile_(email, exam, kind, type, data, String(body.idv.name));
}

/* The same name, ignoring case, punctuation, spacing and word order ("TAN LI LI" = "Tan Li-Li" = "LI LI TAN"). */
function resultsNameKey_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z\u00C0-\u024F\u4E00-\u9FFF]+/g, ' ').trim().split(/\s+/).filter(String).sort().join(' ');
}
function resultsSameName_(a, b) { var x = resultsNameKey_(a); return !!x && x === resultsNameKey_(b); }

/* Claude reads the slip; the checks and the signature. icName: the name verified from the student's IC, which the
   name on the slip must match (resultsTest may leave it empty to skip that check). Also used by resultsTest. */
function resultsReadFile_(email, exam, kind, type, data, icName) {
  var props = PropertiesService.getScriptProperties(), apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'not_configured' };
  if (!resultsAllowed_()) return { error: 'daily_limit' };

  var block = type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: type, data: data } }
    : { type: 'image', source: { type: 'base64', media_type: type, data: data } };
  var request = {
    model: props.getProperty('RESULTS_MODEL') || RESULTS_DEFAULT_MODEL,
    max_tokens: 8000,  // room for the model's thinking before the JSON
    system: RESULTS_SYSTEM,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: RESULTS_TOOL.input_schema } },  // Opus 5.5 refuses a forced tool_choice
    messages: [{ role: 'user', content: [block, { type: 'text', text: 'The student says this is their ' + kind.toLowerCase() + ' ' + exam + ' results. Read it.' }] }]
  };
  var res;
  try {
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify(request), muteHttpExceptions: true
    });
  } catch (err) {
    console.error('Claude API not reachable: ' + err);
    return { error: 'busy' };
  }
  var status = res.getResponseCode(), out;
  try { out = JSON.parse(res.getContentText()); } catch (err) { out = null; }
  if (status !== 200 || !out) {
    console.error('Claude API ' + status + ': ' + res.getContentText().slice(0, 500));
    return { error: status === 429 || status === 529 || status >= 500 ? 'busy' : 'not_configured' };
  }
  var r = null;
  if (out.stop_reason !== 'max_tokens' && out.stop_reason !== 'refusal') {
    try { r = JSON.parse((out.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('')); } catch (err) { r = null; }
  }
  if (!r) return { error: 'unreadable' };

  // Checks on what Claude read: the right document, the exam chosen, and grades that exist for that exam.
  if (!r.is_results_slip) return { error: 'not_slip' };
  if (r.exam !== exam) return { error: 'wrong_exam', found: r.exam };
  if (kind === 'Official' && r.slip_kind !== 'official') return { error: 'not_official' };
  if (icName) {
    var onSlip = String(r.candidate_name || '').trim();
    if (!onSlip) return { error: 'no_name' };
    if (!resultsSameName_(onSlip, icName)) return { error: 'name_mismatch', found: accountCell_(onSlip, 120) };
  }
  var x = { kind: kind, at: Date.now() }, grades = RESULTS_EXAMS[exam];
  if (grades) {
    var g = (r.subjects || []).map(function (s) { return [accountCell_(s.subject, 80), String(s.grade || '').trim().toUpperCase()]; })
      .filter(function (s) { return s[0] && grades.indexOf(s[1]) > -1 && s[1] !== 'TH'; });
    if (!g.length) return { error: 'unreadable', problems: String(r.problems || '').slice(0, 300) };
    x.g = g;
  } else {
    var c = Number(r.cgpa);
    if (!(c >= 0 && c <= 4)) return { error: 'unreadable', problems: String(r.problems || '').slice(0, 300) };
    x.cgpa = Math.round(c * 100) / 100;
  }
  x.sig = resultsSign_(email, exam, x);
  return { ok: true, exam: exam, kind: kind, at: x.at, g: x.g || null, cgpa: x.cgpa == null ? null : x.cgpa, sig: x.sig,
    name: accountCell_(r.candidate_name, 120), year: accountCell_(r.year, 20), problems: String(r.problems || '').slice(0, 300) };
}

/* Test from the Apps Script editor, without the website: put a results slip (photo or PDF) in Google Drive, copy its
   file ID from its link (drive.google.com/file/d/<ID>/view), set the three values below, select resultsTest and Run.
   The log shows what Claude read and whether the checks passed. It counts towards RESULTS_DAILY_LIMIT. */
function resultsTest() {
  var FILE_ID = 'PASTE-THE-FILE-ID-HERE';
  var EXAM = 'SPM';          // SPM, UEC, STPM, IGCSE, O-Level, A-Level, Foundation, Matriculation or Diploma
  var KIND = 'Official';     // Official or Trial
  var IC_NAME = '';          // optional: the name on the student's IC, to test the name check (e.g. 'TAN LI LI')
  var file = DriveApp.getFileById(FILE_ID), blob = file.getBlob();
  var out = resultsReadFile_('test@eduplan', EXAM, KIND, String(blob.getContentType()).toLowerCase(), Utilities.base64Encode(blob.getBytes()), IC_NAME);
  console.log(file.getName() + ' (' + blob.getContentType() + ', ' + Math.round(blob.getBytes().length / 1024) + ' KB)');
  console.log(JSON.stringify(out, null, 2));
}

/* Check the Claude API set-up from the editor (select aiCheck, Run): the log says whether ANTHROPIC_API_KEY is set,
   which model is used, and Claude's answer to a one-word test, or its error. The key itself is never logged. */
function aiCheck() {
  var props = PropertiesService.getScriptProperties(), key = String(props.getProperty('ANTHROPIC_API_KEY') || '').trim();
  var model = props.getProperty('RESULTS_MODEL') || RESULTS_DEFAULT_MODEL;
  console.log('ANTHROPIC_API_KEY: ' + (key ? 'set (' + key.length + ' characters, starts with ' + key.slice(0, 10) + '…)' : 'NOT SET in this project'));
  if (props.getProperty('ANTHROPIC_API_KEY') && props.getProperty('ANTHROPIC_API_KEY') !== key) console.log('Warning: the key has spaces or line breaks around it; remove them.');
  console.log('Model: ' + model + (props.getProperty('RESULTS_MODEL') ? ' (RESULTS_MODEL)' : ' (default)'));
  if (!key) return;
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: model, max_tokens: 10, messages: [{ role: 'user', content: 'Reply with the word OK.' }] })
  });
  console.log('Claude API ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 400));
  // The same JSON answer format that reading an IC or a results slip uses.
  res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: model, max_tokens: 2000, output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean' } }, required: ['ok'] } } },
      messages: [{ role: 'user', content: 'Answer with ok set to true.' }] })
  });
  console.log('JSON answer test ' + res.getResponseCode() + (res.getResponseCode() === 200 ? ' (IC and results slip reading will work)' : '') + ': ' + res.getContentText().slice(0, 400));
}
