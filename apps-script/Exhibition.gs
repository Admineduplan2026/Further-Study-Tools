/**
 * Eduplan Exhibition (Eduplan 教育展): organisers open education fairs, schools (exhibitors) book booths, and Eduplan
 * staff (admins) approve new organisers and their events. Website: exhibition/ (exhibition/expo.js).
 *
 * The website POSTs to the same /exec URL as everything else; doPost in Code.gs sends every "expo_*" action here:
 *   expo_public                                   upcoming published events (no sign-in, no contact details)
 *   expo_code {email} / expo_verify {email,code}  one-time email code, as for the student portfolio -> {token, me}
 *   expo_me / expo_logout {token}
 *   expo_register {token, role, ...}              first sign-in: choose organiser or exhibitor (one role per account)
 *   Organiser: expo_event_save, expo_my_events, expo_event_regs, expo_reg_decide, expo_event_cancel
 *   Exhibitor: expo_events, expo_apply, expo_my_regs, expo_withdraw
 *   Admin:     expo_admin_list, expo_admin_user, expo_admin_event
 *
 * Every rule is checked here, never only in the browser: no events or registrations for past dates, the deadline is
 * before the event, booked booths never exceed the event's capacity, one registration per school per event, and each
 * action checks the caller's role and that the event or registration is theirs. Writes run inside the script lock, so
 * two schools booking the last booth at the same moment cannot both get it.
 *
 * Data: private spreadsheet "Eduplan Exhibitions" in "Eduplan Databases/5. Exhibitions (private)" (Drive.gs) with the
 * tabs Users, Events, Registrations and Sessions. Event cover images go to "Event covers (public links)" in the same
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
var EXPO_COVER_BYTES = 2 * 1024 * 1024;
var EXPO_SITE_DEFAULT = 'https://admineduplan2026.github.io/Further-Study-Tools/exhibition/';
var EXPO_COLS = {
  users: ['id', 'role', 'email', 'name', 'position', 'phone', 'org_name', 'school_type', 'website', 'status', 'review_note', 'consent_at', 'created_at'],
  events: ['id', 'organiser_id', 'title', 'description', 'date', 'start_time', 'end_time', 'venue', 'address', 'city', 'state', 'booth_capacity',
    'registration_deadline', 'booth_fee', 'cover_image', 'status', 'review_note', 'approved_at', 'created_at', 'updated_at'],
  registrations: ['id', 'event_id', 'exhibitor_id', 'booths_requested', 'topics', 'special_needs', 'status', 'organiser_note', 'created_at', 'updated_at'],
  sessions: ['h', 'email', 'exp'],
  notify: ['event_id', 'next_student', 'next_school', 'sent', 'created_at', 'done_at'],
  unsubscribed: ['h', 'at']
};
var EXPO_TABS = { users: 'Users', events: 'Events', registrations: 'Registrations', sessions: 'Sessions', notify: 'Notify', unsubscribed: 'Unsubscribed' };
var EXPO_MAIL_RESERVE = 25;   // emails a day kept for sign-in codes and application notices
var EXPO_STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak',
  'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'];
var EXPO_SCHOOL_TYPES = ['university', 'college', 'secondary', 'other'];
/* Stored event status: draft, pending (waiting for an admin), published, rejected (by an admin), closed (by the
   organiser) or cancelled. A published event whose registration deadline has passed is shown as closed. */
var EXPO_EVENT_STATUS = ['draft', 'pending', 'published', 'rejected', 'closed', 'cancelled'];

function expoAction_(body) {
  var a = String(body && body.action || '');
  if (a === 'expo_public') return expoPublic_();
  if (a === 'expo_code') return expoCode_(body);
  if (a === 'expo_verify') return expoVerify_(body);
  if (a === 'expo_unsub') return expoUnsub_(body);
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

/* The tables of "Eduplan Exhibitions"; tools/test-exhibition.js replaces this with an in-memory store. */
function expoStore_() {
  if (expoStore_.cached) return expoStore_.cached;
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('EXPO_SHEET_ID'), ss = id && driveSheetLive_(id);
  if (!ss) {
    ss = SpreadsheetApp.create('Eduplan Exhibitions');
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
    sh = ss.getSheets().length === 1 && first.getLastRow() === 0 && !(first.getName() in { Users: 1, Events: 1, Registrations: 1, Sessions: 1, Notify: 1, Unsubscribed: 1 })
      ? first.setName(EXPO_TABS[name]) : ss.insertSheet(EXPO_TABS[name]);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');   // plain text: dates and phone numbers stay as typed
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#e4f2fa');
    sh.setFrozenRows(1);
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
  MailApp.sendEmail({
    to: email, name: 'Eduplan 教育展', subject: 'Eduplan 教育展登录验证码 / Exhibition sign-in code: ' + code,
    body: '你的 Eduplan 教育展登录验证码是 ' + code + '，' + ACCOUNT_CODE_MINUTES + ' 分钟内有效。\n' +
      'Your Eduplan Exhibition sign-in code is ' + code + '. It expires in ' + ACCOUNT_CODE_MINUTES + ' minutes.\n\n' +
      '如果你没有申请这个验证码，请忽略这封电邮。If you did not ask for this code, you can ignore this email.'
  });
  return { ok: true };
}

function expoVerify_(body) {
  var email = accountEmail_(body.email), code = String(body.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) return { error: 'bad_code' };
  var cache = CacheService.getScriptCache(), k = 'expo-otp-' + accountHash_(email);
  return expoLocked_(function () {
    var rec = null;
    try { rec = JSON.parse(cache.get(k) || 'null'); } catch (err) { rec = null; }
    if (!rec) return { error: 'expired' };
    if (rec.h !== accountHash_(code + ':' + email)) {
      rec.n++;
      if (rec.n >= ACCOUNT_CODE_TRIES) cache.remove(k); else cache.put(k, JSON.stringify(rec), ACCOUNT_CODE_MINUTES * 60);
      return { error: 'bad_code' };
    }
    cache.remove(k);
    var token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').toLowerCase().slice(0, 64);
    var h = accountHash_('expo-session:' + token);
    expoStore_().table('sessions').insert({ h: h, email: email, exp: String(Date.now() + EXPO_SESSION_DAYS * 86400000) });
    return { token: token, me: expoMe_(expoWho_(email, h)) };
  });
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

function expoEventOut_(e, regs, today, org) {
  var b = expoBooths_(e.id, regs), cap = Number(e.booth_capacity) || 0;
  return {
    id: e.id, title: e.title, description: e.description, date: e.date, start_time: e.start_time, end_time: e.end_time, venue: e.venue,
    address: e.address, city: e.city, state: e.state, booth_capacity: cap, registration_deadline: e.registration_deadline,
    booth_fee: Number(e.booth_fee) || 0, cover_image: e.cover_image, status: expoState_(e, today), organiser: org ? org.org_name : '',
    remaining: Math.max(0, cap - b.taken), full: b.taken >= cap, open: expoOpen_(e, today)
  };
}

function expoPublic_() {
  var today = expoToday_(), st = expoStore_(), regs = st.table('registrations').all(), users = st.table('users').all();
  var events = st.table('events').all().filter(function (e) { return e.status === 'published' && e.date >= today; })
    .sort(function (a, b) { return (a.date + a.start_time).localeCompare(b.date + b.start_time); });
  return { today: today, events: events.map(function (e) { return expoEventOut_(e, regs, today, expoById_(users, e.organiser_id)); }) };
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
    booth_capacity: expoInt_(f.booth_capacity), registration_deadline: expoDate_(f.registration_deadline), booth_fee: Number(f.booth_fee)
  };
  var bad = [];
  ['title', 'description', 'date', 'start_time', 'end_time', 'venue', 'address', 'city', 'state', 'registration_deadline'].forEach(function (k) { if (!e[k]) bad.push(k); });
  if (bad.length) return { error: 'missing', fields: bad };
  if (e.date < today) return { error: 'past_date', fields: ['date'] };
  if (e.end_time <= e.start_time) return { error: 'bad_time', fields: ['end_time'] };
  if (e.registration_deadline >= e.date) return { error: 'deadline_after_event', fields: ['registration_deadline'] };
  if (e.registration_deadline < today) return { error: 'past_deadline', fields: ['registration_deadline'] };
  if (!(e.booth_capacity > 0) || e.booth_capacity > EXPO_MAX_BOOTHS) return { error: 'bad_capacity', fields: ['booth_capacity'] };
  if (!isFinite(e.booth_fee) || e.booth_fee < 0 || e.booth_fee > 1000000) return { error: 'bad_fee', fields: ['booth_fee'] };
  e.booth_fee = Math.round(e.booth_fee * 100) / 100;
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
  var r = expoLocked_(function () {
    var st = expoStore_(), events = st.table('events'), id = String((body.event || {}).id || ''), old = id ? expoFind_('events', 'id', id) : null, e = chk.e;
    if (id && !old) return { error: 'not_found' };
    if (old && old.organiser_id !== who.user.id) return { error: 'forbidden' };   // organisers only touch their own events
    if (old && old.status === 'cancelled') return { error: 'cancelled' };
    var b = old ? expoBooths_(old.id, st.table('registrations').all()) : { taken: 0, count: 0 };
    if (e.booth_capacity < b.taken) return { error: 'capacity_below_booked', fields: ['booth_capacity'], booked: b.taken };
    if (!submit && b.count) return { error: 'has_registrations' };   // an event schools have booked cannot go back to draft
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
  if (r.ok && r.status === 'pending') {
    expoMail_(expoAdmins_(), '新的教育展活动待审核 New event to review: ' + chk.e.title,
      who.user.org_name + ' 提交了活动「' + chk.e.title + '」（' + chk.e.date + '，' + chk.e.venue + '，' + chk.e.city + '）。\n请到 ' + expoSite_() + '#/admin 审核。');
  }
  return r;
}

function expoMyEvents_(who) {
  var deny = expoRole_(who, 'organiser');
  if (deny) return deny;
  var today = expoToday_(), st = expoStore_(), regs = st.table('registrations').all();
  var list = st.table('events').all().filter(function (e) { return e.organiser_id === who.user.id; })
    .sort(function (a, b) { return b.date.localeCompare(a.date); })
    .map(function (e) {
      var o = expoEventOut_(e, regs, today, who.user), b = expoBooths_(e.id, regs);
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
      if (b.accepted + (Number(reg.booths_requested) || 0) > (Number(own.e.booth_capacity) || 0)) return { error: 'full' };
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
  var notify = [], title = '', date = '';
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
    title = own.e.title; date = own.e.date;
    return { ok: true };
  });
  if (r.ok && notify.length) {
    expoMail_(notify, '活动已取消：' + title, '主办方已取消教育展「' + title + '」（' + date + '）。你的摊位报名不再有效。\n\n查看我的报名：' + expoSite_() + '#/ex/my');
  }
  return r;
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
    return expoOpen_(e, today) && (!state || e.state === state) && (!city || e.city.toLowerCase().indexOf(city) >= 0) &&
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
    if (!expoOpen_(e, today)) return { error: 'closed' };
    var regs = st.table('registrations'), all = regs.all(), prev = null;
    for (var i = 0; i < all.length; i++) if (all[i].event_id === e.id && all[i].exhibitor_id === who.user.id) prev = all[i];
    if (prev && prev.status !== 'withdrawn') return { error: 'duplicate' };   // one registration per school per event
    var b = expoBooths_(e.id, all), left = (Number(e.booth_capacity) || 0) - b.taken;
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
    expoMail_([mail.email], decision === 'approved' ? 'Eduplan 教育展：主办方账号已批准' : 'Eduplan 教育展：主办方账号未获批准',
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
  if (r.ok && decision === 'approved') expoNotifySoon_();
  if (r.ok && mail) {
    expoMail_([mail.to], (decision === 'approved' ? '活动已发布：' : '活动未获批准：') + mail.title,
      decision === 'approved' ? '你的活动「' + mail.title + '」已通过审核并公开，参展学校现在可以报名摊位。\n' + expoSite_() + '#/org'
        : '你的活动「' + mail.title + '」未通过审核。' + (note ? '\n原因：' + note : '') + '\n你可以修改后再提交：' + expoSite_() + '#/org');
  }
  return r;
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
    MailApp.sendEmail({ to: to.join(','), name: 'Eduplan 教育展', subject: subject, body: body + '\n\n— Eduplan 教育展 ' + expoSite_() });
    return true;
  } catch (err) {
    console.error('expo mail failed: ' + err);
    return false;
  }
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
  var body = '有一个新的教育展 A new education exhibition is open on Eduplan:\n\n' + e.title + '\n' +
    '日期 Date: ' + e.date + '  ' + e.start_time + '–' + e.end_time + '\n' +
    '地点 Venue: ' + place + '\n' + (org ? '主办方 Organiser: ' + org.org_name + '\n' : '') +
    (e.description ? '\n' + String(e.description).slice(0, 600) + '\n' : '') +
    '\n详情 Details: ' + expoSite_() + '#/e/' + e.id + '\n\n' +
    '你收到这封邮件，是因为你在 EDUPLAN 有账号。不想再收到教育展通知 Stop these emails:\n' + expoUnsubLink_(to);
  try {
    MailApp.sendEmail({ to: to, name: 'Eduplan 教育展', subject: '新教育展 New exhibition: ' + e.title + ' · ' + e.date, body: body });
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
   needs (tick "Select all" on Google's consent screen), creates "Eduplan Exhibitions" and checks EXPO_ADMIN_EMAILS. */
function expoSetup() {
  console.log('Email quota left today: ' + MailApp.getRemainingDailyQuota());
  expoStore_().table('users').all();
  ['events', 'registrations', 'sessions', 'notify', 'unsubscribed'].forEach(function (t) { expoStore_().table(t).all(); });
  console.log('Eduplan Exhibitions: ' + SpreadsheetApp.openById(driveCleanId_(PropertiesService.getScriptProperties().getProperty('EXPO_SHEET_ID'))).getUrl());
  if (!ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'expoNotifyDaily'; }))
    ScriptApp.newTrigger('expoNotifyDaily').timeBased().everyDays(1).atHour(10).inTimezone(EXPO_TZ).create();
  console.log('New-event emails: students with an account ' + expoStudentEmails_().length + ', daily trigger on.');
  var admins = expoAdmins_();
  console.log(admins.length ? 'Admins: ' + admins.join(', ') : 'Add EXPO_ADMIN_EMAILS in Project Settings > Script Properties: no one can approve organisers yet.');
}
