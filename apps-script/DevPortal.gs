/**
 * Developer portal (#dev on the website): each developer signs in with their own email and sees only their own page:
 *   - income: total income so far = monthly salary x months worked (from the start date, this month included)
 *     + every bonus record; the bonus records (date, type, amount, note, report link); salary and next payday;
 *   - tasks: every task in one table, newest first (start, due, status, score, bonus, details, acceptance report);
 *   - weekly reports: the developer uploads one report per week (summary + file); EDUPLAN marks it reviewed.
 * The data lives in the private spreadsheet "Eduplan Student Portfolios" (Stats.gs), so salaries never appear in the
 * website code or on GitHub. Report files go to Drive: "Eduplan Databases/6. Developer reports (private)/<email>".
 *   - Developer tasks    Email, Task, Title, Start, Due, Status, Score, Bonus RM, Accepted on, Report summary,
 *                        Report link, Details. Status: Not started, In progress, Submitted, Accepted, Not accepted.
 *   - Developer pay      Email, Name, Monthly salary RM, Payday (1-31), Note, Start date (empty: the month of the
 *                        earliest task).
 *   - Developer payouts  The bonus record: Email, Date, Type (Bonus, Allowance, Other), Amount RM, Note, Report link.
 *                        Salary is not entered here (it is counted from the monthly salary); a Salary row is ignored.
 *   - Developer reports  Email, Week, Submitted at, Summary, File name, File link, Status (Submitted, Reviewed), Feedback.
 * The activity admins (StaffActivity.gs ACTIVITY_ADMINS, default admin.eduplan@gmail.com) can open any developer's
 * page, add tasks from the website, and see every report.
 *
 *   {"action":"account_dev","token":"..."[,"who":"email"]}                                   -> {me, devs?, admin, dev}
 *   {"action":"account_dev","token":"...","op":"report","week":"Week 2","summary":"...","file":{"name","type","data"}}
 *   {"action":"account_dev","token":"...","op":"task_add","who":"email","task":"Task 4","title":"...","start":"YYYY-MM-DD",
 *     "due":"YYYY-MM-DD","details":"..."}                                                     (activity admins)
 *
 * Run devPortalSetup once from the editor (safe to run again): it adds the tabs, the missing columns and the first tasks.
 */
var DEV_TASKS = 'Developer tasks', DEV_PAY = 'Developer pay', DEV_PAYOUTS = 'Developer payouts', DEV_REPORTS = 'Developer reports';
var DEV_TASK_HEAD = ['Email 电邮', 'Task 任务', 'Title 名称', 'Start 开始', 'Due 截止', 'Status 状态', 'Score 分数',
  'Bonus RM 奖金', 'Accepted on 验收日期', 'Report summary 验收报告', 'Report link 报告链接', 'Details 任务内容'];
var DEV_PAY_HEAD = ['Email 电邮', 'Name 名字', 'Monthly salary RM 月薪', 'Payday 出粮日 (1-31)', 'Note 备注', 'Start date 开始日期 (YYYY-MM-DD)'];
var DEV_PAYOUT_HEAD = ['Email 电邮', 'Date 日期', 'Type 类别 (Bonus/Allowance/Other)', 'Amount RM 金额', 'Note 备注', 'Report link 报告链接'];
var DEV_REPORT_HEAD = ['Email 电邮', 'Week 周', 'Submitted at 提交时间', 'Summary 摘要', 'File name 文件名', 'File link 文件链接',
  'Status 状态 (Submitted/Reviewed)', 'Feedback 回馈'];
var DEV_STATUS = ['Not started', 'In progress', 'Submitted', 'Accepted', 'Not accepted'];
var DEV_PAYOUT_TYPES = ['Bonus', 'Allowance', 'Other'];
/* The type of a bonus-record row ("Bonus", "Allowance" or "Other"), or '' for salary, empty or anything else. */
function devPayoutType_(v) {
  var t = devText_(v).toLowerCase();
  if (t === 'bonus' || t === '奖金' || t === '獎金') return 'Bonus';
  if (t === 'allowance' || t === '津贴' || t === '津貼') return 'Allowance';
  if (t === 'other' || t === '其他') return 'Other';
  return '';
}
var DEV_REPORT_MAX = 10 * 1024 * 1024;   // 10 MB per weekly report file
var DEV_REPORT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];

/* A tab of the private book with its header row; a header that is shorter than `head` (older version) is extended. */
function devTab_(name, head) {
  var sh = statsTab_(name, head);   // Stats.gs
  if (sh.getLastColumn() < head.length) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#e4f2fa');
  }
  return sh;
}

function devText_(v) { return String(v == null ? '' : v).trim(); }
function devDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var s = devText_(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}
function devTime_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm');
  return devText_(v);
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
  var today = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
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
      report: devText_(r[9]).slice(0, 3000), link: /^https:\/\//.test(devText_(r[10])) ? devText_(r[10]) : '',
      details: devText_(r[11]).slice(0, 3000)
    };
  }).sort(function (a, b) { return (b.start || '') < (a.start || '') ? -1 : (b.start || '') > (a.start || '') ? 1 : 0; });   // newest first

  var payRow = devRows_(DEV_PAY, DEV_PAY_HEAD).filter(function (r) { return accountEmail_(r[0]) === email; })[0];
  var pay = payRow ? {
    salary: devNum_(payRow[2]), payday: devNum_(payRow[3]), nextPay: devNextPay_(payRow[3], now), note: devText_(payRow[4]).slice(0, 300)
  } : null;

  // Bonus records: only rows whose type is clearly Bonus, Allowance or Other (English or Chinese). A salary row, or a row
  // with an empty or unknown type, is left out: salary is counted from the monthly salary below, never twice.
  var bonuses = devRows_(DEV_PAYOUTS, DEV_PAYOUT_HEAD).filter(function (r) {
    return accountEmail_(r[0]) === email && devPayoutType_(r[2]) && devNum_(r[3]);
  }).map(function (r) {
    return { date: devDate_(r[1]), type: devPayoutType_(r[2]), amount: devNum_(r[3]) || 0,
      note: devText_(r[4]).slice(0, 200), link: /^https:\/\//.test(devText_(r[5])) ? devText_(r[5]) : '' };
  }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  var bonusSum = bonuses.reduce(function (t, b) { return t + b.amount; }, 0);

  // Salary earned: monthly salary x months from the start month to this month (this month included).
  var start = payRow ? devDate_(payRow[5]) : '';
  if (!start) start = tasks.reduce(function (m, t) { return t.start && (!m || t.start < m) ? t.start : m; }, '');
  var today = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd'), months = 0;
  if (start && start <= today) months = (Number(today.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(today.slice(5, 7)) - Number(start.slice(5, 7)) + 1;
  var monthly = pay && pay.salary ? pay.salary : 0;
  var income = { salary: monthly * months, months: months, start: start, bonus: bonusSum, total: monthly * months + bonusSum };

  var reports = devRows_(DEV_REPORTS, DEV_REPORT_HEAD).filter(function (r) { return accountEmail_(r[0]) === email; }).map(function (r) {
    return { week: devText_(r[1]), at: devTime_(r[2]), summary: devText_(r[3]).slice(0, 2000), file: devText_(r[4]),
      link: /^https:\/\//.test(devText_(r[5])) ? devText_(r[5]) : '', status: devText_(r[6]) || 'Submitted', feedback: devText_(r[7]).slice(0, 1000) };
  }).reverse();   // newest first

  var bonusTotal = tasks.reduce(function (s, t) { return s + (t.status === 'Accepted' && t.bonus ? t.bonus : 0); }, 0);
  return { email: email, name: payRow ? devText_(payRow[1]) : '', tasks: tasks, pay: pay, income: income, bonuses: bonuses,
    reports: reports, bonusTotal: bonusTotal };
}

/* Saves a weekly report: the file in the developer's Drive folder (shared with them to view), a row in the tab. */
function devReport_(email, body) {
  var week = devText_(body.week).slice(0, 40), summary = devText_(body.summary).slice(0, 2000), f = body.file || null;
  if (!week) return { error: 'bad_week' };
  if (!summary && !f) return { error: 'empty' };
  var name = '', link = '';
  if (f) {
    var type = String(f.type || ''), data = String(f.data || '');
    if (DEV_REPORT_TYPES.indexOf(type) < 0) return { error: 'bad_type' };
    if (!data || data.length * 3 / 4 > DEV_REPORT_MAX) return { error: 'too_large' };
    name = devText_(f.name).replace(/[\\\/:*?"<>|]/g, '_').slice(0, 120) || 'report';
    var top = driveFolder_('devreports'), found = top.getFoldersByName(email);   // Drive.gs
    var folder = found.hasNext() ? found.next() : top.createFolder(email);
    var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data), type, week + ' - ' + name));
    try { file.addViewer(email); } catch (err) { console.warn('devReport_ share: ' + err); }   // a non-Google email cannot be added
    link = file.getUrl();
  }
  var sh = devTab_(DEV_REPORTS, DEV_REPORT_HEAD);
  sh.appendRow([email, week, new Date(), accountCell_(summary, 2000), accountCell_(name, 120), link, 'Submitted', '']);   // Account.gs
  staffLog_(email, 'Weekly report', week + (name ? ': ' + name : ''));   // StaffActivity.gs
  return { ok: true };
}

/* An activity admin adds a task for a developer from the website. */
function devTaskAdd_(admin, who, body) {
  var task = devText_(body.task).slice(0, 40), title = devText_(body.title).slice(0, 200);
  var start = devText_(body.start), due = devText_(body.due);
  if (!task || !title) return { error: 'missing' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(due) || due < start) return { error: 'bad_date' };
  var sh = devTab_(DEV_TASKS, DEV_TASK_HEAD);
  var row = [who, task, title, start, due, 'Not started', '', '', '', '', '', devText_(body.details).slice(0, 3000)];
  sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row.map(function (v) { return accountCell_(v, 3000); })]);
  staffLog_(admin, 'Task added', who + ': ' + task + ' ' + title);
  return { ok: true };
}

function accountDev_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);   // Account.gs
  if (!s) return { error: 'signed_out' };
  var me = accountEmail_(sh.getRange(s.row, ACCOUNT_COL.email).getValue());
  var admin = actIsAdmin_(me), devs = devEmails_();   // StaffActivity.gs
  var who = accountEmail_(body.who) || me, op = String(body.op || '');
  if (admin && !accountEmail_(body.who) && devs.indexOf(me) < 0 && devs.length) who = devs[0];   // an admin opens the first developer
  if (who !== me && !admin) return { error: 'forbidden' };
  if (op === 'report') {
    if (devs.indexOf(me) < 0) return { error: 'forbidden' };   // each developer uploads their own reports
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return { error: 'busy' };
    try { var r = devReport_(me, body); if (r.error) return r; } finally { lock.releaseLock(); }
    who = me;
  } else if (op === 'task_add') {
    if (!admin) return { error: 'forbidden' };
    if (!accountEmail_(body.who)) return { error: 'missing' };
    var t = devTaskAdd_(me, who, body);
    if (t.error) return t;
    devs = devEmails_();
  } else if (op) {
    return { error: 'bad_request' };
  }
  if (devs.indexOf(who) < 0) {
    if (admin) return { me: me, admin: true, devs: devs, dev: null };
    return { error: 'forbidden' };
  }
  if (!admin && !op) staffLog_(me, 'Opened developer portal', '');
  var out = { me: me, admin: admin, dev: devFor_(who, new Date()) };
  if (admin) out.devs = devs;
  return out;
}

/* Run once from the editor (select devPortalSetup, Run); safe to run again. Adds the four tabs and missing columns,
   and the first three tasks when the task tab is still empty. */
function devPortalSetup() {
  var t = devTab_(DEV_TASKS, DEV_TASK_HEAD), p = devTab_(DEV_PAY, DEV_PAY_HEAD);
  var po = devTab_(DEV_PAYOUTS, DEV_PAYOUT_HEAD), rp = devTab_(DEV_REPORTS, DEV_REPORT_HEAD);
  t.getRange('D:E').setNumberFormat('@'); t.getRange('I:I').setNumberFormat('@');
  t.setColumnWidth(1, 200); t.setColumnWidth(3, 260); t.setColumnWidth(10, 420); t.setColumnWidth(12, 420);
  t.getRange('J:J').setWrap(true); t.getRange('L:L').setWrap(true);
  t.getRange(2, 6, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(DEV_STATUS, true).setAllowInvalid(false).build());
  if (t.getLastRow() < 2) {
    var who = '填 Xinyi 的电邮';
    t.getRange(2, 1, 3, DEV_TASK_HEAD.length).setNumberFormat('@').setValues([
      [who, 'Task 1', 'UI / UX 与网页速度', '2026-11-14', '2026-11-20', 'Accepted', '94', '100', '2026-11-21',
       '94/100，Bonus RM 100（85 分以上级别）。PageSpeed 官方测试：手机英文 99、中文 100，桌面 100；首页 LCP 低于 2.5 秒（创办人重测确认）；emoji 已全部换成图标；按钮和输入框符合 44 px 点击区域；准时提交；前后对比截图已交。扣分：UI 细节 2 分、功能范围 3 分、按钮 1 分。', '',
       '手机版和网页版 UI/UX（不改功能）；删除 emoji；按钮和输入框更人性化；PageSpeed 70 分以上（目标 90）；首页 LCP 低于 2.5 秒；提交修改前后截图。'],
      [who, 'Task 2', '旧站申请流程搬到新站', '2026-11-21', '2026-11-27', 'In progress', '', '', '', '', '',
       '把旧站完整的申请步骤搬进新站：填表、上传、IC 和成绩单自动读取与核对（接旧站 Apps Script）、住宿协助、付款。'],
      [who, 'Task 3', '引流系统', '2026-11-28', '2026-12-04', 'Not started', '', '', '', '', '',
       '小游戏、每天登入奖励、最高积分排行榜；发布会幸运抽奖（coming soon）。']
    ]);
  }
  p.getRange('A:B').setNumberFormat('@'); p.setColumnWidth(1, 200); p.setColumnWidth(5, 300);
  if (p.getLastRow() < 2) p.getRange(2, 1, 1, DEV_PAY_HEAD.length).setValues([['填 Xinyi 的电邮', 'Xinyi', '', '', '']]);
  po.getRange('B:B').setNumberFormat('@'); po.setColumnWidth(1, 200); po.setColumnWidth(3, 220); po.setColumnWidth(5, 300); po.setColumnWidth(6, 320);
  p.getRange('F:F').setNumberFormat('@');
  po.getRange(2, 3, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(DEV_PAYOUT_TYPES, true).setAllowInvalid(false).build());
  rp.getRange('C:C').setNumberFormat('yyyy-mm-dd hh:mm'); rp.setColumnWidth(1, 200); rp.setColumnWidth(4, 360); rp.setColumnWidth(6, 260); rp.setColumnWidth(8, 300);
  rp.getRange(2, 7, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Submitted', 'Reviewed'], true).setAllowInvalid(false).build());
  driveFolder_('devreports');   // Drive.gs: the folder for report files
  console.log('Developer portal ready: ' + t.getParent().getUrl() + ' (tabs "' + [DEV_TASKS, DEV_PAY, DEV_PAYOUTS, DEV_REPORTS].join('", "') + '"). ' +
    'Type the developer\'s email in column A, the salary, payday and start date in "' + DEV_PAY + '", and one row per bonus in "' + DEV_PAYOUTS + '".');
}
