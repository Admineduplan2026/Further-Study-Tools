/**
 * Staff goals: the long-term to-do list on the website's staff page (#staff). Each goal has a title, a due date and
 * a done tick; the page counts down to the nearest goal that is not done yet. Stored in the tab "Staff goals" of the
 * master sheet Eduplan School Data (made on first use), so the team can also read or tidy it in the sheet.
 * Only signed-in staff emails (Account.gs STAFF_EMAILS) can read or change it.
 *
 *   {"action":"account_goals","token":"..."}                                          -> {goals:[...]}
 *   {"action":"account_goals","token":"...","op":"add","title":"...","due":"YYYY-MM-DD","note":"..."}
 *   {"action":"account_goals","token":"...","op":"done","id":"G-...","done":true|false}
 *   {"action":"account_goals","token":"...","op":"delete","id":"G-..."}
 */
var GOAL_TAB = 'Staff goals';
var GOAL_COLS = ['id', 'title', 'due', 'note', 'done', 'done_at', 'done_by', 'created_by', 'created_at'];
var GOAL_HEAD = ['ID', 'Goal 目标', 'Due 截止日期', 'Note 备注', 'Done 已完成', 'Done at 完成时间', 'Done by 完成者', 'Added by 新增者', 'Added at 新增时间'];
var GOAL_MAX = 200;

function goalSheet_() {
  var ss = master_(), sh = ss.getSheetByName(GOAL_TAB);   // Code.gs
  if (!sh) {
    sh = ss.insertSheet(GOAL_TAB);
    sh.getRange(1, 1, sh.getMaxRows(), GOAL_COLS.length).setNumberFormat('@');   // dates stay as typed
    sh.getRange(1, 1, 1, GOAL_HEAD.length).setValues([GOAL_HEAD]).setFontWeight('bold').setBackground('#e4f2fa');
    sh.setFrozenRows(1);
  }
  return sh;
}

function goalRows_(sh) {
  var n = sh.getLastRow();
  if (n < 2) return [];
  var tz = sh.getParent().getSpreadsheetTimeZone();
  return sh.getRange(2, 1, n - 1, GOAL_COLS.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    GOAL_COLS.forEach(function (c, j) {
      var v = r[j];
      o[c] = v instanceof Date ? Utilities.formatDate(v, tz, c === 'due' ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss") : String(v == null ? '' : v);
    });
    return o;
  }).filter(function (o) { return o.id && o.title; });
}

function goalOut_(g) {
  return { id: g.id, title: g.title, due: g.due, note: g.note, done: /^yes$/i.test(g.done), doneAt: g.done_at, doneBy: g.done_by, by: g.created_by };
}

function goalText_(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }

function accountGoals_(body) {
  var who = accountStaffEmail_(body);   // Account.gs
  if (who.error) return who;
  var op = String(body.op || ''), lock = LockService.getScriptLock();
  if (op && !lock.tryLock(20000)) return { error: 'busy' };
  try {
    var sh = goalSheet_(), rows = goalRows_(sh), now = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm:ss");
    function find(id) { for (var i = 0; i < rows.length; i++) if (rows[i].id === String(id || '')) return rows[i]; return null; }
    function set(g, col, v) { sh.getRange(g._row, GOAL_COLS.indexOf(col) + 1).setNumberFormat('@').setValue(v); }
    if (op === 'add') {
      var title = goalText_(body.title, 200), due = String(body.due || '').trim();
      if (!title) return { error: 'bad_title' };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || isNaN(Date.parse(due))) return { error: 'bad_date' };
      if (rows.length >= GOAL_MAX) return { error: 'too_many' };
      var row = [ 'G-' + Utilities.getUuid().slice(0, 8).toUpperCase(), title, due, goalText_(body.note, 500), 'No', '', '', who.email, now ];
      sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    } else if (op === 'done') {
      var g = find(body.id);
      if (!g) return { error: 'not_found' };
      var on = body.done === true;
      set(g, 'done', on ? 'Yes' : 'No'); set(g, 'done_at', on ? now : ''); set(g, 'done_by', on ? who.email : '');
    } else if (op === 'delete') {
      var d = find(body.id);
      if (!d) return { error: 'not_found' };
      sh.deleteRow(d._row);
    } else if (op) {
      return { error: 'bad_request' };
    }
    return { goals: goalRows_(sh).map(goalOut_) };
  } finally { if (op) lock.releaseLock(); }
}
