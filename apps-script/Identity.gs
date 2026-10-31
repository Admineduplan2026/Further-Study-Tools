/**
 * Eduplan name check: Claude reads the front of the student's MyKad (or MyKid / passport) and confirms their name.
 * A student whose name is confirmed this way is "verified" and can book a free consultation; everyone else is a guest.
 *
 * The website POSTs {"action":"id_verify","token":"...","file":{"type":"image/jpeg"|...,"data":"<base64>"}} to /exec.
 * The student must be signed in (Account.gs). Only the name and the last 4 digits of the IC (or passport) number are
 * kept, signed with RESULTS_SECRET (Results.gs) together with the student's email; the photo and the full number are
 * never stored. The IC number, date of birth and state of birth (from the number), gender (from the last digit), address,
 * postcode, town, state and religion (when printed) are also returned, only to fill in the application form, where the
 * student can still change them. Account.gs keeps the name check in the portfolio's profile only when its signature is valid, so a name
 * typed in the browser does not count. Uses ANTHROPIC_API_KEY and the daily limit of Results.gs (RESULTS_DAILY_LIMIT).
 */

var ID_STATES = ['Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'];

/* State of birth from digits 7-8 of a MyKad / MyKid number (National Registration Department codes). */
var ID_POB = {1:'Johor',2:'Kedah',3:'Kelantan',4:'Melaka',5:'Negeri Sembilan',6:'Pahang',7:'Penang',8:'Perak',9:'Perlis',10:'Selangor',11:'Terengganu',12:'Sabah',13:'Sarawak',14:'Kuala Lumpur',15:'Labuan',16:'Putrajaya',
  21:'Johor',22:'Johor',23:'Johor',24:'Johor',25:'Kedah',26:'Kedah',27:'Kedah',28:'Kelantan',29:'Kelantan',30:'Melaka',31:'Negeri Sembilan',59:'Negeri Sembilan',32:'Pahang',33:'Pahang',34:'Penang',35:'Penang',
  36:'Perak',37:'Perak',38:'Perak',39:'Perak',40:'Perlis',41:'Selangor',42:'Selangor',43:'Selangor',44:'Selangor',45:'Terengganu',46:'Terengganu',47:'Sabah',48:'Sabah',49:'Sabah',50:'Sarawak',51:'Sarawak',
  52:'Sarawak',53:'Sarawak',54:'Kuala Lumpur',55:'Kuala Lumpur',56:'Kuala Lumpur',57:'Kuala Lumpur',58:'Labuan'};

var ID_SYSTEM = [
  'You read the front of an identity document for Eduplan, a study guidance service in Malaysia, to confirm the student\'s name.',
  'Record with the record_id tool:',
  '- is_id_document: true only for the front of a Malaysian MyKad or MyKid, or the photo page of a passport. False for anything else (a results slip, a student card, a screenshot of text, a drawing).',
  '- card_type: MyKad, MyKid, passport or other.',
  '- name: the holder\'s full name exactly as printed.',
  '- id_number: the IC number or the passport number, exactly as printed. On a MyKad or MyKid it is the large number at the top left, under KAD PENGENALAN MALAYSIA, printed as 6-2-4 digits (000000-00-0000). Read it digit by digit and check each one again: 0, 6, 8 and 9, 1 and 7, 3 and 5 look alike in photos. Never guess a digit; if one is unclear, leave id_number "" and say so in problems.',
  '- printed_gender: the gender word printed on a MyKad or MyKid, under WARGANEGARA: LELAKI or PEREMPUAN; "" if none (passport).',
  '- address: the address lines printed on a MyKad or MyKid, without the postcode, town and state, lines joined with ", "; "" for a passport.',
  '- postcode: the 5-digit postcode in the address; town: the town or city after it; state: the state at the end, written as one of: ' + ID_STATES.join(', ') + '. "" when not printed.',
  '- religion: the religion printed on the card (a MyKad shows ISLAM for Muslims), "" when none is printed.',
  '- problems: anything unreadable, covered, edited-looking or inconsistent; "" when there is none.',
  'If the name or number cannot be read with certainty, leave it "" and say so in problems.'
].join('\n');

var ID_TOOL = {
  name: 'record_id',
  description: 'Record what the identity document shows.',
  input_schema: {
    type: 'object', additionalProperties: false,
    properties: {
      is_id_document: { type: 'boolean' },
      card_type: { type: 'string', enum: ['MyKad', 'MyKid', 'passport', 'other'] },
      name: { type: 'string' },
      id_number: { type: 'string' },
      address: { type: 'string' },
      postcode: { type: 'string' },
      town: { type: 'string' },
      state: { type: 'string' },
      religion: { type: 'string' },
      printed_gender: { type: 'string', enum: ['LELAKI', 'PEREMPUAN', ''] },
      problems: { type: 'string' }
    },
    required: ['is_id_document', 'card_type', 'name', 'id_number', 'address', 'postcode', 'town', 'state', 'religion', 'printed_gender', 'problems']
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
    max_tokens: 4000,  // room for the model's thinking before the JSON
    system: ID_SYSTEM,
    output_config: { effort: 'high', format: { type: 'json_schema', schema: ID_TOOL.input_schema } },  // the 12 digits must be exact  // Opus 5.5 refuses a forced tool_choice
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
  var r = null;
  if (out.stop_reason !== 'max_tokens' && out.stop_reason !== 'refusal') {
    try { r = JSON.parse((out.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('')); } catch (err) { r = null; }
  }
  if (!r) return { error: 'unreadable' };
  return idCheck_(email, r);
}

/* A MyKad / MyKid number is 12 digits starting with a real date of birth (YYMMDD); a passport number is 6 to 12
   letters and digits. The name and the last 4 characters are kept (signed); the address and gender go to the form. */
function idCheck_(email, r) {
  if (!r || !r.is_id_document || r.card_type === 'other') return { error: 'not_id' };
  var name = String(r.name || '').replace(/\s+/g, ' ').trim(), num = String(r.id_number || '').replace(/[\s-]/g, '').toUpperCase();
  if (name.length < 3 || name.length > 120) return { error: 'unreadable' };
  if (r.card_type === 'passport') { if (!/^[A-Z0-9]{6,12}$/.test(num)) return { error: 'unreadable' }; }
  else {
    var m = num.match(/^(\d{2})(\d{2})(\d{2})\d{6}$/);
    if (!m || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31) return { error: 'unreadable' };
  }
  // Check: the last digit of the number is odd for LELAKI and even for PEREMPUAN. A mismatch means a digit was misread.
  if (r.card_type !== 'passport' && r.printed_gender && ((+num.slice(-1)) % 2 ? 'LELAKI' : 'PEREMPUAN') !== r.printed_gender) return { error: 'unreadable' };
  var v = { name: accountCell_(name, 120), last4: num.slice(-4), at: Date.now(), type: r.card_type };
  v.sig = idSign_(email, v);
  // For the application form only (the student can still change them there): the address on a MyKad / MyKid, and
  // the gender from the last digit of the IC number (odd = male, even = female). Not part of the signature.
  var form = { ic: r.card_type === 'passport' ? num : num.slice(0, 6) + '-' + num.slice(6, 8) + '-' + num.slice(8) };
  if (r.card_type !== 'passport') {
    form.gender = (+num.slice(-1)) % 2 ? 'Male' : 'Female';
    // Date of birth (YYMMDD) and state of birth (digits 7-8) from the number; Malaysian citizen.
    var yy = +num.slice(0, 2), cy = new Date().getFullYear() % 100;
    form.dob = (yy > cy ? '19' : '20') + num.slice(0, 2) + '-' + num.slice(2, 4) + '-' + num.slice(4, 6);
    if (ID_POB[+num.slice(6, 8)]) form.pob = ID_POB[+num.slice(6, 8)];
    form.nationality = 'Malaysian'; form.residence = 'Malaysia';
    if (/^islam$/i.test(String(r.religion || '').trim())) form.religion = 'Islam';
    var pc = String(r.postcode || '').replace(/\D/g, '');
    if (/^\d{5}$/.test(pc)) form.postcode = pc;
    if (r.address) form.address = accountCell_(String(r.address).replace(/\s+/g, ' ').trim(), 300);
    if (r.town) form.town = accountCell_(String(r.town).trim(), 80);
    if (ID_STATES.indexOf(String(r.state || '').trim()) > -1) form.state = String(r.state).trim();
  }
  return { ok: true, name: v.name, last4: v.last4, at: v.at, type: v.type, sig: v.sig, form: form };
}

/* Test from the Apps Script editor: put a photo of an IC (front) in Google Drive, paste its file ID below, select
   idTest and Run. The log shows the name and the last 4 digits that would be kept, or why the photo was refused. */
function idTest() {
  var FILE_ID = 'PASTE-THE-FILE-ID-HERE';
  var blob = DriveApp.getFileById(FILE_ID).getBlob();
  console.log(JSON.stringify(idReadFile_('test@eduplan', String(blob.getContentType()).toLowerCase(), Utilities.base64Encode(blob.getBytes())), null, 2));
}
