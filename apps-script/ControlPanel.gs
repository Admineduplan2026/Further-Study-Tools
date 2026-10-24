/**
 * Eduplan Control Panel: one private spreadsheet, "Eduplan Control Panel" in "Eduplan Databases", where Eduplan sees
 * every school sheet in "1. School databases" and publishes or hides schools, programmes and campus scholarships with a
 * checkbox. A tick writes Published = Yes (an untick writes No) into the school's own sheet, so the school sheets stay
 * the single source of the data; the live website shows the change on its next load, the Claude artifacts after the
 * daily sync.
 *
 *   Schools        one row per school: programmes ready / published, problems, link to the sheet. Tick "Publish" to
 *                  publish the school with every programme and scholarship that is ready (Check column ✓); untick to
 *                  hide the whole school.
 *   Programmes     one row per programme of every school. Tick or untick one programme; publishing a programme also
 *                  publishes its school row (the website skips programmes of unpublished schools).
 *   Scholarships   one row per campus scholarship tier, the same way.
 *   How to use     short instructions.
 *
 * Run cpSetup once from the editor (select cpSetup, Run): it creates the spreadsheet, its "Eduplan" menu, the checkbox
 * trigger and a daily refresh at 7am, and fills the lists. Menu "Eduplan > Refresh lists" re-reads the school sheets
 * at any time (new schools appear, rows edited in a school sheet are updated).
 */

var CP_NAME = 'Eduplan Control Panel';
var CP_TABS = { overview: 'Overview 总览', schools: 'Schools', programmes: 'Programmes', scholarships: 'Scholarships', help: 'How to use' };
var CP_HEAD = {
  schools: ['Publish 发布', 'School ID 编号', 'Name 名称', 'Type 类型', 'State 州属', 'Programmes 课程', 'Ready 完整', 'Published 已发布', 'Scholarships 奖学金 (published / all)', 'Status 状态', 'School sheet 学校表格', 'Last edited 最后修改'],
  programmes: ['Publish 发布', 'School ID 学校', 'Programme ID 编号', 'Programme 课程', 'Level 学历', 'Eduplan course 科系', 'Years 年数', 'Fee (RM) 学费', 'Check 检查', 'Notes 备注', 'Status 状态'],
  scholarships: ['Publish 发布', 'School ID 学校', 'Scholarship ID 编号', 'Scholarship 奖学金', 'Qualification 资格', 'Minimum result 最低成绩', 'Waiver % 减免', 'Amount (RM) 金额', 'Check 检查', 'Status 状态']
};
var CP_TZ = 'Asia/Kuala_Lumpur';

function cpBook_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('CP_SHEET_ID');
  var live = id && driveSheetLive_(id);   // Drive.gs
  if (live) return live;
  var found = driveTop_().getFilesByName(CP_NAME);   // the panel already made in Drive
  while (found.hasNext()) {
    var f = found.next();
    if (!f.isTrashed() && f.getMimeType() === MimeType.GOOGLE_SHEETS) { props.setProperty('CP_SHEET_ID', f.getId()); return SpreadsheetApp.openById(f.getId()); }
  }
  var ss = SpreadsheetApp.create(CP_NAME);
  DriveApp.getFileById(ss.getId()).moveTo(driveTop_());
  ss.setSpreadsheetTimeZone(CP_TZ);
  props.setProperty('CP_SHEET_ID', ss.getId());
  return ss;
}

function cpTab_(ss, key) {
  var sh = ss.getSheetByName(CP_TABS[key]) || ss.insertSheet(CP_TABS[key]);
  if (CP_HEAD[key]) {
    sh.getRange(1, 1, 1, CP_HEAD[key].length).setValues([CP_HEAD[key]]).setFontWeight('bold').setBackground('#e4f2fa');
    sh.setFrozenRows(1);
  }
  return sh;
}

function cpSetup() {
  var ss = cpBook_();
  var help = cpTab_(ss, 'help');
  help.clear();
  var lines = [
    ['Eduplan Control Panel · 使用说明'],
    [''],
    ['Overview 总览: website numbers, what needs doing, and links to every database. 网站数据、待办事项和所有资料库的链接。'],
    ['Schools: tick "Publish" to put a school on the website with every programme and scholarship that is ready (Check starts with ✓). Untick to hide the whole school.'],
    ['Schools 分页：勾选 Publish，学校连同所有完整（Check 有 ✓）的课程和奖学金一起上线；取消勾选就整间隐藏。'],
    ['Programmes / Scholarships: tick or untick a single row. Publishing a programme also publishes its school. 单独发布或隐藏一行；发布课程会一起发布学校。'],
    ['Check without ✓ = still missing something: open the school sheet (link in Schools) and complete it. Check 没有 ✓ 表示还缺资料，打开学校表格补齐。'],
    ['Every tick writes Published = Yes / No into the school sheet. The Status column says when. 打勾会把 Published 写回学校表格，Status 栏显示时间。'],
    ['The live website updates on its next load (about a minute); the Claude preview pages at the daily sync. 正式网站约一分钟后更新；预览页在每日同步后更新。'],
    ['Change programme details in the school sheet, then Eduplan > Refresh lists. 修改课程资料请在学校表格，然后按 Eduplan > Refresh lists。'],
    ['New school: copy Repository/_Template into a new folder in "1. School databases", fill it in, then Refresh lists. 新学校：复制模板到新文件夹，填好后刷新。'],
    ['Every list has filters in its header row: sort or filter by school, status, level. 每个列表的标题行都有筛选，可按学校、状态、学历排序。'],
    ['The lists and the Overview refresh by themselves every morning at 7am. 每天早上 7 点自动刷新。'],
    ['Do not type in the grey columns: they are copied from the school sheets. 灰色栏位是从学校表格复制的，请不要在这里输入。']
  ];
  help.getRange(1, 1, lines.length, 1).setValues(lines);
  help.getRange('A1').setFontSize(16).setFontWeight('bold');
  help.setColumnWidth(1, 900);
  ['schools', 'programmes', 'scholarships'].forEach(function (k) { cpTab_(ss, k); });
  var first = ss.getSheets()[0];
  if (first.getName() === 'Sheet1') ss.deleteSheet(first);
  ss.setActiveSheet(ss.getSheetByName(CP_TABS.schools));
  ss.moveActiveSheet(2);   // after Overview 总览, which cpRefresh puts first

  var id = ss.getId(), triggers = ScriptApp.getProjectTriggers();
  function has(fn) { return triggers.some(function (t) { return t.getHandlerFunction() === fn; }); }
  if (!has('cpOnEdit')) ScriptApp.newTrigger('cpOnEdit').forSpreadsheet(id).onEdit().create();
  if (!has('cpOnOpen')) ScriptApp.newTrigger('cpOnOpen').forSpreadsheet(id).onOpen().create();
  if (!has('cpRefresh')) ScriptApp.newTrigger('cpRefresh').timeBased().everyDays(1).atHour(7).inTimezone(CP_TZ).create();
  cpRefresh();
  console.log('Eduplan Control Panel: ' + ss.getUrl());
}

function cpOnOpen() {
  SpreadsheetApp.getUi().createMenu('Eduplan')
    .addItem('Refresh lists', 'cpRefreshMenu')
    .addItem('Check data (what the website will show)', 'showCheck')   // Code.gs
    .addItem('Refresh website data now', 'clearCache')                 // Code.gs
    .addToUi();
}
function cpRefreshMenu() {
  var n = cpRefresh();
  SpreadsheetApp.getUi().alert('Lists refreshed: ' + n.schools + ' schools, ' + n.programmes + ' programmes, ' + n.scholarships + ' scholarships.');
}

/* One tab of a school sheet as {keys, rows: [{row, v: {key: value}}]} (data rows only; empty rows and the template's
   EXAMPLE rows are left out). */
function cpRead_(ss, key) {
  var sh = ss.getSheetByName(SHEETS[key]);
  if (!sh || sh.getLastRow() < FIRST_ROW) return { sheet: sh, keys: [], rows: [] };
  var all = sh.getDataRange().getValues(), keys = (all[KEY_ROW - 1] || []).map(function (k) { return String(k).trim(); }), rows = [];
  for (var r = FIRST_ROW - 1; r < all.length; r++) {
    var v = {};
    keys.forEach(function (k, c) { if (k) v[k] = all[r][c]; });
    var id = String(v.institution_id || '').trim();
    if (!id || /^EXAMPLE/i.test(id)) continue;
    rows.push({ row: r + 1, v: v });
  }
  return { sheet: sh, keys: keys, rows: rows };
}
function cpYes_(v) { return String(v || '').trim().toLowerCase() === 'yes'; }
function cpReady_(v) { return /^✓/.test(String(v.check || '').trim()); }
function cpShort_(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function cpWhen_() { return Utilities.formatDate(new Date(), CP_TZ, 'yyyy-MM-dd HH:mm'); }

/* Re-reads every school sheet and rewrites the three lists. Returns the counts. */
function cpRefresh() {
  var ss = cpBook_(), schools = [], progs = [], schs = [], map = {};
  schoolFiles_().forEach(function (f) {   // Code.gs
    var book;
    try { book = SpreadsheetApp.openById(f.getId()); } catch (err) { console.error('cpRefresh ' + f.getName() + ': ' + err); return; }
    var inst = cpRead_(book, 'institutions'), pr = cpRead_(book, 'programmes'), sc = cpRead_(book, 'campus');
    var head = inst.rows[0], sid = head ? String(head.v.institution_id).trim() : f.getName();
    map[sid] = f.getId();
    var ready = pr.rows.filter(function (x) { return cpReady_(x.v); }).length, pub = pr.rows.filter(function (x) { return cpYes_(x.v.published); }).length;
    var spub = sc.rows.filter(function (x) { return cpYes_(x.v.published); }).length;
    var problems = pr.rows.length - ready;
    schools.push([head && cpYes_(head.v.published), sid, head ? head.v.name : '(no Institutions row)', head ? head.v.type : '', head ? head.v.state : '',
      pr.rows.length, ready, pub, spub + ' / ' + sc.rows.length,
      !head ? 'Fill in the Institutions row first' : head && !cpReady_(head.v) ? 'School row: ' + cpShort_(head.v.check, 120) : problems ? problems + ' programme(s) still missing something' : 'Ready',
      '=HYPERLINK("' + f.getUrl() + '","Open ' + sid + '")', Utilities.formatDate(f.getLastUpdated(), CP_TZ, 'yyyy-MM-dd HH:mm')]);
    pr.rows.forEach(function (x) {
      var v = x.v;
      progs.push([cpYes_(v.published), sid, v.programme_id, v.programme_name, v.level, v.course, v.duration_years, v.tuition_fee_rm,
        cpShort_(v.check, 120), cpShort_(v.notes, 200), '']);
    });
    sc.rows.forEach(function (x) {
      var v = x.v;
      schs.push([cpYes_(v.published), sid, v.scholarship_id, v.scholarship_name, v.qualification, v.minimum_result, v.waiver_percent, v.fixed_amount_rm,
        cpShort_(v.check, 120), '']);
    });
  });
  PropertiesService.getScriptProperties().setProperty('CP_SCHOOLS', JSON.stringify(map));
  cpWrite_(ss, 'schools', schools);
  cpWrite_(ss, 'programmes', progs);
  cpWrite_(ss, 'scholarships', schs);
  cpOverview_(ss, schools, progs, schs);
  return { schools: schools.length, programmes: progs.length, scholarships: schs.length };
}

function cpWrite_(ss, key, rows) {
  var sh = cpTab_(ss, key), width = CP_HEAD[key].length;
  if (sh.getMaxRows() > 1) sh.getRange(2, 1, sh.getMaxRows() - 1, sh.getMaxColumns()).clearContent().clearDataValidations();
  if (!rows.length) return;
  if (sh.getMaxRows() < rows.length + 1) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
  sh.getRange(2, 1, rows.length, width).setValues(rows);
  sh.getRange(2, 1, rows.length, 1).insertCheckboxes();
  sh.getRange(2, 2, rows.length, width - 1).setBackground('#f3f5f7');
  sh.getRange(2, width, rows.length, 1).setBackground(null);
  if (key === 'schools') sh.getRange(2, 10, rows.length, 1).setBackground(null);
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, rows.length + 1, width).createFilter();   // sort and filter from the header row
  sh.autoResizeColumns(1, 3);
}

/* Overview 总览: the first tab. What is on the website, what needs doing, and where every database is, in plain words.
   Student numbers are counts only (rows), no names or details. */
function cpCount_(get) { try { var sh = get(); return Math.max(0, sh.getLastRow() - 1); } catch (err) { return ''; } }
function cpOverview_(ss, schools, progs, schs) {
  var sh = ss.getSheetByName(CP_TABS.overview) || ss.insertSheet(CP_TABS.overview, 0);
  sh.clear(); sh.setHiddenGridlines(true);
  var pubSchools = schools.filter(function (r) { return r[0] === true; }).length;
  var readyNotPub = schools.filter(function (r) { return r[0] !== true && r[9] === 'Ready'; }).length;
  var fix = schools.filter(function (r) { return r[9] !== 'Ready'; });
  var pay = null; try { pay = payTab_(); } catch (err) { /* Payments.gs not set up */ }
  var payRows = pay && pay.getLastRow() > 1 ? pay.getRange(2, PAY_COL.status, pay.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  var waiting = payRows.filter(function (x) { return x === PAY_STATUS[0] || x === PAY_STATUS[1]; }).length;
  function link(name, url) { return url ? '=HYPERLINK("' + url + '","' + name.replace(/"/g, '') + '")' : name; }
  function url(get) { try { return get(); } catch (err) { return ''; } }
  var rows = [
    ['Eduplan 管理总览 · Admin overview', '', ''],
    ['Updated 更新于 ' + cpWhen_() + ' · Eduplan > Refresh lists 刷新', '', ''],
    ['', '', ''],
    ['① 网站资料 Website data', 'Number 数量', 'What it means 说明'],
    ['Schools 学校', schools.length, pubSchools + ' published 已发布 · ' + readyNotPub + ' ready to publish 可发布 · ' + fix.length + ' need fixing 需补资料'],
    ['Programmes 课程', progs.length, progs.filter(function (r) { return r[0] === true; }).length + ' published 已发布'],
    ['Campus scholarships 校内奖学金', schs.length, schs.filter(function (r) { return r[0] === true; }).length + ' published 已发布'],
    ['', '', ''],
    ['② 学生 Students (counts only 只显示数量)', 'Number 数量', ''],
    ['Registered students 注册学生', cpCount_(function () { return accountSheet_(); }), 'Eduplan Student Portfolios › Students'],
    ['Applications 申请', cpCount_(function () { return applySheet_(applyFolder_()); }), 'Eduplan Applications'],
    ['Payment requests 付款申请', payRows.length, waiting + ' waiting 待处理 · ' + payRows.filter(function (x) { return x === 'Paid'; }).length + ' paid 已付'],
    ['', '', ''],
    ['③ 需要处理 To do', '', ''],
    [readyNotPub ? 'Publish ready schools 发布已完整的学校' : 'No school waiting to be published 没有待发布的学校', readyNotPub || '', readyNotPub ? 'Schools tab: tick Publish 在 Schools 分页打勾' : ''],
    [fix.length ? 'Schools missing information 学校资料不完整' : 'All school sheets are complete 所有学校资料完整', fix.length || '', fix.length ? fix.slice(0, 12).map(function (r) { return r[1]; }).join(', ') + (fix.length > 12 ? ' …' : '') : ''],
    [waiting ? 'Payments waiting 待处理的付款' : 'No payment waiting 没有待处理的付款', waiting || '', waiting ? 'Eduplan Payments: set Status to Paid when paid 已付款时把状态改为 Paid' : ''],
    ['', '', ''],
    ['④ 所有资料库 Where everything is (Eduplan Databases)', 'Who can see 谁能看', 'What is inside 内容'],
    [link('Eduplan Control Panel (this sheet 本表)', ss.getUrl()), 'Eduplan only', 'Publish or hide schools, programmes, scholarships 发布或隐藏'],
    [link('1. School databases 学校资料库', url(function () { return DriveApp.getFolderById(SCHOOL_FOLDER_ID).getUrl(); })), 'Eduplan; each school sees only its own sheet 学校只看自己的表格', 'One folder + sheet per school: programmes, fees, scholarships 每校一个表格'],
    [link('2. Student applications 学生申请 (private)', url(function () { return applyFolder_().getUrl(); })), 'Eduplan only 仅 Eduplan', 'Application forms, filled-in school forms, uploaded documents 申请表与文件'],
    [link('3. Students and visitors 学生与访客 (private)', url(function () { return driveFolder_('people').getUrl(); })), 'Eduplan only 仅 Eduplan', 'Registered students, sign-ins, visits per day 注册、登入、每日访客'],
    [link('4. Payments 付款 (private)', url(function () { return driveFolder_('pay').getUrl(); })), 'Eduplan only 仅 Eduplan', 'Payment requests and PDF payment records 付款申请与付款记录'],
    [link('Master sheet 主表格 (foundation scholarships, FAQ, lists)', url(function () { return DriveApp.getFileById(master_().getId()).getUrl(); })), 'Eduplan only 仅 Eduplan', 'Foundation scholarships, FAQ answers for the AI, dropdown lists 基金会奖学金、FAQ'],
    ['', '', ''],
    ['Never share a whole school folder or any private folder with a school. 不要把整个学校文件夹或私人文件夹分享给学校。', '', '']
  ];
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  sh.getRange('A1').setFontSize(18).setFontWeight('bold');
  sh.getRange('A2').setFontColor('#58616c');
  [4, 9, 14, 19].forEach(function (r) { sh.getRange(r, 1, 1, 3).setFontWeight('bold').setBackground('#0b3a5c').setFontColor('#ffffff'); });
  [[5, 7], [10, 12], [15, 17], [20, 25]].forEach(function (b) { sh.getRange(b[0], 1, b[1] - b[0] + 1, 3).setBackground('#f3f6f8').setVerticalAlignment('middle'); });
  sh.getRange(5, 2, 8, 1).setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(15, 2, 3, 1).setFontWeight('bold').setHorizontalAlignment('center').setFontColor('#b3261e');
  sh.getRange(rows.length, 1).setFontColor('#b3261e').setFontWeight('bold');
  sh.setColumnWidth(1, 430); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 560);
  sh.getRange(1, 1, rows.length, 3).setWrap(true);
  ss.setActiveSheet(sh); ss.moveActiveSheet(1);
}

/* Installable edit trigger on the Control Panel: a ticked or unticked box publishes or hides in the school sheet. */
function cpOnEdit(e) {
  var r = e && e.range;
  if (!r || r.getColumn() !== 1 || r.getRow() < 2) return;
  var sh = r.getSheet(), name = sh.getName(), key = name === CP_TABS.schools ? 'schools' : name === CP_TABS.programmes ? 'programmes' : name === CP_TABS.scholarships ? 'scholarships' : '';
  if (!key) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) { sh.getRange(r.getRow(), CP_HEAD[key].length).setValue('Busy, please tick again'); return; }
  try {
    var map = JSON.parse(PropertiesService.getScriptProperties().getProperty('CP_SCHOOLS') || '{}');
    for (var row = r.getRow(); row <= r.getLastRow(); row++) {
      var vals = sh.getRange(row, 1, 1, 3).getValues()[0], on = vals[0] === true, sid = String(vals[1]), id = String(vals[2]);
      var status = sh.getRange(row, key === 'schools' ? 10 : CP_HEAD[key].length), msg;
      try {
        if (!map[sid]) throw new Error('school sheet not found; use Eduplan > Refresh lists');
        var book = SpreadsheetApp.openById(map[sid]);
        msg = key === 'schools' ? cpPublishSchool_(book, on) : cpPublishRow_(book, key === 'programmes' ? 'programmes' : 'campus', key === 'programmes' ? 'programme_id' : 'scholarship_id', id, on);
      } catch (err) { msg = '✗ ' + err.message; }
      status.setValue(msg + ' · ' + cpWhen_());
    }
    CacheService.getScriptCache().remove(CACHE_KEY + ':stamp');   // the live website reads the sheets again now
  } finally { lock.releaseLock(); }
}

/* Sets the published cell of the given rows of a school tab. */
function cpSet_(tab, rows, on) {
  var c = tab.keys.indexOf('published') + 1;
  if (!c) throw new Error('no published column in ' + tab.sheet.getName());
  rows.forEach(function (x) { tab.sheet.getRange(x.row, c).setValue(on ? 'Yes' : 'No'); });
}

/* Publish: the school row and every ready programme and scholarship. Hide: the school row and everything in it. */
function cpPublishSchool_(book, on) {
  var inst = cpRead_(book, 'institutions'), pr = cpRead_(book, 'programmes'), sc = cpRead_(book, 'campus');
  if (!inst.rows.length) throw new Error('no Institutions row');
  if (!on) {
    cpSet_(inst, inst.rows, false); cpSet_(pr, pr.rows, false); if (sc.rows.length) cpSet_(sc, sc.rows, false);
    return 'Hidden: school, ' + pr.rows.length + ' programmes and ' + sc.rows.length + ' scholarships';
  }
  if (!cpReady_(inst.rows[0].v)) throw new Error('school row not ready: ' + cpShort_(inst.rows[0].v.check, 80));
  var rp = pr.rows.filter(function (x) { return cpReady_(x.v); }), rs = sc.rows.filter(function (x) { return cpReady_(x.v); });
  cpSet_(inst, inst.rows.slice(0, 1), true); cpSet_(pr, rp, true); if (rs.length) cpSet_(sc, rs, true);
  return '✓ Published: ' + rp.length + ' of ' + pr.rows.length + ' programmes, ' + rs.length + ' of ' + sc.rows.length + ' scholarships' +
    (pr.rows.length - rp.length ? ' (' + (pr.rows.length - rp.length) + ' not ready, left hidden)' : '');
}

/* One programme or scholarship; publishing it also publishes its school row. */
function cpPublishRow_(book, tabKey, idKey, id, on) {
  var tab = cpRead_(book, tabKey), hit = tab.rows.filter(function (x) { return String(x.v[idKey]).trim() === id; });
  if (!hit.length) throw new Error(id + ' not found in the school sheet; use Eduplan > Refresh lists');
  if (on && !cpReady_(hit[0].v)) throw new Error('not ready: ' + cpShort_(hit[0].v.check, 80));
  cpSet_(tab, hit, on);
  if (on) {
    var inst = cpRead_(book, 'institutions');
    if (inst.rows.length && !cpYes_(inst.rows[0].v.published)) { cpSet_(inst, inst.rows.slice(0, 1), true); return '✓ Published (school published too)'; }
    return '✓ Published';
  }
  return 'Hidden';
}
