/**
 * Staff activity log: proof that staff work in the staff portal. Every staff sign-in and sign-out, every time the
 * staff portal (#staff) is opened, and every change made there (goals, news email) adds a row to the tab
 * "Staff activity" of the private spreadsheet "Eduplan Student Portfolios" (next to "Sign-in log", Stats.gs), in
 * "Eduplan Databases/3. Students and visitors (private)" on Google Drive. Rows are only added, never changed.
 * Only the activity admins (Script Property ACTIVITY_ADMINS, default admin.eduplan@gmail.com) can read the log on
 * the website; anyone the spreadsheet is shared with can read the tab itself.
 *
 *   {"action":"account_activity","token":"...","op":"view","page":"staff"}   -> {ok:true}      (any staff email)
 *   {"action":"account_activity","token":"...","op":"list"}                  -> {people,events} (activity admins)
 *
 * Also in this file: staffPlanSeed, run once from the editor, adds the 4-week plan to the staff goals (StaffGoals.gs).
 */
var ACT_TAB = 'Staff activity';
var ACT_HEAD = ['Time', 'Email', 'Event', 'Detail'];
var ACT_DAYS = 30;          // the website shows the last 30 days
var ACT_EVENTS = 300;       // and at most this many events
var ACT_ONLINE_MIN = 15;    // someone with an event in the last 15 minutes is "working now"

function actSheet_() { return statsTab_(ACT_TAB, ACT_HEAD); }   // Stats.gs: same private book as the sign-in log

/* One row in the log. Never throws: logging must not break what the staff member is doing. */
function staffLog_(email, event, detail) {
  try {
    actSheet_().appendRow([new Date(), accountCell_(email, 120), String(event).slice(0, 40), accountCell_(detail || '', 120)]);
  } catch (err) { console.error('staffLog_: ' + err); }
}

/* Logs a sign-in or sign-out for staff and developer emails only (Account.gs calls this next to statsLog_). */
function staffLogSign_(email, event) {
  if (accountIsStaff_(email) || devIs_(email)) staffLog_(String(email).toLowerCase(), event, '');   // DevPortal.gs
}

/* The emails that may read the log on the website. */
function actIsAdmin_(email) {
  var list = String(PropertiesService.getScriptProperties().getProperty('ACTIVITY_ADMINS') || 'admin.eduplan@gmail.com')
    .split(/[,;\s]+/).map(accountEmail_).filter(Boolean);
  return list.indexOf(accountEmail_(email)) >= 0;
}

/* Changes made in the staff portal: logged by accountAction_ (Account.gs) after they succeed. */
var ACT_CHANGES = { account_goals: 'Goals', account_news: 'News' };
function staffLogChange_(body, result) {
  try {
    var area = ACT_CHANGES[body.action], op = String(body.op || '');
    if (!area || !op || op === 'get' || (result && result.error)) return;
    var who = accountStaffEmail_(body);   // Account.gs
    if (who.error) return;
    var detail = op + (body.id ? ' ' + String(body.id) : '') + (body.title ? ': ' + String(body.title) : '');
    staffLog_(who.email, area, detail);
  } catch (err) { console.error('staffLogChange_: ' + err); }
}

function accountActivity_(body) {
  var who = accountStaffEmail_(body);
  if (who.error) return who;
  var op = String(body.op || '');
  if (op === 'view') {
    staffLog_(who.email, 'Opened staff portal', String(body.page || 'staff').replace(/[^a-z0-9#\/_-]/gi, '').slice(0, 40));
    return { ok: true };
  }
  if (op !== 'list') return { error: 'bad_request' };
  if (!actIsAdmin_(who.email)) return { error: 'forbidden' };
  return actList_(new Date());
}

/* The last 30 days: one summary per person and the newest events. Times are Malaysia time. */
function actList_(now) {
  var sh = actSheet_(), n = sh.getLastRow(), tz = 'Asia/Kuala_Lumpur';
  var since = now.getTime() - ACT_DAYS * 864e5, rows = [];
  if (n > 1) {
    // Read only the tail: rows are added in time order, so older rows are not needed.
    var take = Math.min(n - 1, 5000), start = n - take + 1;
    rows = sh.getRange(start, 1, take, 4).getValues().filter(function (r) {
      return r[0] instanceof Date && r[0].getTime() >= since && r[1];
    });
  }
  function fmt(d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm'); }
  function day(d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); }
  var today = day(now), week = {}, people = {};
  for (var i = 0; i < 7; i++) week[day(new Date(now.getTime() - i * 864e5))] = true;
  rows.forEach(function (r) {
    var email = String(r[1]), ev = String(r[2]), t = r[0], p = people[email];
    if (!p) p = people[email] = { email: email, lastSeen: 0, lastSignIn: 0, changesToday: 0, changesWeek: 0, opensWeek: 0, days: {} };
    var ms = t.getTime(), d = day(t), inWeek = !!week[d];
    p.lastSeen = Math.max(p.lastSeen, ms);
    if (ev === 'Signed in') p.lastSignIn = Math.max(p.lastSignIn, ms);
    if (ACT_CHANGES_LABEL_[ev]) { if (d === today) p.changesToday++; if (inWeek) p.changesWeek++; }
    if ((ev === 'Opened staff portal' || ev === 'Opened developer portal') && inWeek) p.opensWeek++;
    if (inWeek) p.days[d] = true;
  });
  var list = Object.keys(people).map(function (k) {
    var p = people[k], ago = now.getTime() - p.lastSeen;
    return {
      email: p.email, lastSeen: fmt(new Date(p.lastSeen)), lastSignIn: p.lastSignIn ? fmt(new Date(p.lastSignIn)) : '',
      changesToday: p.changesToday, changesWeek: p.changesWeek, opensWeek: p.opensWeek, activeDays: Object.keys(p.days).length,
      state: ago <= ACT_ONLINE_MIN * 6e4 ? 'online' : day(new Date(p.lastSeen)) === today ? 'today' : ago <= 3 * 864e5 ? 'recent' : 'idle',
      _t: p.lastSeen
    };
  }).sort(function (a, b) { return b._t - a._t; });
  list.forEach(function (p) { delete p._t; });
  var events = rows.slice(-ACT_EVENTS).reverse().map(function (r) {
    return { at: fmt(r[0]), email: String(r[1]), event: String(r[2]), detail: String(r[3] || '') };
  });
  return { people: list, events: events, days: ACT_DAYS };
}
var ACT_CHANGES_LABEL_ = { Goals: true, News: true };

/* Run once from the editor (select staffActivitySetup, Run): adds the tab and formats the time column. */
function staffActivitySetup() {
  var sh = actSheet_();
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 160); sh.setColumnWidth(4, 320);
  console.log('Staff activity log ready: ' + sh.getParent().getUrl() + ' (tab "' + ACT_TAB + '")');
}

/* The 4-week development plan (week 1 is Task 1). staffPlanSeed adds each week as a staff goal with its tasks in the
   note; weeks already in the list (same title) are skipped, so it can be run again safely. */
var STAFF_PLAN = [
  { title: 'Week 1 第1周: Task 1 UI/UX 与网页速度', due: '2026-11-20', done: true,
    note: '手机版和网页版 UI/UX（不改功能）; 删除 emoji; 按钮和输入框更人性化; PageSpeed 70 分以上（目标 90）; 首页 LCP 低于 2.5 秒; 修改前后截图。结果：94/100' },
  { title: 'Week 2 第2周: 比较系统与成绩', due: '2026-11-27',
    note: '成绩按科目输入（SPM、UEC、STPM、A-Level 等）; 入学条件符合标记; 每个课程可选奖学金并显示扣除后的学费; 比较表每栏「申请这个课程」按钮; 只有每年学费的课程也能比较' },
  { title: 'Week 3 第3周: 申请表、文件与通知', due: '2026-12-04',
    note: '申请表补齐缺少的字段; 送出申请前的住宿协助; 文件上传（身份证、成绩单、照片等）; 申请 PDF 和院校表格 PDF; 新申请和状态变更的通知邮件' },
  { title: 'Week 4 第4周: 线上付款', due: '2026-12-11',
    note: 'Billplz 付报名费; 按学期或全额付学费（扣除奖学金）; 付款后自动「已付款」并寄收据; 员工可查看付款记录' }
];
function staffPlanSeed() {
  var sh = goalSheet_(), have = {}, now = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm:ss");
  goalRows_(sh).forEach(function (g) { have[g.title] = true; });   // StaffGoals.gs
  var added = 0;
  STAFF_PLAN.forEach(function (w) {
    if (have[w.title]) return;
    var row = ['G-' + Utilities.getUuid().slice(0, 8).toUpperCase(), w.title, w.due, w.note.slice(0, 500),
      w.done ? 'Yes' : 'No', w.done ? now : '', w.done ? 'admin.eduplan@gmail.com' : '', 'admin.eduplan@gmail.com', now];
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    added++;
  });
  console.log('4-week plan: ' + added + ' week(s) added to the tab "' + GOAL_TAB + '".');
}
