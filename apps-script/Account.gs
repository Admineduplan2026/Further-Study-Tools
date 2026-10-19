/**
 * Eduplan student portfolio: students sign in with a one-time code sent to their email, and the website saves their
 * progress automatically (saved programmes, interest quiz, consultation request and application form answers).
 *
 * The website POSTs to the same /exec URL (doPost in Code.gs):
 *   {"action":"account_code","email":"..."}                 emails a 6-digit code (valid 10 minutes, 5 tries)
 *   {"action":"account_verify","email":"...","code":"..."}  -> {"token","email","data"}  (signed in for 30 days)
 *   {"action":"account_load","token":"..."}                 -> {"email","data"}
 *   {"action":"account_save","token":"...","data":{...}}    -> {"ok":true,"data":{...}}  (newer section wins)
 *   {"action":"account_logout","token":"..."}               signs this device out
 *   {"action":"account_delete","token":"..."}               deletes the student's portfolio row
 *
 * Portfolios are kept in a private spreadsheet "Eduplan Student Portfolios" in "Eduplan Applications (private)",
 * one row per student, with readable columns for counsellors (name, mobile, saved programmes, quiz result,
 * application progress) and the full data as JSON. Uploaded documents are never stored here: they are sent only with
 * the application (Apply.gs). Session tokens and codes are stored only as SHA-256 hashes.
 *
 * Script Properties (Project Settings > Script Properties), all optional:
 *   ACCOUNT_DAILY_EMAILS  sign-in emails per day for the whole website, default 80. A free Gmail account can send
 *                         about 100 emails a day from Apps Script, shared with APPLY_NOTIFY_EMAIL.
 * Set by the script itself: ACCOUNT_SHEET_ID.
 * See docs/student-portfolio-setup.md.
 */

var ACCOUNT_CODE_MINUTES = 10;
var ACCOUNT_CODE_TRIES = 5;
var ACCOUNT_CODES_PER_6H = 5;           // codes one email address can ask for in 6 hours
var ACCOUNT_SESSION_DAYS = 30;
var ACCOUNT_MAX_SESSIONS = 5;           // devices signed in at the same time
var ACCOUNT_MAX_DATA = 45000;           // characters of JSON; a Google Sheets cell holds 50,000
var ACCOUNT_DEFAULT_DAILY_EMAILS = 80;
var ACCOUNT_SECTIONS = ['saved', 'quiz', 'consult', 'apply', 'results', 'search', 'recent', 'profile'];  // results: My results; search, recent: Eduplan Lab (lab/); profile: optional name, WhatsApp, status, interests
var ACCOUNT_HEADERS = ['Email', 'Created', 'Last sign-in', 'Last saved', 'Name', 'Mobile', 'Saved programmes', 'Interest quiz',
  'Application', 'Data (do not edit)', 'Sessions (do not edit)'];
var ACCOUNT_COL = { email: 1, created: 2, signin: 3, saved: 4, name: 5, mobile: 6, progs: 7, quiz: 8, app: 9, data: 10, sessions: 11 };

function accountAction_(body) {
  switch (body.action) {
    case 'account_code': return accountCode_(body);
    case 'account_verify': return accountVerify_(body);
    case 'account_load': return accountLoad_(body);
    case 'account_save': return accountSave_(body);
    case 'account_logout': return accountLogout_(body);
    case 'account_delete': return accountDelete_(body);
  }
  return { error: 'bad_request' };
}

function accountHash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function accountEmail_(v) {
  var e = String(v || '').trim().toLowerCase();
  return e.length <= 120 && /^[a-z0-9._%+'-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) ? e : '';
}

/* Text typed by students is written to the sheet as plain text, never as a formula. */
function accountCell_(v, max) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function accountSheet_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('ACCOUNT_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { /* deleted or no access: make a new one */ } }
  var ss = SpreadsheetApp.create('Eduplan Student Portfolios');
  DriveApp.getFileById(ss.getId()).moveTo(applyFolder_());
  var sh = ss.getSheets()[0];
  sh.setName('Students');
  sh.appendRow(ACCOUNT_HEADERS);
  sh.getRange(1, 1, 1, ACCOUNT_HEADERS.length).setFontWeight('bold').setBackground('#e4f2fa');
  sh.setFrozenRows(1);
  sh.getRange('J:K').setNumberFormat('@');
  props.setProperty('ACCOUNT_SHEET_ID', ss.getId());
  return sh;
}

/* Row number of a column value (exact match), or 0. */
function accountFind_(sh, col, value) {
  if (sh.getLastRow() < 2) return 0;
  var cell = sh.getRange(2, col, sh.getLastRow() - 1, 1).createTextFinder(value).matchEntireCell(col === ACCOUNT_COL.email).findNext();
  return cell ? cell.getRow() : 0;
}

/* Sessions cell: "hash|expiry ms" per device, separated by spaces. Expired ones are dropped. */
function accountSessions_(text) {
  var now = Date.now();
  return String(text || '').split(/\s+/).filter(Boolean).map(function (s) { var p = s.split('|'); return { h: p[0], x: Number(p[1]) || 0 }; })
    .filter(function (s) { return s.x > now; });
}
function accountSessionsText_(list) { return list.map(function (s) { return s.h + '|' + s.x; }).join(' '); }

/* The signed-in student's row for a token, or null. */
function accountSession_(sh, token) {
  if (!/^[0-9a-f]{64}$/.test(String(token || ''))) return null;
  var h = accountHash_('session:' + token), row = accountFind_(sh, ACCOUNT_COL.sessions, h);
  if (!row) return null;
  var list = accountSessions_(sh.getRange(row, ACCOUNT_COL.sessions).getValue());
  return list.some(function (s) { return s.h === h; }) ? { row: row, h: h, list: list } : null;
}

function accountData_(sh, row) {
  try { var d = JSON.parse(sh.getRange(row, ACCOUNT_COL.data).getValue() || '{}'); return d && typeof d === 'object' ? d : {}; }
  catch (err) { return {}; }
}

/* Sign-in emails per day (Malaysia time), within the account's Gmail quota. */
function accountMailAllowed_() {
  if (MailApp.getRemainingDailyQuota() < 5) return false;  // keep a few for application notifications
  var props = PropertiesService.getScriptProperties();
  var limit = Number(props.getProperty('ACCOUNT_DAILY_EMAILS')) || ACCOUNT_DEFAULT_DAILY_EMAILS;
  var key = 'account-mail-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var n = Number(props.getProperty(key)) || 0;
  if (n >= limit) return false;
  props.setProperty(key, String(n + 1));
  return true;
}

function accountCode_(body) {
  var email = accountEmail_(body.email);
  if (!email) return { error: 'bad_email' };
  var cache = CacheService.getScriptCache(), k = 'otp-' + accountHash_(email);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { error: 'busy' };
  try {
    if (cache.get(k + ':wait')) return { error: 'wait' };
    var sent = Number(cache.get(k + ':sent')) || 0;
    if (sent >= ACCOUNT_CODES_PER_6H) return { error: 'too_many' };
    if (!accountMailAllowed_()) return { error: 'daily_limit' };
    // 6 digits from a random UUID (Utilities.getUuid is random, unlike Math.random).
    var code = ('00000' + (parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000)).slice(-6);
    cache.put(k, JSON.stringify({ h: accountHash_(code + ':' + email), n: 0 }), ACCOUNT_CODE_MINUTES * 60);
    cache.put(k + ':wait', '1', 60);
    cache.put(k + ':sent', String(sent + 1), 21600);
  } finally {
    lock.releaseLock();
  }
  MailApp.sendEmail({
    to: email, name: 'Eduplan', subject: 'Your Eduplan sign-in code: ' + code,
    body: 'Your Eduplan sign-in code is ' + code + '\n\nIt expires in ' + ACCOUNT_CODE_MINUTES + ' minutes. ' +
      'Type it on the Eduplan website to open your portfolio.\n\n' +
      '你的 Eduplan 登录验证码是 ' + code + '，' + ACCOUNT_CODE_MINUTES + ' 分钟内有效。\n\n' +
      'If you did not ask for this code, you can ignore this email. 如果你没有申请这个验证码，请忽略这封电邮。'
  });
  return { ok: true };
}

function accountVerify_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return { error: 'bad_code' };
  var cache = CacheService.getScriptCache(), k = 'otp-' + accountHash_(email);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var rec = null;
    try { rec = JSON.parse(cache.get(k) || 'null'); } catch (err) { rec = null; }
    if (!rec) return { error: 'expired' };
    if (rec.h !== accountHash_(code + ':' + email)) {
      rec.n = (rec.n || 0) + 1;
      if (rec.n >= ACCOUNT_CODE_TRIES) { cache.remove(k); return { error: 'expired' }; }
      cache.put(k, JSON.stringify(rec), ACCOUNT_CODE_MINUTES * 60);
      return { error: 'bad_code' };
    }
    cache.remove(k);

    var sh = accountSheet_(), now = new Date(), row = accountFind_(sh, ACCOUNT_COL.email, email);
    if (!row) {
      sh.appendRow([accountCell_(email, 120), now, now, '', '', '', '', '', '', '{}', '']);
      row = sh.getLastRow();
    }
    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var list = accountSessions_(sh.getRange(row, ACCOUNT_COL.sessions).getValue());
    list.push({ h: accountHash_('session:' + token), x: now.getTime() + ACCOUNT_SESSION_DAYS * 864e5 });
    sh.getRange(row, ACCOUNT_COL.sessions).setValue(accountSessionsText_(list.slice(-ACCOUNT_MAX_SESSIONS)));
    sh.getRange(row, ACCOUNT_COL.signin).setValue(now);
    return { token: token, email: email, days: ACCOUNT_SESSION_DAYS, data: accountData_(sh, row) };
  } finally {
    lock.releaseLock();
  }
}

function accountLoad_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  return { email: sh.getRange(s.row, ACCOUNT_COL.email).getValue(), data: accountData_(sh, s.row) };
}

/* Readable columns for counsellors, from the saved data. */
function accountSummary_(d) {
  var a = d.apply && d.apply.v || {}, c = d.consult && d.consult.f || {}, ap = d.apply || {};
  var app = ap.sent ? 'Sent ' + ap.sent : a.prog ? (ap.complete ? 'Ready to send' : 'Part ' + (ap.step || 1) + ' of 6') + ' · ' + a.prog : '';
  return [accountCell_(a.name_en || c['cons-name'], 120), accountCell_(a.mobile || c['cons-phone'], 40),
    accountCell_((d.saved && d.saved.ids || []).join(', '), 500), accountCell_(d.quiz && d.quiz.result, 300), accountCell_(app, 200)];
}

function accountSave_(body) {
  var inc = body.data;
  if (!inc || typeof inc !== 'object') return { error: 'bad_request' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var sh = accountSheet_(), s = accountSession_(sh, body.token);
    if (!s) return { error: 'signed_out' };
    var cur = accountData_(sh, s.row), now = Date.now();
    // Each section keeps whichever copy was changed last, so two devices do not overwrite each other's newer work.
    ACCOUNT_SECTIONS.forEach(function (k) {
      var v = inc[k];
      if (!v || typeof v !== 'object' || Array.isArray(v)) return;
      var at = Math.min(Number(v.at) || 0, now + 60000);
      if (!at) return;  // never changed on that device
      if (!cur[k] || at > (Number(cur[k].at) || 0)) { v.at = at; cur[k] = v; }
    });
    var json = JSON.stringify(cur);
    if (json.length > ACCOUNT_MAX_DATA) return { error: 'too_large' };
    sh.getRange(s.row, ACCOUNT_COL.saved, 1, 8).setValues([[new Date()].concat(accountSummary_(cur), [json, accountSessionsText_(s.list)])]);
    return { ok: true, data: cur };
  } finally {
    lock.releaseLock();
  }
}

function accountLogout_(body) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var sh = accountSheet_(), s = accountSession_(sh, body.token);
    if (s) sh.getRange(s.row, ACCOUNT_COL.sessions).setValue(accountSessionsText_(s.list.filter(function (x) { return x.h !== s.h; })));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* The student deletes their portfolio (signs out every device). Applications already sent stay with Eduplan. */
function accountDelete_(body) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var sh = accountSheet_(), s = accountSession_(sh, body.token);
    if (!s) return { error: 'signed_out' };
    sh.deleteRow(s.row);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* Run from the Apps Script editor (select accountTest, Run): creates the portfolio sheet and checks saving with a
   test row, then deletes the test row again. No email is sent. */
function accountTest() {
  var sh = accountSheet_(), email = 'test@eduplan.test', token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  sh.appendRow([email, new Date(), new Date(), '', '', '', '', '', '', '{}', accountHash_('session:' + token) + '|' + (Date.now() + 6e5)]);
  var saved = accountSave_({ token: token, data: { saved: { ids: ['XMUM-FIS'], at: Date.now() } } });
  var loaded = accountLoad_({ token: token });
  var deleted = accountDelete_({ token: token });
  console.log(JSON.stringify({ sheet: sh.getParent().getUrl(), saved: !!saved.ok, loaded: loaded.data && loaded.data.saved, deleted: !!deleted.ok }));
}
