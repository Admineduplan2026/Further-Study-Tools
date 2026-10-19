/**
 * Eduplan results check: Claude reads the student's results slip (official or trial) and fills in My results.
 *
 * The website POSTs {"action":"results_read","token":"...","exam":"SPM","kind":"Official"|"Trial",
 *   "file":{"type":"image/jpeg"|"image/png"|"image/webp"|"application/pdf","data":"<base64>"}} to /exec (doPost in Code.gs).
 * The student must be signed in (Account.gs). Claude returns the exam, the subjects and grades it reads on the slip;
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
  '- slip_kind: "official" for the official results from the examining body (for example the Lembaga Peperiksaan SPM result slip or statement), "trial" for a school trial or mock exam report, "unclear" when you cannot tell.',
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
    type: 'object',
    properties: {
      is_results_slip: { type: 'boolean' },
      exam: { type: 'string', enum: ['SPM', 'UEC', 'STPM', 'IGCSE', 'O-Level', 'A-Level', 'Foundation', 'Matriculation', 'Diploma', 'Other'] },
      slip_kind: { type: 'string', enum: ['official', 'trial', 'unclear'] },
      candidate_name: { type: 'string' },
      year: { type: 'string' },
      subjects: { type: 'array', items: { type: 'object', properties: { subject: { type: 'string' }, grade: { type: 'string' } }, required: ['subject', 'grade'] } },
      cgpa: { type: ['number', 'null'] },
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

  var props = PropertiesService.getScriptProperties(), apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'not_configured' };
  if (!resultsAllowed_()) return { error: 'daily_limit' };

  var block = type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: type, data: data } }
    : { type: 'image', source: { type: 'base64', media_type: type, data: data } };
  var request = {
    model: props.getProperty('RESULTS_MODEL') || RESULTS_DEFAULT_MODEL,
    max_tokens: 2000,
    system: RESULTS_SYSTEM,
    tools: [RESULTS_TOOL],
    tool_choice: { type: 'tool', name: 'record_results' },
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
  var r = (out.content || []).filter(function (b) { return b.type === 'tool_use'; }).map(function (b) { return b.input; })[0];
  if (!r) return { error: 'unreadable' };

  // Checks on what Claude read: the right document, the exam chosen, and grades that exist for that exam.
  if (!r.is_results_slip) return { error: 'not_slip' };
  if (r.exam !== exam) return { error: 'wrong_exam', found: r.exam };
  if (kind === 'Official' && r.slip_kind !== 'official') return { error: 'not_official' };
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
