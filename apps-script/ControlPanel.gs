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
var CP_TABS = { schools: 'Schools', programmes: 'Programmes', scholarships: 'Scholarships', help: 'How to use' };
var CP_HEAD = {
  schools: ['Publish', 'School ID', 'Name', 'Type', 'State', 'Programmes', 'Ready', 'Published', 'Scholarships (published / all)', 'Status', 'School sheet', 'Sheet last edited'],
  programmes: ['Publish', 'School ID', 'Programme ID', 'Programme', 'Level', 'Eduplan course', 'Years', 'Fee (RM)', 'Check', 'Notes', 'Status'],
  scholarships: ['Publish', 'School ID', 'Scholarship ID', 'Scholarship', 'Qualification', 'Minimum result', 'Waiver %', 'Amount (RM)', 'Check', 'Status']
};
var CP_TZ = 'Asia/Kuala_Lumpur';

function cpBook_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('CP_SHEET_ID');
  var live = id && driveSheetLive_(id);   // Drive.gs
  if (live) return live;
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
  help.getRange(1, 1, 12, 1).setValues([
    ['Eduplan Control Panel'],
    [''],
    ['Schools tab: tick "Publish" to put a school on the website with every programme and scholarship that is ready (Check column starts with ✓). Untick to hide the whole school.'],
    ['Programmes / Scholarships tabs: tick or untick a single row. Publishing a programme also publishes its school.'],
    ['Rows whose Check does not start with ✓ still miss something: open the school sheet (link in the Schools tab) and complete them first.'],
    ['Each tick or untick writes Published = Yes / No into the school sheet itself. The Status column says when it was done.'],
    ['The live website shows the change on its next load (about a minute). The Claude preview pages follow at the daily sync.'],
    ['To change programme details (names, fees, requirements), edit the school sheet, then menu Eduplan > Refresh lists.'],
    ['New school: copy Repository/_Template into a new folder in "1. School databases", fill it in, then Eduplan > Refresh lists.'],
    ['The lists refresh by themselves every morning at 7am.'],
    [''],
    ['Do not type in the grey columns: they are copied from the school sheets.']
  ]);
  help.getRange('A1').setFontSize(16).setFontWeight('bold');
  help.setColumnWidth(1, 900);
  ['schools', 'programmes', 'scholarships'].forEach(function (k) { cpTab_(ss, k); });
  var first = ss.getSheets()[0];
  if (first.getName() === 'Sheet1') ss.deleteSheet(first);
  ss.setActiveSheet(ss.getSheetByName(CP_TABS.schools));
  ss.moveActiveSheet(1);

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
  sh.autoResizeColumns(1, 3);
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
