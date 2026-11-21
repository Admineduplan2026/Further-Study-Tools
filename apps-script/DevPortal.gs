/**
 * Developer portal (#dev on the website): a programmer signs in with their own email and sees their tasks (start,
 * due date, status), the acceptance report of each finished task (score, bonus, summary), their monthly salary and
 * the next payday. The data lives in two tabs of the private spreadsheet "Eduplan Student Portfolios" (Stats.gs), so
 * salaries never appear in the website code or on GitHub:
 *   - Developer tasks  one row per task and developer (Email, Task, Title, Start, Due, Status, Score, Bonus RM,
 *                      Accepted on, Report summary, Report link). Status: Not started, In progress, Submitted,
 *                      Accepted, Not accepted.
 *   - Developer pay    one row per developer (Email, Name, Monthly salary RM, Payday, Note). Payday is the day of
 *                      the month the salary is paid (1 to 31; a short month uses its last day).
 * A developer sees only their own rows. The activity admins (StaffActivity.gs ACTIVITY_ADMINS, default
 * admin.eduplan@gmail.com) can open any developer's page from the staff portal.
 *
 *   {"action":"account_dev","token":"..."}                -> {me, devs?, dev:{email,name,tasks,pay,bonusTotal}}
 *   {"action":"account_dev","token":"...","who":"email"}  -> the same for that developer (activity admins only)
 *
 * Run devPortalSetup once from the editor: it adds both tabs and the first tasks; then type the developer's email
 * in column A of both tabs and the salary and payday in "Developer pay".
 */
var DEV_TASKS = 'Developer tasks', DEV_PAY = 'Developer pay';
var DEV_TASK_HEAD = ['Email 电邮', 'Task 任务', 'Title 名称', 'Start 开始', 'Due 截止', 'Status 状态', 'Score 分数',
  'Bonus RM 奖金', 'Accepted on 验收日期', 'Report summary 验收报告', 'Report link 报告链接'];
var DEV_PAY_HEAD = ['Email 电邮', 'Name 名字', 'Monthly salary RM 月薪', 'Payday 出粮日 (1-31)', 'Note 备注'];
var DEV_STATUS = ['Not started', 'In progress', 'Submitted', 'Accepted', 'Not accepted'];

function devTab_(name, head) {
  var sh = statsTab_(name, head);   // Stats.gs: private book, header row made on first use
  return sh;
}

function devText_(v) { return String(v == null ? '' : v).trim(); }
function devDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var s = devText_(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}
function devNum_(v) { var n = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) && devText_(v) !== '' ? n : null; }

function devRows_(name, head) {
  var sh = devTab_(name, head), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, head.length).getValues();
}

/* Every email that has a task or a pay row (the developers). */
function devEmails_() {
  var set = {};
  devRows_(DEV_TASKS, DEV_TASK_HEAD).concat(devRows_(DEV_PAY, DEV_PAY_HEAD)).forEach(function (r) {
    var e = accountEmail_(r[0]);   // Account.gs
    if (e) set[e] = true;
  });
  return Object.keys(set).sort();
}
function devIs_(email) {
  try { return devEmails_().indexOf(accountEmail_(email)) >= 0; } catch (err) { return false; }
}

/* The next payday on or after today (Malaysia time) for a day of the month; a short month uses its last day. */
function devNextPay_(day, now) {
  day = Math.floor(Number(day));
  if (!(day >= 1 && day <= 31)) return '';
  var tz = 'Asia/Kuala_Lumpur', today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7));
  for (var k = 0; k < 2; k++) {
    var last = new Date(Date.UTC(y, m, 0)).getUTCDate(), d = Math.min(day, last);
    var s = y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
    if (s >= today) return s;
    m++; if (m > 12) { m = 1; y++; }
  }
  return '';
}

function devFor_(email, now) {
  var tasks = devRows_(DEV_TASKS, DEV_TASK_HEAD).filter(function (r) { return accountEmail_(r[0]) === email; }).map(function (r) {
    var status = devText_(r[5]);
    return {
      task: devText_(r[1]), title: devText_(r[2]), start: devDate_(r[3]), due: devDate_(r[4]),
      status: DEV_STATUS.indexOf(status) >= 0 ? status : (status || 'Not started'),
      score: devNum_(r[6]), bonus: devNum_(r[7]), acceptedOn: devDate_(r[8]),
      report: devText_(r[9]).slice(0, 3000), link: /^https:\/\//.test(devText_(r[10])) ? devText_(r[10]) : ''
    };
  });
  var payRow = devRows_(DEV_PAY, DEV_PAY_HEAD).filter(function (r) { return accountEmail_(r[0]) === email; })[0];
  var pay = payRow ? {
    salary: devNum_(payRow[2]), payday: devNum_(payRow[3]), nextPay: devNextPay_(payRow[3], now), note: devText_(payRow[4]).slice(0, 300)
  } : null;
  var bonusTotal = tasks.reduce(function (s, t) { return s + (t.status === 'Accepted' && t.bonus ? t.bonus : 0); }, 0);
  return { email: email, name: payRow ? devText_(payRow[1]) : '', tasks: tasks, pay: pay, bonusTotal: bonusTotal };
}

function accountDev_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);   // Account.gs
  if (!s) return { error: 'signed_out' };
  var me = accountEmail_(sh.getRange(s.row, ACCOUNT_COL.email).getValue());
  var admin = actIsAdmin_(me), devs = devEmails_();   // StaffActivity.gs
  var who = accountEmail_(body.who) || me;
  if (who !== me && !admin) return { error: 'forbidden' };
  if (devs.indexOf(who) < 0) {
    if (admin) return { me: me, devs: devs, dev: null };
    return { error: 'forbidden' };
  }
  if (!admin) staffLog_(me, 'Opened developer portal', '');   // StaffActivity.gs: counts as working
  var out = { me: me, dev: devFor_(who, new Date()) };
  if (admin) out.devs = devs;
  return out;
}

/* Run once from the editor (select devPortalSetup, Run): adds the two tabs and the first three tasks. Rows already
   there are kept; tasks are added only when the tab has none yet. */
function devPortalSetup() {
  var t = devTab_(DEV_TASKS, DEV_TASK_HEAD), p = devTab_(DEV_PAY, DEV_PAY_HEAD);
  t.getRange('D:E').setNumberFormat('@'); t.getRange('I:I').setNumberFormat('@');
  t.setColumnWidth(1, 200); t.setColumnWidth(3, 260); t.setColumnWidth(10, 420);
  t.getRange('J:J').setWrap(true);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(DEV_STATUS, true).setAllowInvalid(false).build();
  t.getRange(2, 6, 500, 1).setDataValidation(rule);
  if (t.getLastRow() < 2) {
    var who = '填 Xinyi 的电邮';
    t.getRange(2, 1, 3, DEV_TASK_HEAD.length).setNumberFormat('@').setValues([
      [who, 'Task 1', 'UI / UX 与网页速度', '2026-11-14', '2026-11-20', 'Accepted', '94', '100', '2026-11-21',
       '94/100，Bonus RM 100（85 分以上级别）。PageSpeed 官方测试：手机英文 99、中文 100，桌面 100；首页 LCP 低于 2.5 秒（创办人重测确认）；emoji 已全部换成图标；按钮和输入框符合 44 px 点击区域；准时提交；前后对比截图已交。扣分：UI 细节 2 分、功能范围 3 分、按钮 1 分。', ''],
      [who, 'Task 2', '比较系统与成绩', '2026-11-21', '2026-11-27', 'In progress', '', '', '', '', ''],
      [who, 'Task 3', '申请表、文件与通知', '2026-11-28', '2026-12-04', 'Not started', '', '', '', '', '']
    ]);
  }
  p.getRange('A:B').setNumberFormat('@'); p.setColumnWidth(1, 200); p.setColumnWidth(5, 300);
  if (p.getLastRow() < 2) p.getRange(2, 1, 1, DEV_PAY_HEAD.length).setValues([['填 Xinyi 的电邮', 'Xinyi', '', '', '']]);
  console.log('Developer portal ready: ' + t.getParent().getUrl() + ' (tabs "' + DEV_TASKS + '" and "' + DEV_PAY + '"). ' +
    'Type the developer\'s email in column A of both tabs, then the salary and payday in "' + DEV_PAY + '".');
}
