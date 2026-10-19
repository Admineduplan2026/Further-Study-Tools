/**
 * Eduplan name check: Claude reads the front of the student's MyKad (or MyKid / passport) and confirms their name.
 * A student whose name is confirmed this way is "verified" and can book a free consultation; everyone else is a guest.
 *
 * The website POSTs {"action":"id_verify","token":"...","file":{"type":"image/jpeg"|...,"data":"<base64>"}} to /exec.
 * The student must be signed in (Account.gs). Only the name and the last 4 digits of the IC (or passport) number are
 * kept, signed with RESULTS_SECRET (Results.gs) together with the student's email; the photo and the full number are
 * never stored. Account.gs keeps the name check in the portfolio's profile only when its signature is valid, so a name
 * typed in the browser does not count. Uses ANTHROPIC_API_KEY and the daily limit of Results.gs (RESULTS_DAILY_LIMIT).
 */

var ID_SYSTEM = [
  'You read the front of an identity document for Eduplan, a study guidance service in Malaysia, to confirm the student\'s name.',
  'Record with the record_id tool:',
  '- is_id_document: true only for the front of a Malaysian MyKad or MyKid, or the photo page of a passport. False for anything else (a results slip, a student card, a screenshot of text, a drawing).',
  '- card_type: MyKad, MyKid, passport or other.',
  '- name: the holder\'s full name exactly as printed.',
  '- id_number: the IC number (12 digits, written 000000-00-0000) or the passport number, exactly as printed.',
  '- problems: anything unreadable, covered, edited-looking or inconsistent; "" when there is none.',
  'If the name or number cannot be read with certainty, leave it "" and say so in problems.'
].join('\n');

var ID_TOOL = {
  name: 'record_id',
  description: 'Record what the identity document shows.',
  input_schema: {
    type: 'object',
    properties: {
      is_id_document: { type: 'boolean' },
      card_type: { type: 'string', enum: ['MyKad', 'MyKid', 'passport', 'other'] },
      name: { type: 'string' },
      id_number: { type: 'string' },
      problems: { type: 'string' }
    },
    required: ['is_id_document', 'card_type', 'name', 'id_number', 'problems']
  }
};

/* The signature binds the name, the last 4 digits, the date and the student's email. */
function idSign_(email, v) {
  var payload = JSON.stringify(['id', email, v.name, v.last4, v.at]);
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, resultsSecret_()));
}

/* Used by Account.gs: the profile's name check counts only when it was made by idVerify_ for this student. */
function idVerified_(v, email) {
  return !!(v && typeof v === 'object' && v.sig && v.sig === idSign_(email, { name: String(v.name || ''), last4: String(v.last4 || ''), at: Number(v.at) || 0 }));
}

function idVerify_(body) {
  var f = body.file || {}, type = String(f.type || '').toLowerCase(), data = String(f.data || '');
  if (RESULTS_TYPES.indexOf(type) < 0 || !data) return { error: 'bad_request' };
  if (data.length * 3 / 4 > RESULTS_MAX_BYTES) return { error: 'too_large' };
  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  var email = String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase();
  return idReadFile_(email, type, data);
}

/* Claude reads the document; the checks and the signature. Also used by idTest. */
function idReadFile_(email, type, data) {
  var props = PropertiesService.getScriptProperties(), apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'not_configured' };
  if (!resultsAllowed_()) return { error: 'daily_limit' };
  var block = type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: type, data: data } }
    : { type: 'image', source: { type: 'base64', media_type: type, data: data } };
  var request = {
    model: props.getProperty('RESULTS_MODEL') || RESULTS_DEFAULT_MODEL,
    max_tokens: 1000,
    system: ID_SYSTEM,
    tools: [ID_TOOL],
    tool_choice: { type: 'tool', name: 'record_id' },
    messages: [{ role: 'user', content: [block, { type: 'text', text: 'The student says this is their identity card. Read it.' }] }]
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
  return idCheck_(email, r);
}

/* A MyKad / MyKid number is 12 digits starting with a real date of birth (YYMMDD); a passport number is 6 to 12
   letters and digits. Only the name and the last 4 characters are returned. */
function idCheck_(email, r) {
  if (!r || !r.is_id_document || r.card_type === 'other') return { error: 'not_id' };
  var name = String(r.name || '').replace(/\s+/g, ' ').trim(), num = String(r.id_number || '').replace(/[\s-]/g, '').toUpperCase();
  if (name.length < 3 || name.length > 120) return { error: 'unreadable' };
  if (r.card_type === 'passport') { if (!/^[A-Z0-9]{6,12}$/.test(num)) return { error: 'unreadable' }; }
  else {
    var m = num.match(/^(\d{2})(\d{2})(\d{2})\d{6}$/);
    if (!m || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31) return { error: 'unreadable' };
  }
  var v = { name: accountCell_(name, 120), last4: num.slice(-4), at: Date.now(), type: r.card_type };
  v.sig = idSign_(email, v);
  return { ok: true, name: v.name, last4: v.last4, at: v.at, type: v.type, sig: v.sig };
}

/* Test from the Apps Script editor: put a photo of an IC (front) in Google Drive, paste its file ID below, select
   idTest and Run. The log shows the name and the last 4 digits that would be kept, or why the photo was refused. */
function idTest() {
  var FILE_ID = 'PASTE-THE-FILE-ID-HERE';
  var blob = DriveApp.getFileById(FILE_ID).getBlob();
  console.log(JSON.stringify(idReadFile_('test@eduplan', String(blob.getContentType()).toLowerCase(), Utilities.base64Encode(blob.getBytes())), null, 2));
}
