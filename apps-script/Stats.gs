/**
 * Eduplan student overview: who registered, signed in and used the website, and how many guests visited.
 * Everything is in the private spreadsheet "Eduplan Student Portfolios" (Account.gs), next to the "Students" tab:
 *   - Students     one row per student; column L "Last active" is updated whenever the student uses the website.
 *   - Sign-in log  one row per event: Registered (first sign-in), Signed in, Signed out, Deleted portfolio.
 *   - Visits       one row per day (Malaysia time): visits by guests and by signed-in students, and by route.
 *                  Guests are counted anonymously: no cookies, no IP address, no identifier; one count per browser tab.
 *   - Overview     the numbers at a glance, the latest activity and a chart of visits.
 * Run statsSetup once from the editor (select statsSetup, Run) to add the tabs; it can be run again safely.
 *
 * The website POSTs {"action":"visit","member":true|false,"mode":"interest"|"scholarship"|"guidance"} to /exec.
 */

var STATS_LOG = 'Sign-in log', STATS_VISITS = 'Visits', STATS_OVERVIEW = 'Overview';
var STATS_ACTIVE_COL = 12;   // column L of Students
var STATS_MODES = ['interest', 'scholarship', 'guidance'];

function statsBook_() { return accountSheet_().getParent(); }

function statsTab_(name, head) {
  var ss = statsBook_(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (head) {
      sh.appendRow(head);
      sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#e4f2fa');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

/* The student used the website now (Account.gs calls this on sign-in, load and save). */
function statsActive_(sh, row) {
  try { sh.getRange(row, STATS_ACTIVE_COL).setValue(new Date()); } catch (err) { console.error('statsActive_: ' + err); }
}

/* One line in the sign-in log. */
function statsLog_(email, type) {
  try { statsTab_(STATS_LOG, ['Time', 'Email', 'Event']).appendRow([new Date(), accountCell_(email, 120), type]); }
  catch (err) { console.error('statsLog_: ' + err); }
}

/* An anonymous visit: today's row gets +1 for guests or signed-in students, and +1 for the route. */
function statsVisit_(body) {
  var mode = STATS_MODES.indexOf(body.mode) > -1 ? body.mode : '';
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { ok: false };
  try {
    var sh = statsTab_(STATS_VISITS, ['Date', 'Guests', 'Signed-in students', 'Interest', 'Scholarship', 'Guidance']);
    var day = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd'), last = sh.getLastRow(), row = 0;
    if (last > 1) {
      var d = sh.getRange(last, 1).getDisplayValue();
      if (d === day) row = last;
    }
    if (!row) { sh.appendRow([day, 0, 0, 0, 0, 0]); row = sh.getLastRow(); sh.getRange(row, 1).setNumberFormat('yyyy-mm-dd'); }
    var r = sh.getRange(row, 2, 1, 5), v = r.getValues()[0].map(function (x) { return Number(x) || 0; });
    v[body.member ? 1 : 0]++;
    if (mode) v[2 + STATS_MODES.indexOf(mode)]++;
    r.setValues([v]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/* Adds the Last active column, the log, the visits and the Overview tab with live formulas and a chart. */
function statsSetup() {
  var st = accountSheet_(), ss = st.getParent();
  ss.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
  ss.setRecalculationInterval(SpreadsheetApp.RecalculationInterval.MINUTE);   // "active now" keeps up to date
  st.getRange(1, STATS_ACTIVE_COL).setValue('Last active').setFontWeight('bold').setBackground('#e4f2fa');
  st.getRange('B:D').setNumberFormat('yyyy-mm-dd hh:mm');
  st.getRange(2, STATS_ACTIVE_COL, Math.max(st.getMaxRows() - 1, 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');
  var log = statsTab_(STATS_LOG, ['Time', 'Email', 'Event']);
  log.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  var vis = statsTab_(STATS_VISITS, ['Date', 'Guests', 'Signed-in students', 'Interest', 'Scholarship', 'Guidance']);

  var ov = ss.getSheetByName(STATS_OVERVIEW) || ss.insertSheet(STATS_OVERVIEW, 0);
  ov.clear();
  ov.getCharts().forEach(function (c) { ov.removeChart(c); });
  var S = "Students!", L = "'" + STATS_LOG + "'!", V = STATS_VISITS + '!';
  var rows = [
    ['Eduplan student overview', ''],
    ['Updated every minute. Times are Malaysia time.', ''],
    ['', ''],
    ['Students', ''],
    ['Registered students (all time)', '=COUNTA(' + S + 'A2:A)'],
    ['New registrations today', '=COUNTIFS(' + S + 'B2:B,">="&TODAY())'],
    ['New registrations, last 7 days', '=COUNTIFS(' + S + 'B2:B,">="&TODAY()-6)'],
    ['Active in the last 15 minutes ("online now")', '=COUNTIFS(' + S + 'L2:L,">="&NOW()-15/1440)'],
    ['Active today', '=COUNTIFS(' + S + 'L2:L,">="&TODAY())'],
    ['Active, last 7 days', '=COUNTIFS(' + S + 'L2:L,">="&TODAY()-6)'],
    ['', ''],
    ['Sign-ins', ''],
    ['Sign-ins today (existing accounts)', '=COUNTIFS(' + L + 'A2:A,">="&TODAY(),' + L + 'C2:C,"Signed in")'],
    ['Registrations today (first sign-in)', '=COUNTIFS(' + L + 'A2:A,">="&TODAY(),' + L + 'C2:C,"Registered")'],
    ['Sign-ins, last 7 days', '=COUNTIFS(' + L + 'A2:A,">="&TODAY()-6,' + L + 'C2:C,"Signed in")'],
    ['', ''],
    ['Visits today (one per browser tab)', ''],
    ['Guests', '=IFERROR(VLOOKUP(TEXT(TODAY(),"yyyy-mm-dd"),{ARRAYFORMULA(TEXT(' + V + 'A2:A,"yyyy-mm-dd")),' + V + 'B2:B},2,FALSE),0)'],
    ['Signed-in students', '=IFERROR(VLOOKUP(TEXT(TODAY(),"yyyy-mm-dd"),{ARRAYFORMULA(TEXT(' + V + 'A2:A,"yyyy-mm-dd")),' + V + 'C2:C},2,FALSE),0)'],
    ['Guests, last 7 days', '=SUMIFS(' + V + 'B2:B,' + V + 'A2:A,">="&TODAY()-6)'],
    ['Signed-in students, last 7 days', '=SUMIFS(' + V + 'C2:C,' + V + 'A2:A,">="&TODAY()-6)']
  ];
  ov.getRange(1, 1, rows.length, 2).setValues(rows);
  ov.getRange('A1').setFontSize(16).setFontWeight('bold');
  ov.getRange('A2').setFontColor('#58616c');
  [4, 12, 17].forEach(function (r) { ov.getRange(r, 1, 1, 2).setFontWeight('bold').setBackground('#e4f2fa'); });
  ov.getRange('B5:B21').setFontWeight('bold').setHorizontalAlignment('left');
  ov.setColumnWidth(1, 330); ov.setColumnWidth(2, 90);

  ov.getRange('D1').setValue('Latest activity (most recent first)').setFontWeight('bold').setFontSize(12);
  ov.getRange('D2').setFormula('=IFERROR(QUERY(' + S + 'A2:L,"select A, L, C, B where A is not null order by L desc limit 25 label A \'Email\', L \'Last active\', C \'Last sign-in\', B \'Registered\'",0),"No students yet")');
  ov.getRange('D30').setValue('Latest sign-in events').setFontWeight('bold').setFontSize(12);
  ov.getRange('D31').setFormula("=IFERROR(QUERY(" + L + "A2:C,\"select A, B, C where A is not null order by A desc limit 25 label A 'Time', B 'Email', C 'Event'\",0),\"No events yet\")");
  ov.getRange('E:F').setNumberFormat('yyyy-mm-dd hh:mm'); ov.getRange('G:G').setNumberFormat('yyyy-mm-dd hh:mm');
  ov.getRange('D32:D60').setNumberFormat('yyyy-mm-dd hh:mm');
  ov.setColumnWidth(4, 230); ov.setColumnWidths(5, 3, 140);

  var chart = ov.newChart().asLineChart().addRange(vis.getRange('A1:C400')).setNumHeaders(1)
    .setPosition(23, 1, 0, 0).setOption('title', 'Visits per day').setOption('width', 420).setOption('height', 240).build();
  ov.insertChart(chart);
  ov.setFrozenRows(0);
  console.log('Overview ready: ' + ss.getUrl());
}
