/**
 * Eduplan student portfolio: students sign in with their email and a password (or with Google), and the website saves
 * their progress automatically (saved programmes, interest quiz, consultation request and application form answers).
 * A 6-digit code emailed once proves the email is theirs when they create the account or reset a forgotten password.
 *
 * The website POSTs to the same /exec URL (doPost in Code.gs):
 *   {"action":"account_code","email":"...","purpose":"signup"|"reset"}   emails a 6-digit code (valid 10 minutes, 5 tries)
 *   {"action":"account_register","email","code","password"}  sets the password (new account or reset) and signs in
 *   {"action":"account_login","email","password"}            -> {"token","email","data"}  (signed in for 30 days)
 *   {"action":"account_google","credential":"<Google ID token>"}  signs in (or creates the account) with Google
 *   {"action":"account_verify","email":"...","code":"..."}  older code-only sign-in, kept for pages still cached
 *   {"action":"account_load","token":"..."}                 -> {"email","data"}
 *   {"action":"account_save","token":"...","data":{...}}    -> {"ok":true,"data":{...}}  (newer section wins)
 *   {"action":"account_logout","token":"..."}               signs this device out
 *   {"action":"account_delete","token":"..."}               deletes the student's portfolio row
 *
 * Portfolios are kept in a private spreadsheet "Eduplan Student Portfolios" in "Eduplan Databases/3. Students and visitors (private)" (Drive.gs),
 * one row per student, with readable columns for counsellors (name, mobile, saved programmes, quiz result,
 * application progress) and the full data as JSON. Uploaded documents are never stored here: they are sent only with
 * the application (Apply.gs). Session tokens and codes are stored only as SHA-256 hashes; passwords only as a salted,
 * repeated HMAC-SHA-256 ("p1$rounds$salt$hash", column L). Wrong passwords: 8 tries per email in 15 minutes.
 *
 * Script Properties (Project Settings > Script Properties), all optional:
 *   ACCOUNT_DAILY_EMAILS  sign-in emails per day for the whole website, default 80. A free Gmail account can send
 *                         about 100 emails a day from Apps Script, shared with APPLY_NOTIFY_EMAIL.
 *   STAFF_PORTAL_URL      link of the EDUPLAN staff portal. Staff who sign in are sent there; the link is never in
 *                         the public website code and goes only to the emails below.
 *   STAFF_EMAILS          staff emails (comma-separated) sent to the portal after signing in; default
 *                         admin.eduplan@gmail.com.
 *   GOOGLE_CLIENT_ID      the OAuth client ID of "Continue with Google" (the same ID as EDUPLAN_GOOGLE_CLIENT_ID in
 *                         assets/js/config.js); without it Google sign-in is refused. See docs/student-portfolio-setup.md.
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
  'Application', 'Data (do not edit)', 'Sessions (do not edit)', 'Password (do not edit)'];
var ACCOUNT_COL = { email: 1, created: 2, signin: 3, saved: 4, name: 5, mobile: 6, progs: 7, quiz: 8, app: 9, data: 10, sessions: 11, pw: 12 };
var ACCOUNT_PW_ROUNDS = 400;            // HMAC rounds per password check
var ACCOUNT_PW_TRIES = 8;               // wrong passwords per email in 15 minutes

function accountAction_(body) {
  switch (body.action) {
    case 'account_code': return accountCode_(body);
    case 'account_verify': return accountVerify_(body);
    case 'account_register': return accountRegister_(body);
    case 'account_login': return accountLogin_(body);
    case 'account_google': return accountGoogle_(body);
    case 'account_load': return accountLoad_(body);
    case 'account_save': return accountSave_(body);
    case 'account_logout': return accountLogout_(body);
    case 'account_delete': return accountDelete_(body);
    case 'account_staff': return accountStaffLinks_(body);
    case 'account_goals': return accountGoals_(body);   // StaffGoals.gs
  }
  return { error: 'bad_request' };
}

function accountHash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/* Staff emails (Script Property STAFF_EMAILS, default admin.eduplan@gmail.com). */
function accountIsStaff_(email) {
  var staff = String(PropertiesService.getScriptProperties().getProperty('STAFF_EMAILS') || 'admin.eduplan@gmail.com')
    .split(/[,;\s]+/).map(accountEmail_).filter(Boolean);
  return staff.indexOf(accountEmail_(email)) >= 0;
}
/* An extra outside staff portal link (Script Property STAFF_PORTAL_URL) for a staff email, or ''. */
function accountStaffPortal_(email) {
  var url = String(PropertiesService.getScriptProperties().getProperty('STAFF_PORTAL_URL') || '').trim();
  return /^https:\/\//.test(url) && accountIsStaff_(email) ? url : '';
}

/* The staff page on the website (#staff): links to Eduplan's sheets and folders, sent only to a signed-in staff email.
   The links are made from the IDs in Script Properties, so no private address is in the website code. A link opens
   only for people the file or folder is shared with in Google Drive. */
/* {email} of a signed-in staff account, or {error}. */
function accountStaffEmail_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  var email = String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase();
  return accountIsStaff_(email) ? { email: email } : { error: 'forbidden' };
}

function accountStaffLinks_(body) {
  var who = accountStaffEmail_(body);
  if (who.error) return who;
  var email = who.email;
  var props = PropertiesService.getScriptProperties();
  function id(k) { return driveCleanId_(props.getProperty(k)); }   // Drive.gs
  function sheet(v) { return v ? 'https://docs.google.com/spreadsheets/d/' + v + '/edit' : ''; }
  function folder(v) { return v ? 'https://drive.google.com/drive/folders/' + v : ''; }
  var expoSite = props.getProperty('EXPO_SITE_URL') || EXPO_SITE_DEFAULT;   // Exhibition.gs
  var groups = [
    { key: 'start', items: [
      { key: 'master', url: sheet(MASTER_SHEET_ID), kind: 'sheet' },
      { key: 'databases', url: folder(id('DRIVE_TOP_ID')), kind: 'folder', private: true }] },
    { key: 'schools', items: [
      { key: 'school-folder', url: folder(SCHOOL_FOLDER_ID), kind: 'folder' }] },
    { key: 'students', items: [
      { key: 'applications', url: sheet(id('APPLY_SHEET_ID')), kind: 'sheet', private: true },
      { key: 'apply-folder', url: folder(id('APPLY_FOLDER_ID')), kind: 'folder', private: true },
      { key: 'portfolios', url: sheet(id('ACCOUNT_SHEET_ID')), kind: 'sheet', private: true }] },
    { key: 'payments', items: [
      { key: 'payments', url: sheet(id('PAY_SHEET_ID')), kind: 'sheet', private: true },
      { key: 'pay-folder', url: folder(id('DRIVE_PAY_ID')), kind: 'folder', private: true }] },
    { key: 'expo', items: [
      { key: 'expo-admin', url: expoSite + '#/admin', kind: 'site' },
      { key: 'expo-sheet', url: sheet(id('EXPO_SHEET_ID')), kind: 'sheet', private: true },
      { key: 'expo-folder', url: folder(id('DRIVE_EXPO_ID')), kind: 'folder', private: true }] }
  ];
  groups.forEach(function (g) { g.items = g.items.filter(function (x) { return x.url; }); });
  return { email: email, groups: groups.filter(function (g) { return g.items.length; }) };
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
  var live = id && driveSheetLive_(id);   // Drive.gs: not deleted or in the trash
  if (live) {
    var cur = live.getSheets()[0];
    if (cur.getLastColumn() < ACCOUNT_HEADERS.length) {   // the password column, added later
      cur.getRange(1, ACCOUNT_COL.pw).setValue(ACCOUNT_HEADERS[ACCOUNT_COL.pw - 1]).setFontWeight('bold').setBackground('#e4f2fa');
      cur.getRange(1, ACCOUNT_COL.pw, cur.getMaxRows(), 1).setNumberFormat('@');
    }
    return cur;
  }
  var ss = SpreadsheetApp.create('Eduplan Student Portfolios');
  DriveApp.getFileById(ss.getId()).moveTo(driveFolder_('people'));
  var sh = ss.getSheets()[0];
  sh.setName('Students');
  sh.appendRow(ACCOUNT_HEADERS);
  sh.getRange(1, 1, 1, ACCOUNT_HEADERS.length).setFontWeight('bold').setBackground('#e4f2fa');
  sh.setFrozenRows(1);
  sh.getRange('J:L').setNumberFormat('@');
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
  var reset = body.purpose === 'reset';
  MailApp.sendEmail({
    to: email, name: 'Eduplan', subject: (reset ? 'Your Eduplan password reset code: ' : 'Your Eduplan verification code: ') + code,
    body: 'Your Eduplan verification code is ' + code + '\n\nIt expires in ' + ACCOUNT_CODE_MINUTES + ' minutes. ' +
      (reset ? 'Type it on the Eduplan website to set a new password.' : 'Type it on the Eduplan website to confirm your email and finish creating your account.') + '\n\n' +
      '你的 Eduplan 验证码是 ' + code + '，' + ACCOUNT_CODE_MINUTES + ' 分钟内有效。' + (reset ? '用来设定新密码。' : '用来确认电邮、完成注册。') + '\n\n' +
      'If you did not ask for this code, you can ignore this email. 如果你没有申请这个验证码，请忽略这封电邮。'
  });
  return { ok: true };
}

/* Checks (and uses up) the emailed code for an email; null when right, otherwise {error}. Call inside the script lock. */
function accountUseCode_(email, code) {
  var cache = CacheService.getScriptCache(), k = 'otp-' + accountHash_(email), rec = null;
  try { rec = JSON.parse(cache.get(k) || 'null'); } catch (err) { rec = null; }
  if (!rec) return { error: 'expired' };
  if (rec.h !== accountHash_(code + ':' + email)) {
    rec.n = (rec.n || 0) + 1;
    if (rec.n >= ACCOUNT_CODE_TRIES) { cache.remove(k); return { error: 'expired' }; }
    cache.put(k, JSON.stringify(rec), ACCOUNT_CODE_MINUTES * 60);
    return { error: 'bad_code' };
  }
  cache.remove(k);
  return null;
}

/* Passwords: 8 to 100 characters, kept as "p1$rounds$salt$hash" (salted HMAC-SHA-256, repeated). */
function accountPwOk_(pw) { pw = String(pw == null ? '' : pw); return pw.length >= 8 && pw.length <= 100 && /\S/.test(pw); }
function accountPwHash_(pw, salt, rounds) {
  var key = Utilities.newBlob(String(pw)).getBytes(), h = Utilities.computeHmacSha256Signature(Utilities.newBlob('p1:' + salt).getBytes(), key);
  for (var i = 1; i < rounds; i++) h = Utilities.computeHmacSha256Signature(h, key);
  return h.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function accountPwMake_(pw) {
  var salt = Utilities.getUuid().replace(/-/g, '');
  return 'p1$' + ACCOUNT_PW_ROUNDS + '$' + salt + '$' + accountPwHash_(pw, salt, ACCOUNT_PW_ROUNDS);
}
function accountPwCheck_(pw, stored) {
  var p = String(stored || '').split('$');
  if (p.length !== 4 || p[0] !== 'p1') return false;
  var h = accountPwHash_(pw, p[2], Number(p[1]) || ACCOUNT_PW_ROUNDS), d = 0;
  if (h.length !== p[3].length) return false;
  for (var i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ p[3].charCodeAt(i);   // compares every character
  return d === 0;
}
/* Wrong-password counter per email (15 minutes). */
function accountPwFails_(key, add) {
  var cache = CacheService.getScriptCache(), n = Number(cache.get(key)) || 0;
  if (add) cache.put(key, String(n + 1), 900);
  return n + (add ? 1 : 0);
}

/* The row of an email, made when it is new; then a new session. Call inside the script lock. */
function accountOpen_(sh, email, how) {
  var now = new Date(), row = accountFind_(sh, ACCOUNT_COL.email, email), isNew = !row;
  if (!row) {
    sh.appendRow([accountCell_(email, 120), now, now, '', '', '', '', '', '', '{}', '', '']);
    row = sh.getLastRow();
  }
  return accountSessionOut_(sh, row, email, isNew, how);
}

/* Older code-only sign-in (pages cached before passwords): still works, the code proves the email. */
function accountVerify_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return { error: 'bad_code' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var bad = accountUseCode_(email, code);
    if (bad) return bad;
    return accountOpen_(accountSheet_(), email, 'code');
  } finally {
    lock.releaseLock();
  }
}

/* Create the account or reset the password: the emailed code proves the email, then the password is set. */
function accountRegister_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email) return { error: 'bad_email' };
  if (!accountPwOk_(body.password)) return { error: 'weak_password' };
  if (code.length !== 6) return { error: 'bad_code' };
  var hash = accountPwMake_(body.password);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var bad = accountUseCode_(email, code);
    if (bad) return bad;
    var sh = accountSheet_(), out = accountOpen_(sh, email, 'register');
    var row = accountFind_(sh, ACCOUNT_COL.email, email);
    sh.getRange(row, ACCOUNT_COL.pw).setNumberFormat('@').setValue(hash);
    CacheService.getScriptCache().remove('pwfail-' + accountHash_(email));
    out.has_password = true;
    return out;
  } finally {
    lock.releaseLock();
  }
}

/* Email and password. The same answer for an unknown email and a wrong password, so accounts cannot be guessed. */
function accountLogin_(body) {
  var email = accountEmail_(body.email), pw = String(body.password == null ? '' : body.password);
  if (!email || !pw) return { error: 'bad_login' };
  var fk = 'pwfail-' + accountHash_(email);
  if (accountPwFails_(fk, false) >= ACCOUNT_PW_TRIES) return { error: 'locked' };
  var sh = accountSheet_(), row = accountFind_(sh, ACCOUNT_COL.email, email);
  var stored = row ? String(sh.getRange(row, ACCOUNT_COL.pw).getValue() || '') : '';
  if (!stored || !accountPwCheck_(pw, stored)) {
    accountPwFails_(fk, true);
    return { error: 'bad_login' };
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    CacheService.getScriptCache().remove(fk);
    return accountSessionOut_(sh, row, email, false, 'password');
  } finally {
    lock.releaseLock();
  }
}

/* "Continue with Google": the Google ID token from the website is checked with Google, then the student is signed in
   (a new account is made the first time). Needs Script Property GOOGLE_CLIENT_ID. */
function accountGoogle_(body) {
  var g = accountGoogleEmail_(body.credential);
  if (g.error) return g;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    return accountOpen_(accountSheet_(), g.email, 'google');
  } finally {
    lock.releaseLock();
  }
}
/* {email} of a Google ID token that is valid, meant for EDUPLAN and has a verified email; otherwise {error}. */
function accountGoogleEmail_(credential) {
  var ids = String(PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '').split(/[,\s]+/).filter(Boolean);
  if (!ids.length) return { error: 'google_off' };
  var t = String(credential || '');
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(t) || t.length > 4096) return { error: 'google_failed' };
  try {
    var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(t), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { error: 'google_failed' };
    var info = JSON.parse(res.getContentText());
    var email = accountEmail_(info.email);
    if (ids.indexOf(String(info.aud)) < 0 || !/^(https:\/\/)?accounts\.google\.com$/.test(String(info.iss)) ||
        !(info.email_verified === true || info.email_verified === 'true') || !(Number(info.exp) * 1000 > Date.now()) || !email) return { error: 'google_failed' };
    return { email: email };
  } catch (err) {
    console.warn('google sign-in check failed: ' + err);
    return { error: 'busy' };
  }
}

/* A new session for a student's row: {token, email, days, data, staff?, portal?}. Call inside the script lock. */
function accountSessionOut_(sh, row, email, isNew, how) {
  var now = new Date();
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var list = accountSessions_(sh.getRange(row, ACCOUNT_COL.sessions).getValue());
  list.push({ h: accountHash_('session:' + token), x: now.getTime() + ACCOUNT_SESSION_DAYS * 864e5 });
  sh.getRange(row, ACCOUNT_COL.sessions).setValue(accountSessionsText_(list.slice(-ACCOUNT_MAX_SESSIONS)));
  sh.getRange(row, ACCOUNT_COL.signin).setValue(now);
  statsActive_(sh, row); statsLog_(email, isNew ? 'Registered' : 'Signed in');   // Stats.gs
  var out = { token: token, email: email, days: ACCOUNT_SESSION_DAYS, data: accountData_(sh, row) };
  if (accountIsStaff_(email)) out.staff = true;   // the website opens its staff page (#staff)
  var portal = accountStaffPortal_(email);
  if (portal) out.portal = portal;
  out.has_password = !!String(sh.getRange(row, ACCOUNT_COL.pw).getValue() || '');
  return out;
}

function accountLoad_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  statsActive_(sh, s.row);
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
      // My results: only the grades read from a results slip for this student are kept (Results.gs).
      if (k === 'results') v = { exams: resultsVerified_(v.exams, String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase()), at: v.at };
      // My profile: the name counts as verified only when Identity.gs checked it for this student.
      if (k === 'profile' && v.f && v.f.idv && !idVerified_(v.f.idv, String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase())) delete v.f.idv;
      if (!cur[k] || at > (Number(cur[k].at) || 0)) { v.at = at; cur[k] = v; }
    });
    var json = JSON.stringify(cur);
    if (json.length > ACCOUNT_MAX_DATA) return { error: 'too_large' };
    sh.getRange(s.row, ACCOUNT_COL.saved, 1, 8).setValues([[new Date()].concat(accountSummary_(cur), [json, accountSessionsText_(s.list)])]);
    statsActive_(sh, s.row);
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
    if (s) {
      sh.getRange(s.row, ACCOUNT_COL.sessions).setValue(accountSessionsText_(s.list.filter(function (x) { return x.h !== s.h; })));
      statsLog_(sh.getRange(s.row, ACCOUNT_COL.email).getValue(), 'Signed out');
    }
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
    statsLog_(sh.getRange(s.row, ACCOUNT_COL.email).getValue(), 'Deleted portfolio');
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
