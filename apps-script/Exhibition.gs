/**
 * EDUPLAN Activity (EDUPLAN 活动): organisers open education fairs and talks with a limited number of seats,
 * students, parents and teachers sign up for a seat (no account), and Eduplan staff (admins) approve new organisers and
 * their events. Website: exhibition/ (exhibition/expo.js).
 *
 * Each event has talk seats for visitors (column seats) and, when the organiser opens them (mode "both"), booths for
 * schools (column booth_capacity) that schools book and the organiser accepts or rejects. Mode "seats" opens only the
 * seats. Rows saved before the mode column existed (mode empty) used booth_capacity as their seats.
 *
 * Event titles and descriptions are shown in English or 中文 as the visitor chooses: the organiser writes them in one
 * language and may type the translation (title_tr, description_tr); left empty, it is made by Claude when the event is
 * saved or approved (Script Property ANTHROPIC_API_KEY, the same key as the chat; CHAT_MODEL). tr_src remembers the text
 * the translation was made from, so an edited title or description gets a fresh translation. Run expoTranslateAll once
 * from the editor to translate events saved before this.
 *
 * Share links with the event's own picture: WhatsApp and Facebook read the preview (title, text, picture) from the page
 * a link opens, and the website itself is one page for every event. So for each published event the script writes a
 * small page exhibition/e/<id>.html to the website's GitHub repository (title, date, venue and the organiser's cover
 * picture as the preview; it forwards visitors to the event). Needs Script Property GITHUB_TOKEN: a fine-grained GitHub
 * token for this repository only, with "Contents: Read and write". Optional GITHUB_REPO and GITHUB_BRANCH (defaults
 * below). The page is (re)written when an event is approved or a published event is edited; run expoSharePagesAll once
 * for events published before this. The share buttons use the page once it exists (column share_page).
 *
 * The website POSTs to the same /exec URL as everything else; doPost in Code.gs sends every "expo_*" action here:
 *   expo_public                                   upcoming published events (no sign-in, no contact details)
 *   expo_login {email,password}                    email and password -> {token, me}
 *   expo_code {email,purpose} / expo_setpw {email,code,password}   create the login or reset the password: the emailed
 *                                                 code proves the email once, then the password is set -> {token, me}
 *   expo_google {credential}                       "Continue with Google" (Account.gs accountGoogleEmail_) -> {token, me}
 *   expo_verify {email,code}                       older code-only sign-in, kept for pages still cached
 *   expo_me / expo_logout {token}
 *   expo_register {token, role, ...}              first sign-in: choose organiser or exhibitor (one role per account)
 *   Organiser: expo_event_save, expo_my_events, expo_event_regs, expo_reg_decide, expo_event_cancel
 *   Exhibitor: expo_events, expo_apply, expo_my_regs, expo_withdraw
 *   Admin:     expo_admin_list, expo_admin_user, expo_admin_event
 *   Visitors:  expo_attend {event_id, name, email, phone, who, school, people, consent}   no sign-in: students and parents
 *              sign up to attend a published event; organisers see the list with expo_event_attendees {token, event_id}
 *
 * Every rule is checked here, never only in the browser: no events or registrations for past dates, the deadline is
 * before the event, booked booths never exceed the event's capacity, one registration per school per event, and each
 * action checks the caller's role and that the event or registration is theirs. Writes run inside the script lock, so
 * two schools booking the last booth at the same moment cannot both get it.
 *
 * Data: private spreadsheet "EDUPLAN Activitys" in "Eduplan Databases/5. Exhibitions (private)" (Drive.gs) with the
 * tabs Users, Events, Registrations, Attendees and Sessions. Event cover images go to "Event covers (public links)" in the same
 * folder and are viewable by anyone with the link. School contact details are only sent to the organiser of the event
 * the school registered for. Session tokens and codes are kept only as SHA-256 hashes (Account.gs helpers).
 *
 * Script Properties (Project Settings > Script Properties):
 *   EXPO_ADMIN_EMAILS  comma-separated emails of Eduplan staff who review organisers and events (required)
 *   EXPO_SITE_URL      address of the exhibition website for links in emails (default below)
 * Set by the script itself: EXPO_SHEET_ID, EXPO_COVERS_ID, DRIVE_EXPO_ID.
 * Tests: node tools/test-exhibition.js. Try it locally: node tools/expo-dev-server.js. See docs/exhibition-setup.md.
 */

var EXPO_TZ = 'Asia/Kuala_Lumpur';
var EXPO_SESSION_DAYS = 30;
var EXPO_MAX_BOOTHS = 1000;
var EXPO_MAX_SEATS = 5000;
var EXPO_COVER_BYTES = 2 * 1024 * 1024;
var EXPO_SITE_DEFAULT = 'https://admineduplan2026.github.io/Further-Study-Tools/exhibition/';
var EXPO_GITHUB_REPO = 'Admineduplan2026/Further-Study-Tools';
var EXPO_GITHUB_BRANCH = 'claude/website-eduplan-artifacts-mb4z44';   // the branch GitHub Pages publishes
var EXPO_COLS = {
  users: ['id', 'role', 'email', 'name', 'position', 'phone', 'org_name', 'school_type', 'website', 'status', 'review_note', 'consent_at', 'created_at'],
  events: ['id', 'organiser_id', 'title', 'description', 'date', 'start_time', 'end_time', 'venue', 'address', 'city', 'state', 'booth_capacity',
    'registration_deadline', 'booth_fee', 'cover_image', 'status', 'review_note', 'approved_at', 'created_at', 'updated_at', 'seats', 'mode',
    'title_tr', 'description_tr', 'tr_src', 'share_page'],
  registrations: ['id', 'event_id', 'exhibitor_id', 'booths_requested', 'topics', 'special_needs', 'status', 'organiser_note', 'created_at', 'updated_at'],
  attendees: ['id', 'event_id', 'name', 'email', 'phone', 'who', 'school', 'people', 'status', 'consent_at', 'created_at', 'updated_at'],
  sessions: ['h', 'email', 'exp'],
  notify: ['event_id', 'next_student', 'next_school', 'sent', 'created_at', 'done_at'],
  unsubscribed: ['h', 'at'],
  logins: ['email', 'pw', 'updated_at']   // passwords (Account.gs accountPwMake_), one row per email
};
var EXPO_TABS = { users: 'Users', events: 'Events', registrations: 'Registrations', attendees: 'Attendees', sessions: 'Sessions', notify: 'Notify', unsubscribed: 'Unsubscribed', logins: 'Logins' };
var EXPO_MAIL_RESERVE = 25;   // emails a day kept for sign-in codes and application notices
var EXPO_STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak',
  'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'];
var EXPO_SCHOOL_TYPES = ['university', 'college', 'secondary', 'other'];
var EXPO_VISITOR_TYPES = ['student', 'parent', 'teacher', 'other'];
var EXPO_MAX_PEOPLE = 10;   // people one visitor sign-up may bring, themselves included
/* Stored event status: draft, pending (waiting for an admin), published, rejected (by an admin), closed (by the
   organiser) or cancelled. A published event whose registration deadline has passed is shown as closed. */
var EXPO_EVENT_STATUS = ['draft', 'pending', 'published', 'rejected', 'closed', 'cancelled'];

function expoAction_(body) {
  var a = String(body && body.action || '');
  if (a === 'expo_public') return expoPublic_();
  if (a === 'expo_code') return expoCode_(body);
  if (a === 'expo_verify') return expoVerify_(body);
  if (a === 'expo_login') return expoLogin_(body);
  if (a === 'expo_setpw') return expoSetPw_(body);
  if (a === 'expo_google') return expoGoogle_(body);
  if (a === 'expo_unsub') return expoUnsub_(body);
  if (a === 'expo_attend') return expoAttend_(body);
  var who = expoAuth_(body.token);
  if (!who) return { error: 'signed_out' };
  switch (a) {
    case 'expo_me': return { me: expoMe_(who) };
    case 'expo_logout': return expoLocked_(function () { expoStore_().table('sessions').update('h', who.h, { exp: '0' }); return { ok: true }; });
    case 'expo_register': return expoRegister_(who, body);
    case 'expo_event_save': return expoEventSave_(who, body);
    case 'expo_my_events': return expoMyEvents_(who);
    case 'expo_event_regs': return expoEventRegs_(who, body);
    case 'expo_reg_decide': return expoRegDecide_(who, body);
    case 'expo_event_cancel': return expoEventCancel_(who, body);
    case 'expo_event_attendees': return expoEventAttendees_(who, body);
    case 'expo_events': return expoOpenEvents_(who, body);
    case 'expo_apply': return expoApply_(who, body);
    case 'expo_my_regs': return expoMyRegs_(who);
    case 'expo_withdraw': return expoWithdraw_(who, body);
    case 'expo_admin_list': return expoAdminList_(who);
    case 'expo_admin_user': return expoAdminUser_(who, body);
    case 'expo_admin_event': return expoAdminEvent_(who, body);
  }
  return { error: 'bad_request' };
}

/* ---------- Storage: one table per tab, rows as objects of strings ---------- */

/* The tables of "EDUPLAN Activitys"; tools/test-exhibition.js replaces this with an in-memory store. */
function expoStore_() {
  if (expoStore_.cached) return expoStore_.cached;
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('EXPO_SHEET_ID'), ss = id && driveSheetLive_(id);
  if (!ss) {
    ss = SpreadsheetApp.create('EDUPLAN Activitys');
    DriveApp.getFileById(ss.getId()).moveTo(driveFolder_('expo'));
    props.setProperty('EXPO_SHEET_ID', ss.getId());
  }
  expoStore_.cached = { table: function (name) { return expoSheetTable_(ss, name); } };
  return expoStore_.cached;
}

/* A cell that Sheets already turned into a date (rows saved before plain-text writes) is read back as the text it was. */
function expoCellDate_(d, col, tz) {
  if (/_time$/.test(col)) return Utilities.formatDate(d, tz, 'HH:mm');
  if (col === 'date' || col === 'registration_deadline') return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  return Utilities.formatDate(d, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function expoSheetTable_(ss, name) {
  var cols = EXPO_COLS[name], sh = ss.getSheetByName(EXPO_TABS[name]);
  if (!sh) {
    var first = ss.getSheets()[0];
    sh = ss.getSheets().length === 1 && first.getLastRow() === 0 && !(first.getName() in { Users: 1, Events: 1, Registrations: 1, Attendees: 1, Sessions: 1, Notify: 1, Unsubscribed: 1, Logins: 1 })
      ? first.setName(EXPO_TABS[name]) : ss.insertSheet(EXPO_TABS[name]);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');   // plain text: dates and phone numbers stay as typed
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#e4f2fa');
    sh.setFrozenRows(1);
  }
  /* Columns added later (e.g. seats and mode on Events) get their header the first time the tab is read. */
  else if (sh.getLastColumn() < cols.length) {
    var have = sh.getLastColumn();
    sh.getRange(1, have + 1, sh.getMaxRows(), cols.length - have).setNumberFormat('@');
    sh.getRange(1, have + 1, 1, cols.length - have).setValues([cols.slice(have)]).setFontWeight('bold').setBackground('#e4f2fa');
  }
  var tz = ss.getSpreadsheetTimeZone();
  function read() {
    var n = sh.getLastRow();
    if (n < 2) return [];
    return sh.getRange(2, 1, n - 1, cols.length).getValues().map(function (r, i) {
      var o = { _row: i + 2 };
      cols.forEach(function (c, j) { o[c] = r[j] instanceof Date ? expoCellDate_(r[j], c, tz) : r[j] == null ? '' : String(r[j]); });
      return o;
    });
  }
  return {
    all: read,
    /* setValues on a plain-text row: appendRow would turn "2026-10-31" or "09:00" into dates and drop the 0 of phone numbers. */
    insert: function (o) {
      sh.getRange(sh.getLastRow() + 1, 1, 1, cols.length).setNumberFormat('@')
        .setValues([cols.map(function (c) { return o[c] == null ? '' : String(o[c]); })]);
    },
    update: function (key, value, patch) {
      var rows = read();
      for (var i = 0; i < rows.length; i++) {
        if (rows[i][key] !== value) continue;
        cols.forEach(function (c, j) { if (c in patch) sh.getRange(rows[i]._row, j + 1).setNumberFormat('@').setValue(String(patch[c])); });
        return true;
      }
      return false;
    }
  };
}

function expoFind_(table, key, value) {
  var rows = expoStore_().table(table).all();
  for (var i = 0; i < rows.length; i++) if (rows[i][key] === value) return rows[i];
  return null;
}

/* Runs a write under the script lock so checks and writes cannot interleave with another request. */
function expoLocked_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- Values ---------- */

/* Today in Malaysia, yyyy-MM-dd. Tests replace it to fix the date. */
function expoToday_() { return Utilities.formatDate(new Date(), EXPO_TZ, 'yyyy-MM-dd'); }
function expoStamp_() { return Utilities.formatDate(new Date(), EXPO_TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function expoId_(prefix) { return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase(); }

function expoDate_(v) {
  var s = String(v || '').trim(), m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? s : '';
}
function expoTime_(v) { var s = String(v || '').trim(); return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : ''; }

/* Typed text, kept as plain text in the sheet (never a formula). Line breaks are kept when lines is true. */
function expoText_(v, max, lines) {
  var s = String(v == null ? '' : v).replace(lines ? /[\u0000-\u0009\u000b-\u001f]/g : /[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function expoUrl_(v) { var s = String(v || '').trim().slice(0, 300); return /^https?:\/\/[^\s"'<>]+\.[^\s"'<>]+$/i.test(s) ? s : ''; }
function expoPhone_(v) { var s = String(v || '').replace(/[^\d+\-\s()]/g, '').trim().slice(0, 30); return s.replace(/\D/g, '').length >= 7 ? s : ''; }
function expoInt_(v) { var n = Number(v); return isFinite(n) && Math.floor(n) === n ? n : NaN; }

/* ---------- Sign-in (same one-time code as Account.gs, separate accounts) ---------- */

function expoAdmins_() {
  var v = PropertiesService.getScriptProperties().getProperty('EXPO_ADMIN_EMAILS') || '';
  return v.split(/[,;\s]+/).map(accountEmail_).filter(Boolean);
}

function expoCode_(body) {
  var email = accountEmail_(body.email);
  if (!email) return { error: 'bad_email' };
  var cache = CacheService.getScriptCache(), k = 'expo-otp-' + accountHash_(email), code;
  var r = expoLocked_(function () {
    if (cache.get(k + ':wait')) return { error: 'wait' };
    var sent = Number(cache.get(k + ':sent')) || 0;
    if (sent >= ACCOUNT_CODES_PER_6H) return { error: 'too_many' };
    if (!accountMailAllowed_()) return { error: 'daily_limit' };
    code = ('00000' + (parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000)).slice(-6);
    cache.put(k, JSON.stringify({ h: accountHash_(code + ':' + email), n: 0 }), ACCOUNT_CODE_MINUTES * 60);
    cache.put(k + ':wait', '1', 60);
    cache.put(k + ':sent', String(sent + 1), 21600);
    return { ok: true };
  });
  if (r.error) return r;
  var reset = body.purpose === 'reset';
  MailApp.sendEmail({
    to: email, name: 'EDUPLAN 活动', subject: (reset ? 'EDUPLAN 活动重设密码 / Password reset code: ' : 'EDUPLAN 活动验证码 / Exhibition verification code: ') + code,
    body: '你的 EDUPLAN 活动验证码是 ' + code + '，' + ACCOUNT_CODE_MINUTES + ' 分钟内有效，' + (reset ? '用来设定新密码。' : '用来确认电邮、设定密码。') + '\n' +
      'Your EDUPLAN Activity verification code is ' + code + '. It expires in ' + ACCOUNT_CODE_MINUTES + ' minutes' + (reset ? ' and lets you set a new password.' : ' and confirms your email so you can set your password.') + '\n\n' +
      '如果你没有申请这个验证码，请忽略这封电邮。If you did not ask for this code, you can ignore this email.'
  });
  return { ok: true };
}

/* Checks (and uses up) the emailed code; null when right, otherwise {error}. Call inside the script lock. */
function expoUseCode_(email, code) {
  var cache = CacheService.getScriptCache(), k = 'expo-otp-' + accountHash_(email), rec = null;
  try { rec = JSON.parse(cache.get(k) || 'null'); } catch (err) { rec = null; }
  if (!rec) return { error: 'expired' };
  if (rec.h !== accountHash_(code + ':' + email)) {
    rec.n++;
    if (rec.n >= ACCOUNT_CODE_TRIES) cache.remove(k); else cache.put(k, JSON.stringify(rec), ACCOUNT_CODE_MINUTES * 60);
    return { error: 'bad_code' };
  }
  cache.remove(k);
  return null;
}
/* A new session for an email: {token, me}. Call inside the script lock. */
function expoSession_(email) {
  var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').toLowerCase().slice(0, 64);
  var h = accountHash_('expo-session:' + token);
  expoStore_().table('sessions').insert({ h: h, email: email, exp: String(Date.now() + EXPO_SESSION_DAYS * 86400000) });
  return { token: token, me: expoMe_(expoWho_(email, h)) };
}

function expoVerify_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return { error: 'bad_code' };
  return expoLocked_(function () {
    var bad = expoUseCode_(email, code);
    return bad || expoSession_(email);
  });
}

/* Create the login or reset the password: the emailed code proves the email, then the password is saved. */
function expoSetPw_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email) return { error: 'bad_email' };
  if (!accountPwOk_(body.password)) return { error: 'weak_password' };
  if (code.length !== 6) return { error: 'bad_code' };
  var hash = accountPwMake_(body.password);
  return expoLocked_(function () {
    var bad = expoUseCode_(email, code);
    if (bad) return bad;
    var t = expoStore_().table('logins'), row = { pw: hash, updated_at: expoStamp_() };
    if (!t.update('email', email, row)) { row.email = email; t.insert(row); }
    CacheService.getScriptCache().remove('expo-pwfail-' + accountHash_(email));
    return expoSession_(email);
  });
}

/* Email and password; the same answer for an unknown email and a wrong password. 8 wrong tries per email in 15 minutes. */
function expoLogin_(body) {
  var email = accountEmail_(body.email), pw = String(body.password == null ? '' : body.password);
  if (!email || !pw) return { error: 'bad_login' };
  var fk = 'expo-pwfail-' + accountHash_(email);
  if (accountPwFails_(fk, false) >= ACCOUNT_PW_TRIES) return { error: 'locked' };
  var rec = expoFind_('logins', 'email', email);
  if (!rec || !accountPwCheck_(pw, rec.pw)) { accountPwFails_(fk, true); return { error: 'bad_login' }; }
  CacheService.getScriptCache().remove(fk);
  return expoLocked_(function () { return expoSession_(email); });
}

/* "Continue with Google" (Script Property GOOGLE_CLIENT_ID; the token is checked with Google in Account.gs). */
function expoGoogle_(body) {
  var g = accountGoogleEmail_(body.credential);
  if (g.error) return g;
  return expoLocked_(function () { return expoSession_(g.email); });
}

/* The caller of a request: {email, h, user (or null), admin}. */
function expoAuth_(token) {
  if (!/^[0-9a-f]{64}$/.test(String(token || ''))) return null;
  var h = accountHash_('expo-session:' + token), s = expoFind_('sessions', 'h', h);
  if (!s || !(Number(s.exp) > Date.now())) return null;
  return expoWho_(s.email, h);
}
function expoWho_(email, h) {
  return { email: email, h: h, user: expoFind_('users', 'email', email), admin: expoAdmins_().indexOf(email) >= 0 };
}

function expoUserOut_(u) {
  return { id: u.id, role: u.role, email: u.email, name: u.name, position: u.position, phone: u.phone, org_name: u.org_name,
    school_type: u.school_type, website: u.website, status: u.status, approved: u.status === 'approved', review_note: u.review_note };
}
function expoMe_(who) {
  if (who.admin) return { role: 'admin', email: who.email, approved: true };
  return who.user ? expoUserOut_(who.user) : { role: null, email: who.email };
}

function expoRegister_(who, body) {
  if (who.admin) return { error: 'admin_account' };
  var role = String(body.role || '');
  if (role !== 'organiser' && role !== 'exhibitor') return { error: 'bad_role' };
  if (body.consent !== true) return { error: 'consent' };
  var u = {
    role: role, email: who.email, name: expoText_(body.name, 100), position: expoText_(body.position, 100), phone: expoPhone_(body.phone),
    org_name: expoText_(body.org_name, 160), school_type: '', website: '', review_note: ''
  };
  var missing = ['org_name', 'name', 'position', 'phone'].filter(function (f) { return !u[f]; });
  if (role === 'exhibitor') {
    u.school_type = EXPO_SCHOOL_TYPES.indexOf(String(body.school_type)) >= 0 ? String(body.school_type) : '';
    u.website = expoUrl_(body.website);
    if (!u.school_type) missing.push('school_type');
    if (!u.website) missing.push('website');
  }
  if (missing.length) return { error: 'missing', fields: missing };
  var r = expoLocked_(function () {
    if (expoFind_('users', 'email', who.email)) return { error: 'already_registered' };   // one role per account
    u.id = expoId_(role === 'organiser' ? 'ORG' : 'EXH');
    u.status = role === 'organiser' ? 'pending' : 'approved';   // new organisers wait for an Eduplan admin
    u.consent_at = u.created_at = expoStamp_();
    expoStore_().table('users').insert(u);
    return { me: expoUserOut_(u) };
  });
  if (!r.error && role === 'organiser') {
    expoMail_(expoAdmins_(), '新的主办方待审核 New organiser to review: ' + u.org_name,
      u.org_name + '（' + u.name + '，' + u.position + '，' + u.email + '，' + u.phone + '）申请成为教育展主办方。\n请到 ' + expoSite_() + '#/admin 审核。');
  }
  return r;
}

/* ---------- Events and booths ---------- */

function expoBooths_(eventId, regs) {
  var t = { accepted: 0, pending: 0, count: 0 };
  regs.forEach(function (r) {
    if (r.event_id !== eventId) return;
    var n = Number(r.booths_requested) || 0;
    if (r.status === 'accepted') { t.accepted += n; t.count++; } else if (r.status === 'pending') { t.pending += n; t.count++; }
  });
  t.taken = t.accepted + t.pending;   // pending requests hold their booths, so the event is never overbooked
  return t;
}

/* Status as students and schools see it: a published event whose deadline has passed is closed for registration. */
function expoState_(e, today) {
  if (e.status === 'published' && (e.registration_deadline < today || e.date < today)) return 'closed';
  return e.status;
}
function expoOpen_(e, today) { return e.status === 'published' && e.date >= today && e.registration_deadline >= today; }

/* People signed up to attend an event (expo_attend), counting the guests each visitor brings. */
function expoGoing_(eventId, att) {
  var n = 0;
  (att || []).forEach(function (a) { if (a.event_id === eventId && a.status === 'going') n += Number(a.people) || 1; });
  return n;
}
/* Visitors can sign up for a published event until its registration deadline (which may be the event day). */
function expoCanAttend_(e, today) { return e.status === 'published' && e.date >= today && e.registration_deadline >= today; }

/* Seats for visitors and booths for schools of an event (see the header: rows without a mode used booth_capacity as seats). */
function expoSeatsOf_(e) { return e.mode ? Number(e.seats) || 0 : Number(e.booth_capacity) || 0; }
function expoBoothsOf_(e) { return e.mode === 'both' ? Number(e.booth_capacity) || 0 : 0; }
/* Schools can book while booths are open, the event is published and the deadline has not passed. */
function expoBoothsOpen_(e, today) { return expoBoothsOf_(e) > 0 && expoOpen_(e, today); }

function expoEventOut_(e, regs, today, org, att) {
  if (!att) att = expoStore_().table('attendees').all();
  if (!regs) regs = expoStore_().table('registrations').all();
  var cap = expoSeatsOf_(e), taken = expoGoing_(e.id, att), bcap = expoBoothsOf_(e), b = expoBooths_(e.id, regs);
  var out = {
    id: e.id, title: e.title, description: e.description, date: e.date, start_time: e.start_time, end_time: e.end_time, venue: e.venue,
    address: e.address, city: e.city, state: e.state, registration_deadline: e.registration_deadline, mode: e.mode === 'both' ? 'both' : 'seats',
    seats: cap, cover_image: e.cover_image, status: expoState_(e, today), organiser: org ? org.org_name : '',
    remaining: Math.max(0, cap - taken), full: taken >= cap, open: expoOpen_(e, today),
    going: taken, can_attend: expoCanAttend_(e, today) && taken < cap,
    booths: bcap, booth_fee: bcap ? Number(e.booth_fee) || 0 : 0, booths_remaining: Math.max(0, bcap - b.taken), booths_full: bcap > 0 && b.taken >= bcap,
    booths_open: expoBoothsOpen_(e, today)
  };
  var tr = expoTr_(e);
  out.src_lang = tr.src; out.title_zh = tr.title_zh; out.title_en = tr.title_en; out.description_zh = tr.description_zh; out.description_en = tr.description_en;
  out.title_tr = e.title_tr || ''; out.description_tr = e.description_tr || '';
  out.share_page = e.share_page ? 'e/' + e.id + '.html' : '';
  return out;
}

function expoPublic_() {
  var today = expoToday_(), st = expoStore_(), regs = st.table('registrations').all(), users = st.table('users').all(), att = st.table('attendees').all();
  var events = st.table('events').all().filter(function (e) { return e.status === 'published' && e.date >= today; })
    .sort(function (a, b) { return (a.date + a.start_time).localeCompare(b.date + b.start_time); });
  return { today: today, events: events.map(function (e) { return expoEventOut_(e, regs, today, expoById_(users, e.organiser_id), att); }) };
}
function expoById_(rows, id) { for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i]; return null; }

function expoRole_(who, role) {
  if (role === 'admin') return who.admin ? null : { error: 'forbidden' };
  if (!who.user) return { error: 'not_registered' };
  if (who.user.role !== role) return { error: 'forbidden' };
  return null;
}

/* Checks an event form; returns {e} with clean values or {error, fields}. */
function expoEventCheck_(f, today) {
  var e = {
    title: expoText_(f.title, 140), description: expoText_(f.description, 3000, true), date: expoDate_(f.date),
    start_time: expoTime_(f.start_time), end_time: expoTime_(f.end_time), venue: expoText_(f.venue, 160), address: expoText_(f.address, 300),
    city: expoText_(f.city, 80), state: EXPO_STATES.indexOf(String(f.state)) >= 0 ? String(f.state) : '',
    seats: expoInt_(f.seats), registration_deadline: expoDate_(f.registration_deadline), mode: f.mode === 'both' ? 'both' : 'seats',
    booth_capacity: f.mode === 'both' ? expoInt_(f.booths) : 0, booth_fee: f.mode === 'both' ? Number(f.booth_fee) : 0,
    title_tr: expoText_(f.title_tr, 140), description_tr: expoText_(f.description_tr, 3000, true)
  };
  var bad = [];
  ['title', 'description', 'date', 'start_time', 'end_time', 'venue', 'address', 'city', 'state', 'registration_deadline'].forEach(function (k) { if (!e[k]) bad.push(k); });
  if (bad.length) return { error: 'missing', fields: bad };
  if (e.date < today) return { error: 'past_date', fields: ['date'] };
  if (e.end_time <= e.start_time) return { error: 'bad_time', fields: ['end_time'] };
  if (e.registration_deadline > e.date) return { error: 'deadline_after_event', fields: ['registration_deadline'] };
  if (e.registration_deadline < today) return { error: 'past_deadline', fields: ['registration_deadline'] };
  if (!(e.seats > 0) || e.seats > EXPO_MAX_SEATS) return { error: 'bad_capacity', fields: ['seats'] };
  if (e.mode === 'both') {
    if (!(e.booth_capacity > 0) || e.booth_capacity > EXPO_MAX_BOOTHS) return { error: 'bad_booths', fields: ['booths'] };
    if (!isFinite(e.booth_fee) || e.booth_fee < 0 || e.booth_fee > 1000000) return { error: 'bad_fee', fields: ['booth_fee'] };
    e.booth_fee = Math.round(e.booth_fee * 100) / 100;
  }
  return { e: e };
}

/* Create or edit an event. submit: true sends it for review (or publishes it again once an admin has approved it). */
function expoEventSave_(who, body) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var today = expoToday_(), chk = expoEventCheck_(body.event || {}, today), submit = body.submit === true;
  if (chk.error) return chk;
  if (submit && who.user.status !== 'approved') return { error: 'organiser_not_approved' };
  var cover = '';
  if (body.cover && body.cover.data) {
    cover = expoSaveCover_(body.cover);
    if (cover.error) return cover;
  }
  expoTrPrepare_(chk.e, String((body.event || {}).id || ''));
  var r = expoLocked_(function () {
    var st = expoStore_(), events = st.table('events'), id = String((body.event || {}).id || ''), old = id ? expoFind_('events', 'id', id) : null, e = chk.e;
    if (id && !old) return { error: 'not_found' };
    if (old && old.organiser_id !== who.user.id) return { error: 'forbidden' };   // organisers only touch their own events
    if (old && old.status === 'cancelled') return { error: 'cancelled' };
    var att = old ? st.table('attendees').all() : [], taken = old ? expoGoing_(old.id, att) : 0;
    var b = old ? expoBooths_(old.id, st.table('registrations').all()) : { taken: 0, count: 0 };
    if (e.seats < taken) return { error: 'capacity_below_booked', fields: ['seats'], booked: taken };
    if (b.taken && e.mode !== 'both') return { error: 'has_booths', fields: ['mode'], booked: b.taken };   // schools have booked: booths stay open
    if (e.booth_capacity < b.taken) return { error: 'booths_below_booked', fields: ['booths'], booked: b.taken };
    if (!submit && (taken || b.count)) return { error: 'has_registrations' };   // an event people signed up for cannot go back to draft
    e.status = !submit ? 'draft' : old && old.approved_at ? 'published' : 'pending';
    e.updated_at = expoStamp_();
    if (cover) e.cover_image = cover;
    if (old) {
      if (old.status === 'closed' && submit) e.status = 'published';
      events.update('id', old.id, e);
      e.id = old.id;
    } else {
      e.id = expoId_('EV');
      e.organiser_id = who.user.id;
      e.created_at = e.updated_at;
      e.cover_image = cover;
      e.review_note = e.approved_at = '';
      events.insert(e);
    }
    return { ok: true, id: e.id, status: e.status };
  });
  if (r.ok && r.status === 'published') expoSharePage_(r.id);
  if (r.ok && r.status === 'pending') {
    expoMail_(expoAdmins_(), '新的教育展活动待审核 New event to review: ' + chk.e.title,
      who.user.org_name + ' 提交了活动「' + chk.e.title + '」（' + chk.e.date + '，' + chk.e.venue + '，' + chk.e.city + '）。\n请到 ' + expoSite_() + '#/admin 审核。');
  }
  return r;
}

function expoMyEvents_(who) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var today = expoToday_(), st = expoStore_(), regs = st.table('registrations').all(), att = st.table('attendees').all();
  var list = st.table('events').all().filter(function (e) { return e.organiser_id === who.user.id; })
    .sort(function (a, b) { return b.date.localeCompare(a.date); })
    .map(function (e) {
      var o = expoEventOut_(e, regs, today, who.user, att), b = expoBooths_(e.id, regs);
      o.visitors = att.filter(function (a) { return a.event_id === e.id && a.status === 'going'; }).length;
      o.accepted_booths = b.accepted; o.pending_booths = b.pending; o.registrations = b.count; o.review_note = e.review_note;
      o.approved = !!e.approved_at; o.stored_status = e.status;
      return o;
    });
  return { me: expoUserOut_(who.user), events: list };
}

/* An organiser's own event, or an error. */
function expoOwnEvent_(who, eventId) {
  var e = expoFind_('events', 'id', String(eventId || ''));
  if (!e) return { error: 'not_found' };
  if (e.organiser_id !== who.user.id) return { error: 'forbidden' };
  return { e: e };
}

function expoEventRegs_(who, body) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var own = expoOwnEvent_(who, body.event_id);
  if (own.error) return own;
  var st = expoStore_(), users = st.table('users').all(), regs = st.table('registrations').all();
  var list = regs.filter(function (r) { return r.event_id === own.e.id; }).map(function (r) {
    var s = expoById_(users, r.exhibitor_id) || {};
    return { id: r.id, booths_requested: Number(r.booths_requested) || 0, topics: r.topics, special_needs: r.special_needs, status: r.status,
      organiser_note: r.organiser_note, created_at: r.created_at,
      school: { org_name: s.org_name, school_type: s.school_type, website: s.website, name: s.name, position: s.position, email: s.email, phone: s.phone } };
  });
  return { event: expoEventOut_(own.e, regs, expoToday_(), who.user), registrations: list };
}

function expoRegDecide_(who, body) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var decision = String(body.decision || '');
  if (decision !== 'accepted' && decision !== 'rejected') return { error: 'bad_request' };
  var note = expoText_(body.note, 300), mail = null;
  var r = expoLocked_(function () {
    var st = expoStore_(), reg = expoFind_('registrations', 'id', String(body.reg_id || ''));
    if (!reg) return { error: 'not_found' };
    var own = expoOwnEvent_(who, reg.event_id);
    if (own.error) return own;
    if (own.e.status === 'cancelled') return { error: 'cancelled' };
    if (reg.status === 'withdrawn') return { error: 'withdrawn' };
    if (decision === 'accepted') {
      var b = expoBooths_(own.e.id, st.table('registrations').all().filter(function (x) { return x.id !== reg.id; }));
      if (b.accepted + (Number(reg.booths_requested) || 0) > expoBoothsOf_(own.e)) return { error: 'full' };
    }
    st.table('registrations').update('id', reg.id, { status: decision, organiser_note: note, updated_at: expoStamp_() });
    var school = expoFind_('users', 'id', reg.exhibitor_id);
    if (school) mail = { to: school.email, title: own.e.title, date: own.e.date };
    return { ok: true, status: decision };
  });
  if (r.ok && mail) {
    expoMail_([mail.to], (decision === 'accepted' ? '摊位报名已接受' : '摊位报名未获接受') + '：' + mail.title,
      '你为「' + mail.title + '」（' + mail.date + '）的摊位报名' + (decision === 'accepted' ? '已获主办方接受。' : '未获主办方接受。') +
      (note ? '\n主办方备注：' + note : '') + '\n\n查看我的报名：' + expoSite_() + '#/ex/my');
  }
  return r;
}

function expoEventCancel_(who, body) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var notify = [], visitors = [], title = '', date = '';
  var r = expoLocked_(function () {
    var own = expoOwnEvent_(who, body.event_id);
    if (own.error) return own;
    if (own.e.status === 'cancelled') return { error: 'cancelled' };
    var st = expoStore_();
    st.table('events').update('id', own.e.id, { status: 'cancelled', updated_at: expoStamp_() });
    var users = st.table('users').all();
    st.table('registrations').all().forEach(function (x) {
      if (x.event_id !== own.e.id || (x.status !== 'pending' && x.status !== 'accepted')) return;
      var s = expoById_(users, x.exhibitor_id);
      if (s) notify.push(s.email);
    });
    st.table('attendees').all().forEach(function (a) { if (a.event_id === own.e.id && a.status === 'going') visitors.push(a.email); });
    title = own.e.title; date = own.e.date;
    return { ok: true };
  });
  if (r.ok && notify.length) {
    expoMail_(notify, '活动已取消：' + title, '主办方已取消教育展「' + title + '」（' + date + '）。你的摊位报名不再有效。\n\n查看我的报名：' + expoSite_() + '#/ex/my');
  }
  if (r.ok && visitors.length) {
    expoMailBcc_(visitors, '活动已取消 Event cancelled：' + title, '主办方已取消教育展「' + title + '」（' + date + '），你的参加报名不再有效。\n' +
      'The organiser has cancelled "' + title + '" (' + date + '). Your sign-up to attend is no longer needed.\n\n其他活动 Other activities：' + expoSite_());
  }
  return r;
}

/* ---------- Visitors (students and parents) ---------- */

/* Sign up to attend a published event. No account is needed: name, email and phone go only to the event's organiser
   and Eduplan. Signing up again with the same email for the same event updates the earlier sign-up. */
function expoAttend_(body) {
  if (body.consent !== true) return { error: 'consent' };
  var v = {
    name: expoText_(body.name, 100), email: accountEmail_(body.email), phone: expoPhone_(body.phone),
    who: EXPO_VISITOR_TYPES.indexOf(String(body.who)) >= 0 ? String(body.who) : '', school: expoText_(body.school, 160),
    people: expoInt_(body.people == null || body.people === '' ? 1 : body.people)
  };
  var missing = ['name', 'email', 'phone', 'who'].filter(function (f) { return !v[f]; });
  if (missing.length) return { error: 'missing', fields: missing };
  if (!(v.people >= 1 && v.people <= EXPO_MAX_PEOPLE)) return { error: 'bad_people', fields: ['people'] };
  var cache = CacheService.getScriptCache(), k = 'expo-attend-' + accountHash_(v.email), n = Number(cache.get(k)) || 0;
  if (n >= 10) return { error: 'too_many' };
  cache.put(k, String(n + 1), 3600);
  var today = expoToday_(), ev = null;
  var r = expoLocked_(function () {
    var st = expoStore_(), e = expoFind_('events', 'id', String(body.event_id || ''));
    if (!e || e.status === 'draft' || e.status === 'pending' || e.status === 'rejected') return { error: 'not_found' };
    if (e.status === 'cancelled') return { error: 'cancelled' };
    if (e.date < today) return { error: 'event_over' };
    if (!expoCanAttend_(e, today)) return { error: 'closed' };
    ev = e;
    var t = st.table('attendees'), all = t.all(), old = null, stamp = expoStamp_();
    all.forEach(function (a) { if (a.event_id === e.id && a.email === v.email) old = a; });
    /* Seats left for this sign-up: the earlier sign-up of the same email gives its seats back first. */
    var left = expoSeatsOf_(e) - expoGoing_(e.id, all) + (old && old.status === 'going' ? Number(old.people) || 1 : 0);
    if (left <= 0) return { error: 'full', remaining: 0 };
    if (v.people > left) return { error: 'not_enough_seats', fields: ['people'], remaining: left };
    var row = { name: v.name, phone: v.phone, who: v.who, school: v.school, people: String(v.people), status: 'going', consent_at: stamp, updated_at: stamp };
    if (old) { t.update('id', old.id, row); return { ok: true, id: old.id, updated: true }; }
    row.id = expoId_('ATT'); row.event_id = e.id; row.email = v.email; row.created_at = stamp;
    t.insert(row);
    return { ok: true, id: row.id, updated: false };
  });
  if (!r.ok) return r;
  /* The confirmation email is skipped when the day's Gmail quota is low: sign-in codes come first. */
  r.emailed = false;
  try {
    if (MailApp.getRemainingDailyQuota() > EXPO_MAIL_RESERVE + 2) {
      r.emailed = expoMail_([v.email], '报名成功 You are signed up：' + ev.title,
        v.name + '，你已报名参加 EDUPLAN 活动：\nYou are signed up for this Eduplan exhibition:\n\n' + ev.title + '\n' +
        '日期 Date：' + ev.date + '，' + ev.start_time + '–' + ev.end_time + '\n地点 Venue：' + ev.venue + '，' + ev.address + '，' + ev.city + '\n' +
        '人数 People：' + v.people + '\n报名编号 Reference：' + r.id + '\n\n活动详情 Details：' + expoSite_() + '#/e/' + ev.id);
    }
  } catch (err) { console.warn('expo attend mail: ' + err); }
  return r;
}

/* The organiser's list of visitors who signed up for one of their events. */
function expoEventAttendees_(who, body) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var own = expoOwnEvent_(who, body.event_id);
  if (own.error) return own;
  var st = expoStore_(), att = st.table('attendees').all();
  var list = att.filter(function (a) { return a.event_id === own.e.id && a.status === 'going'; })
    .sort(function (a, b) { return a.created_at.localeCompare(b.created_at); })
    .map(function (a) { return { id: a.id, name: a.name, email: a.email, phone: a.phone, who: a.who, school: a.school, people: Number(a.people) || 1, created_at: a.created_at }; });
  return { event: expoEventOut_(own.e, st.table('registrations').all(), expoToday_(), who.user, att), attendees: list };
}

/* ---------- Exhibitors ---------- */

function expoOpenEvents_(who, body) {
  var deny = expoRole_(who, 'exhibitor');
  if (deny) return deny;
  var today = expoToday_(), st = expoStore_(), regs = st.table('registrations').all(), users = st.table('users').all();
  var state = String(body.state || ''), city = String(body.city || '').trim().toLowerCase(), from = expoDate_(body.from), to = expoDate_(body.to);
  var mine = {};
  regs.forEach(function (r) { if (r.exhibitor_id === who.user.id && r.status !== 'withdrawn') mine[r.event_id] = r.status; });
  var list = st.table('events').all().filter(function (e) {
    return expoBoothsOpen_(e, today) && (!state || e.state === state) && (!city || e.city.toLowerCase().indexOf(city) >= 0) &&
      (!from || e.date >= from) && (!to || e.date <= to);
  }).sort(function (a, b) { return a.date.localeCompare(b.date); }).map(function (e) {
    var o = expoEventOut_(e, regs, today, expoById_(users, e.organiser_id));
    o.my_status = mine[e.id] || '';
    return o;
  });
  return { events: list };
}

function expoApply_(who, body) {
  var deny = expoRole_(who, 'exhibitor');
  if (deny) return deny;
  var booths = expoInt_(body.booths == null || body.booths === '' ? 1 : body.booths);
  var topics = expoText_(body.topics, 500, true), needs = expoText_(body.special_needs, 500, true), mail = null;
  if (!(booths >= 1) || booths > EXPO_MAX_BOOTHS) return { error: 'bad_booths', fields: ['booths'] };
  if (!topics) return { error: 'missing', fields: ['topics'] };
  var r = expoLocked_(function () {
    var today = expoToday_(), st = expoStore_(), e = expoFind_('events', 'id', String(body.event_id || ''));
    if (!e || e.status === 'draft' || e.status === 'pending' || e.status === 'rejected') return { error: 'not_found' };
    if (e.status === 'cancelled') return { error: 'cancelled' };
    if (!expoBoothsOf_(e)) return { error: 'no_booths' };   // this event opened only talk seats
    if (!expoOpen_(e, today)) return { error: 'closed' };
    var regs = st.table('registrations'), all = regs.all(), prev = null;
    for (var i = 0; i < all.length; i++) if (all[i].event_id === e.id && all[i].exhibitor_id === who.user.id) prev = all[i];
    if (prev && prev.status !== 'withdrawn') return { error: 'duplicate' };   // one registration per school per event
    var b = expoBooths_(e.id, all), left = expoBoothsOf_(e) - b.taken;
    if (left <= 0) return { error: 'full', remaining: 0 };
    if (booths > left) return { error: 'not_enough_booths', remaining: left, fields: ['booths'] };
    var now = expoStamp_(), rec = { event_id: e.id, exhibitor_id: who.user.id, booths_requested: booths, topics: topics, special_needs: needs,
      status: 'pending', organiser_note: '', updated_at: now };
    if (prev) { regs.update('id', prev.id, rec); rec.id = prev.id; }   // a school that withdrew may apply again (same record)
    else { rec.id = expoId_('REG'); rec.created_at = now; regs.insert(rec); }
    var org = expoFind_('users', 'id', e.organiser_id);
    if (org) mail = { to: org.email, title: e.title };
    return { ok: true, id: rec.id, remaining: left - booths };
  });
  if (r.ok && mail) {
    expoMail_([mail.to], '新的摊位报名：' + mail.title,
      who.user.org_name + ' 报名了「' + mail.title + '」的 ' + booths + ' 个摊位。\n展示内容：' + topics + (needs ? '\n特别需求：' + needs : '') +
      '\n\n请到主办方后台接受或拒绝：' + expoSite_() + '#/org');
  }
  return r;
}

function expoMyRegs_(who) {
  var deny = expoRole_(who, 'exhibitor');
  if (deny) return deny;
  var today = expoToday_(), st = expoStore_(), events = st.table('events').all(), users = st.table('users').all(), all = st.table('registrations').all();
  var list = all.filter(function (r) { return r.exhibitor_id === who.user.id; }).map(function (r) {
    var e = expoById_(events, r.event_id) || {};
    return { id: r.id, booths_requested: Number(r.booths_requested) || 0, topics: r.topics, special_needs: r.special_needs, organiser_note: r.organiser_note,
      status: e.status === 'cancelled' && r.status !== 'withdrawn' ? 'cancelled' : r.status, created_at: r.created_at,
      can_withdraw: (r.status === 'pending' || r.status === 'accepted') && e.status !== 'cancelled' && e.registration_deadline >= today,
      event: e.id ? expoEventOut_(e, all, today, expoById_(users, e.organiser_id)) : null };
  }).sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  return { me: expoUserOut_(who.user), registrations: list };
}

function expoWithdraw_(who, body) {
  var deny = expoRole_(who, 'exhibitor');
  if (deny) return deny;
  return expoLocked_(function () {
    var reg = expoFind_('registrations', 'id', String(body.reg_id || ''));
    if (!reg || reg.exhibitor_id !== who.user.id) return { error: 'not_found' };   // schools only see their own registrations
    if (reg.status !== 'pending' && reg.status !== 'accepted') return { error: 'bad_status' };
    var e = expoFind_('events', 'id', reg.event_id);
    if (!e || e.status === 'cancelled') return { error: 'cancelled' };
    if (e.registration_deadline < expoToday_()) return { error: 'closed' };
    expoStore_().table('registrations').update('id', reg.id, { status: 'withdrawn', updated_at: expoStamp_() });
    return { ok: true };
  });
}

/* ---------- Admin (Eduplan staff in EXPO_ADMIN_EMAILS) ---------- */

function expoAdminList_(who) {
  var deny = expoRole_(who, 'admin');
  if (deny) return deny;
  var today = expoToday_(), st = expoStore_(), users = st.table('users').all(), regs = st.table('registrations').all();
  var orgs = users.filter(function (u) { return u.role === 'organiser'; }).map(function (u) { var o = expoUserOut_(u); o.created_at = u.created_at; return o; });
  var events = st.table('events').all().filter(function (e) { return e.status !== 'draft'; })
    .sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || b.date.localeCompare(a.date); })
    .map(function (e) { var org = expoById_(users, e.organiser_id), o = expoEventOut_(e, regs, today, org); o.review_note = e.review_note; o.stored_status = e.status; return o; });
  return { organisers: orgs, events: events };
}

function expoAdminUser_(who, body) {
  var deny = expoRole_(who, 'admin');
  if (deny) return deny;
  var decision = String(body.decision || ''), note = expoText_(body.note, 300), mail = null;
  if (decision !== 'approved' && decision !== 'rejected') return { error: 'bad_request' };
  var r = expoLocked_(function () {
    var u = expoFind_('users', 'id', String(body.user_id || ''));
    if (!u || u.role !== 'organiser') return { error: 'not_found' };
    expoStore_().table('users').update('id', u.id, { status: decision, review_note: note });
    mail = u;
    return { ok: true };
  });
  if (r.ok) {
    expoMail_([mail.email], decision === 'approved' ? 'EDUPLAN 活动：主办方账号已批准' : 'EDUPLAN 活动：主办方账号未获批准',
      decision === 'approved' ? '你的主办方账号（' + mail.org_name + '）已获批准，现在可以提交教育展活动：' + expoSite_() + '#/org'
        : '你的主办方账号（' + mail.org_name + '）未获批准。' + (note ? '\n原因：' + note : '') + '\n如有疑问，请回复 Eduplan。');
  }
  return r;
}

function expoAdminEvent_(who, body) {
  var deny = expoRole_(who, 'admin');
  if (deny) return deny;
  var decision = String(body.decision || ''), note = expoText_(body.note, 300), mail = null;
  if (decision !== 'approved' && decision !== 'rejected') return { error: 'bad_request' };
  var r = expoLocked_(function () {
    var e = expoFind_('events', 'id', String(body.event_id || ''));
    if (!e) return { error: 'not_found' };
    if (e.status !== 'pending') return { error: 'bad_status' };
    var patch = decision === 'approved' ? { status: 'published', approved_at: expoStamp_(), review_note: note } : { status: 'rejected', review_note: note };
    expoStore_().table('events').update('id', e.id, patch);
    if (decision === 'approved' && !expoFind_('notify', 'event_id', e.id))
      expoStore_().table('notify').insert({ event_id: e.id, next_student: 0, next_school: 0, sent: 0, created_at: expoStamp_(), done_at: '' });
    var org = expoFind_('users', 'id', e.organiser_id);
    if (org) mail = { to: org.email, title: e.title };
    return { ok: true, status: patch.status };
  });
  if (r.ok && decision === 'approved') { expoTrFill_(String(body.event_id || '')); expoSharePage_(String(body.event_id || '')); expoNotifySoon_(); }
  if (r.ok && mail) {
    expoMail_([mail.to], (decision === 'approved' ? '活动已发布：' : '活动未获批准：') + mail.title,
      decision === 'approved' ? '你的活动「' + mail.title + '」已通过审核并公开，参展学校现在可以报名摊位。\n' + expoSite_() + '#/org'
        : '你的活动「' + mail.title + '」未通过审核。' + (note ? '\n原因：' + note : '') + '\n你可以修改后再提交：' + expoSite_() + '#/org');
  }
  return r;
}

/* ---------- Event titles in English and 中文 ---------- */

function expoIsZh_(s) { return /[\u4e00-\u9fff]/.test(String(s || '')); }
function expoTrKey_(e) { return accountHash_('tr:' + (e.title || '') + '\n' + (e.description || '')); }
/* The title and description in both languages; the translation is used only when it was made from the current text. */
function expoTr_(e) {
  var src = expoIsZh_(e.title) ? 'zh' : 'en', ok = e.tr_src && e.tr_src === expoTrKey_(e);
  var t = ok && e.title_tr ? e.title_tr : e.title, d = ok && e.description_tr ? e.description_tr : e.description;
  return src === 'zh' ? { src: src, title_zh: e.title, description_zh: e.description, title_en: t, description_en: d }
    : { src: src, title_en: e.title, description_en: e.description, title_zh: t, description_zh: d };
}
/* Before an event is saved: keep a translation the organiser typed (or left as it was for unchanged text); otherwise ask
   Claude for one. Without a key the event is saved untranslated and shown in its own language. */
function expoTrPrepare_(e, id) {
  var old = id ? expoFind_('events', 'id', id) : null, key = expoTrKey_(e);
  var typedNew = old ? (e.title_tr !== (old.title_tr || '') || e.description_tr !== (old.description_tr || '')) : !!(e.title_tr || e.description_tr);
  var same = old && old.tr_src === key;
  if ((e.title_tr || e.description_tr) && (typedNew || same)) { e.tr_src = key; return; }
  var t = expoTranslate_(e.title, e.description, expoIsZh_(e.title) ? 'en' : 'zh');
  if (t) { e.title_tr = t.title; e.description_tr = t.description; e.tr_src = key; }
  else { e.title_tr = ''; e.description_tr = ''; e.tr_src = ''; }
}
/* After approval: translate a published event that has no current translation yet. */
function expoTrFill_(id) {
  var e = expoFind_('events', 'id', id);
  if (!e || (e.tr_src && e.tr_src === expoTrKey_(e))) return false;
  var t = expoTranslate_(e.title, e.description, expoIsZh_(e.title) ? 'en' : 'zh');
  if (!t) return false;
  expoLocked_(function () { expoStore_().table('events').update('id', id, { title_tr: t.title, description_tr: t.description, tr_src: expoTrKey_(e) }); return { ok: true }; });
  return true;
}
/* Run once from the editor (select expoTranslateAll, Run): translates every event that has no current translation. */
function expoTranslateAll() {
  var n = 0;
  expoStore_().table('events').all().forEach(function (e) { if (e.status !== 'cancelled' && expoTrFill_(e.id)) n++; });
  console.log('Translated ' + n + ' event(s).');
}
/* Asks Claude for the title and description in English or Simplified Chinese; {title, description} or null. */
function expoTranslate_(title, description, to) {
  var props = PropertiesService.getScriptProperties(), key = props.getProperty('ANTHROPIC_API_KEY');
  if (!key || !title) return null;
  var lang = to === 'en' ? 'English' : 'Simplified Chinese';
  var req = {
    model: props.getProperty('CHAT_MODEL') || 'claude-haiku-5-5', max_tokens: 3000,
    system: 'You translate education event listings for a Malaysian study-guidance website. Translate the title and the ' +
      'description into ' + lang + '. Keep the meaning exactly; add nothing. Keep names of universities, colleges, schools, ' +
      'places, programmes and people as they are usually written in ' + lang + ' (keep the original when unsure), and keep ' +
      'numbers, dates, times, prices and links unchanged. Keep line breaks. Reply with only a JSON object: {"title": "...", "description": "..."}.',
    messages: [{ role: 'user', content: JSON.stringify({ title: title, description: description || '' }) }]
  };
  try {
    var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, payload: JSON.stringify(req)
    });
    if (res.getResponseCode() !== 200) { console.warn('expo translate ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300)); return null; }
    var data = JSON.parse(res.getContentText());
    var text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
    var m = text.match(/\{[\s\S]*\}/), o = m && JSON.parse(m[0]);
    if (!o || typeof o.title !== 'string' || !o.title.trim()) return null;
    return { title: expoText_(o.title, 140), description: expoText_(o.description || '', 3000, true) };
  } catch (err) {
    console.warn('expo translate failed: ' + err);
    return null;
  }
}

/* ---------- Share pages (link previews with the event's picture) ---------- */

function expoHtml_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
/* A direct picture link for previews: the Drive file of the cover, cropped to 1200 x 630; or the EDUPLAN logo. */
function expoPreviewImage_(cover) {
  var m = /[?&]id=([\w-]+)/.exec(String(cover || ''));
  if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w1200-h630-c';
  if (/^https:\/\//.test(String(cover || ''))) return String(cover);
  return expoSite_().replace(/exhibition\/?$/, '') + 'assets/img/logo.png';
}
/* The share page of an event: link previews read its title, text and picture; people are sent on to the event. */
function expoSharePageHtml_(e) {
  var tr = expoTr_(e), site = expoSite_(), url = site + 'e/' + e.id + '.html', go = '../#/e/' + encodeURIComponent(e.id);
  var title = tr.title_zh === tr.title_en ? tr.title_zh : tr.title_zh + ' · ' + tr.title_en;
  var desc = e.date + ' ' + e.start_time + '–' + e.end_time + ' · ' + [e.venue, e.city, e.state].filter(Boolean).join(', ') +
    ' · 限量名额，免费报名 Limited seats, free sign-up';
  var img = expoPreviewImage_(e.cover_image);
  return '<!doctype html>\n<html lang="zh-Hans"><head><meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + expoHtml_(title) + ' · EDUPLAN 活动</title>\n' +
    '<meta name="description" content="' + expoHtml_(desc) + '">\n<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="EDUPLAN 活动">\n<meta property="og:title" content="' + expoHtml_(title) + '">\n' +
    '<meta property="og:description" content="' + expoHtml_(desc) + '">\n<meta property="og:image" content="' + expoHtml_(img) + '">\n' +
    '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' +
    '<meta property="og:url" content="' + expoHtml_(url) + '">\n<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta http-equiv="refresh" content="0; url=' + expoHtml_(go) + '">\n<link rel="canonical" href="' + expoHtml_(url) + '">\n' +
    '<script>location.replace(' + JSON.stringify(go) + ');</script>\n</head><body><p><a href="' + expoHtml_(go) + '">' + expoHtml_(title) + '</a></p></body></html>\n';
}
/* Writes (or rewrites) exhibition/e/<id>.html in the GitHub repository. Quietly does nothing without GITHUB_TOKEN. */
function expoSharePage_(id) {
  var props = PropertiesService.getScriptProperties(), token = props.getProperty('GITHUB_TOKEN');
  var e = expoFind_('events', 'id', String(id || ''));
  if (!token || !e || e.status !== 'published' || !/^EV-[0-9A-F]{10}$/.test(e.id)) return false;
  var repo = props.getProperty('GITHUB_REPO') || EXPO_GITHUB_REPO, branch = props.getProperty('GITHUB_BRANCH') || EXPO_GITHUB_BRANCH;
  var path = 'exhibition/e/' + e.id + '.html', api = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  try {
    var html = expoSharePageHtml_(e), sha = null;
    var cur = UrlFetchApp.fetch(api + '?ref=' + encodeURIComponent(branch), { headers: headers, muteHttpExceptions: true });
    if (cur.getResponseCode() === 200) {
      var info = JSON.parse(cur.getContentText());
      sha = info.sha;
      var old = Utilities.newBlob(Utilities.base64Decode(String(info.content || '').replace(/\s/g, ''))).getDataAsString();
      if (old === html) { expoShareMark_(e.id); return true; }   // nothing changed
    }
    var body = { message: 'Exhibition share page: ' + e.id, content: Utilities.base64Encode(html, Utilities.Charset.UTF_8), branch: branch };
    if (sha) body.sha = sha;
    var res = UrlFetchApp.fetch(api, { method: 'put', contentType: 'application/json', headers: headers, payload: JSON.stringify(body), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200 && res.getResponseCode() !== 201) { console.warn('share page ' + e.id + ': ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 300)); return false; }
    expoShareMark_(e.id);
    return true;
  } catch (err) {
    console.warn('share page ' + e.id + ' failed: ' + err);
    return false;
  }
}
function expoShareMark_(id) { expoLocked_(function () { expoStore_().table('events').update('id', id, { share_page: expoStamp_() }); return { ok: true }; }); }
/* Run once from the editor (select expoSharePagesAll, Run): writes the share page of every published event. */
function expoSharePagesAll() {
  var n = 0;
  expoStore_().table('events').all().forEach(function (e) { if (e.status === 'published' && expoSharePage_(e.id)) n++; });
  console.log('Share pages written: ' + n + (PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN') ? '' : ' (add GITHUB_TOKEN first)'));
}

/* ---------- Cover images and emails ---------- */

/* Saves an uploaded cover (base64 JPEG / PNG / WebP, up to 2 MB) and returns a public image link, or {error}. */
function expoSaveCover_(c) {
  var type = String(c.type || ''), m = /^image\/(jpeg|png|webp)$/.exec(type);
  if (!m) return { error: 'bad_image' };
  var bytes;
  try { bytes = Utilities.base64Decode(String(c.data).replace(/^data:[^,]*,/, '')); } catch (err) { return { error: 'bad_image' }; }
  if (!bytes.length || bytes.length > EXPO_COVER_BYTES) return { error: 'image_too_large' };
  var props = PropertiesService.getScriptProperties(), folder = driveFolderLive_('EXPO_COVERS_ID');   // Drive.gs
  if (!folder) {
    folder = driveFolder_('expo').createFolder('Event covers (public links)');
    props.setProperty('EXPO_COVERS_ID', folder.getId());
  }
  var file = folder.createFile(Utilities.newBlob(bytes, type, 'cover-' + expoStamp_().replace(/\D/g, '') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1])));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
}

function expoSite_() { return PropertiesService.getScriptProperties().getProperty('EXPO_SITE_URL') || EXPO_SITE_DEFAULT; }

/* Notifications never stop the main action: a failed or skipped email is only logged. */
function expoMail_(to, subject, body) {
  to = (to || []).filter(Boolean);
  if (!to.length) return false;
  try {
    if (MailApp.getRemainingDailyQuota() < to.length + 2) { console.warn('expo mail skipped (quota): ' + subject); return false; }
    MailApp.sendEmail({ to: to.join(','), name: 'EDUPLAN 活动', subject: subject, body: body + '\n\n— EDUPLAN 活动 ' + expoSite_() });
    return true;
  } catch (err) {
    console.error('expo mail failed: ' + err);
    return false;
  }
}

/* One email to many people who must not see each other's addresses (visitors): Bcc, 50 at a time. */
function expoMailBcc_(list, subject, body) {
  list = (list || []).filter(Boolean);
  for (var i = 0; i < list.length; i += 50) {
    var part = list.slice(i, i + 50);
    try {
      if (MailApp.getRemainingDailyQuota() < part.length + EXPO_MAIL_RESERVE) { console.warn('expo bcc mail stopped (quota): ' + subject); return false; }
      MailApp.sendEmail({ to: expoAdmins_()[0] || part[0], bcc: part.join(','), name: 'EDUPLAN 活动', subject: subject, body: body + '\n\n— EDUPLAN 活动 ' + expoSite_() });
    } catch (err) { console.error('expo bcc mail failed: ' + err); return false; }
  }
  return true;
}

/* ---------- New-event emails to students and schools ---------- */
/* When an admin publishes an event, every student with an EDUPLAN account (Eduplan Student Portfolios) and every
   exhibition school gets one email about it, with a link to stop these emails. Sending runs in the background a minute
   later and stops for the day when the Gmail quota is low (EXPO_MAIL_RESERVE is kept for sign-in codes); the daily
   trigger from expoSetup carries on the next day. Each list has its own cursor, so people who sign up later do not
   shift anyone already counted; they are not sent older events. */

function expoNotifySoon_() {
  try { ScriptApp.newTrigger('expoNotifyNow').timeBased().after(60 * 1000).create(); }
  catch (err) { console.warn('expo notify trigger not made (run expoSetup once): ' + err); }
}
function expoNotifyNow() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'expoNotifyNow') ScriptApp.deleteTrigger(t); });
  expoNotifyRun_();
}
function expoNotifyDaily() { expoNotifyRun_(); }

/* Students first (in sign-up order), then exhibition schools that are not students too. */
function expoNotifyLists_() {
  var students = [], schools = [], seen = {};
  expoStudentEmails_().forEach(function (v) { var e = accountEmail_(v); if (e && !seen[e]) { seen[e] = 1; students.push(e); } });
  expoStore_().table('users').all().forEach(function (u) {
    var e = accountEmail_(u.email);
    if (u.role === 'exhibitor' && e && !seen[e]) { seen[e] = 1; schools.push(e); }
  });
  return { student: students, school: schools };
}
function expoStudentEmails_() {   // Account.gs: column A of "Students"
  var sh = accountSheet_(), n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, 1).getValues().map(function (r) { return String(r[0]); });
}

function expoNotifyRun_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('expo-notify-run')) return { busy: true };
  cache.put('expo-notify-run', '1', 600);
  try {
    var st = expoStore_(), jobs = st.table('notify').all().filter(function (j) { return !j.done_at; });
    if (!jobs.length) return { sent: 0 };
    var lists = expoNotifyLists_(), events = st.table('events').all(), users = st.table('users').all(), today = expoToday_(), total = 0;
    var off = {};
    st.table('unsubscribed').all().forEach(function (u) { off[u.h] = 1; });
    var budget = MailApp.getRemainingDailyQuota() - EXPO_MAIL_RESERVE;
    jobs.forEach(function (j) {
      var e = expoById_(events, j.event_id), gone = !e || e.status !== 'published' || e.date < today, sent = Number(j.sent) || 0;
      var cur = { student: Number(j.next_student) || 0, school: Number(j.next_school) || 0 };
      if (!gone) {
        var org = expoById_(users, e.organiser_id);
        ['student', 'school'].forEach(function (k) {
          while (budget > 0 && cur[k] < lists[k].length) {
            var to = lists[k][cur[k]];
            if (!off[accountHash_(to)]) {
              if (!expoNotifyOne_(to, e, org)) { budget = 0; break; }   // the mail service failed: try again tomorrow
              budget--; sent++; total++;
            }
            cur[k]++;
          }
        });
      }
      var done = gone || (cur.student >= lists.student.length && cur.school >= lists.school.length);
      expoLocked_(function () {
        st.table('notify').update('event_id', j.event_id, { next_student: cur.student, next_school: cur.school, sent: sent, done_at: done ? expoStamp_() : '' });
        return { ok: true };
      });
    });
    return { sent: total };
  } finally { cache.remove('expo-notify-run'); }
}

function expoNotifyOne_(to, e, org) {
  var place = [e.venue, e.address, e.city, e.state].filter(Boolean).join(', ');
  var body = '有一个新的教育展 A new education exhibition is open on Eduplan:\n\n' + e.title + (e.title_tr ? '\n' + e.title_tr : '') + '\n' +
    '日期 Date: ' + e.date + '  ' + e.start_time + '–' + e.end_time + '\n' +
    '地点 Venue: ' + place + '\n' + (org ? '主办方 Organiser: ' + org.org_name + '\n' : '') +
    (e.description ? '\n' + String(e.description).slice(0, 600) + '\n' : '') +
    '\n详情 Details: ' + expoSite_() + '#/e/' + e.id + '\n\n' +
    '你收到这封邮件，是因为你在 EDUPLAN 有账号。不想再收到教育展通知 Stop these emails:\n' + expoUnsubLink_(to);
  try {
    MailApp.sendEmail({ to: to, name: 'EDUPLAN 活动', subject: '新教育展 New exhibition: ' + e.title + ' · ' + e.date, body: body });
    return true;
  } catch (err) {
    console.error('expo notify failed: ' + err);
    return false;
  }
}

/* Stop link: the email and a signature only Eduplan can make, so nobody can stop someone else's emails. */
function expoUnsubSig_(email) {
  var props = PropertiesService.getScriptProperties(), key = props.getProperty('EXPO_MAIL_SECRET');
  if (!key) { key = Utilities.getUuid(); props.setProperty('EXPO_MAIL_SECRET', key); }
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(email, key)).replace(/=+$/, '').slice(0, 22);
}
function expoUnsubLink_(email) { return expoSite_() + '#/unsub/' + encodeURIComponent(email) + '/' + expoUnsubSig_(email); }
function expoUnsub_(body) {
  var email = accountEmail_(body.email);
  if (!email || String(body.sig || '') !== expoUnsubSig_(email)) return { error: 'bad_link' };
  return expoLocked_(function () {
    var h = accountHash_(email);
    if (!expoFind_('unsubscribed', 'h', h)) expoStore_().table('unsubscribed').insert({ h: h, at: expoStamp_() });
    return { ok: true };
  });
}

/* Run once from the editor (select expoSetup, Run): asks for the Drive, Sheets and email permissions the exhibition
   needs (tick "Select all" on Google's consent screen), creates "EDUPLAN Activitys" and checks EXPO_ADMIN_EMAILS. */
function expoSetup() {
  console.log('Email quota left today: ' + MailApp.getRemainingDailyQuota());
  expoStore_().table('users').all();
  ['events', 'registrations', 'attendees', 'sessions', 'notify', 'unsubscribed', 'logins'].forEach(function (t) { expoStore_().table(t).all(); });
  console.log('EDUPLAN Activitys: ' + SpreadsheetApp.openById(driveCleanId_(PropertiesService.getScriptProperties().getProperty('EXPO_SHEET_ID'))).getUrl());
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'expoNotifyDaily'; }))
    ScriptApp.newTrigger('expoNotifyDaily').timeBased().everyDays(1).atHour(10).inTimezone(EXPO_TZ).create();
  console.log('New-event emails: students with an account ' + expoStudentEmails_().length + ', daily trigger on.');
  var admins = expoAdmins_();
  console.log(admins.length ? 'Admins: ' + admins.join(', ') : 'Add EXPO_ADMIN_EMAILS in Project Settings > Script Properties: no one can approve organisers yet.');
}
