/**
 * Eduplan tuition payments: the student chooses a plan (per semester or full payment) and a method (FPX, Touch 'n Go
 * eWallet or PayPal) after applying. Payments go to Eduplan's merchant account.
 *
 * The website POSTs {"action":"pay_create","token":"...","prog":"<programme id>","plan":"semester"|"full",
 *   "method":"fpx"|"tng"|"paypal","amount":<RM due now>,"total":<RM after scholarship>} to /exec (doPost in Code.gs).
 * The student must be signed in. Every request is a row in the private spreadsheet "Eduplan Payments" in
 * "Eduplan Databases/4. Payments (private)" (Drive.gs), so Eduplan can confirm the amount with the university and
 * follow up.
 *
 * Proof of payment: when a row's Status becomes "Paid" (chosen by Eduplan staff in the sheet, or set by the payment
 * gateway through payMarkPaid_), a PDF payment record is saved automatically in
 * "4. Payments (private)/Receipts/<yyyy-MM>/<PAY-...>/" and linked in the Receipt column. Add the bank slip or the
 * gateway's receipt to the same folder. The sheet trigger is turned on by driveOrganize (Drive.gs).
 *
 * No payment gateway is connected yet: the reply is {ok, ref, pending:true} and the website tells the student that a
 * counsellor will send the payment details. When Eduplan opens a merchant account (FPX / Touch 'n Go through a
 * Malaysian gateway, PayPal through PayPal Business), the gateway's checkout is added in payCheckout_ and the reply
 * carries {url} to send the student to the gateway's own page. Card and bank details are entered only there.
 */

var PAY_TAB = 'Payments';
var PAY_HEADERS = ['Time', 'Reference', 'Email', 'Programme', 'Plan', 'Method', 'Amount due now (RM)', 'Total after scholarship (RM)',
  'Status', 'Paid on', 'Transaction ID', 'Receipt'];
var PAY_COL = { ref: 2, status: 9, paidOn: 10, txn: 11, receipt: 12 };
var PAY_STATUS = ['Requested: online payment not open yet', 'Sent to payment page', 'Paid', 'Cancelled'];
var PAY_PLANS = { semester: 'Per semester (instalments)', full: 'Full payment' };
var PAY_METHODS = { fpx: 'FPX online banking', tng: "Touch 'n Go eWallet", paypal: 'PayPal' };

function payCreate_(body) {
  var plan = String(body.plan || ''), method = String(body.method || ''), amount = Number(body.amount), total = Number(body.total);
  if (!PAY_PLANS[plan] || !PAY_METHODS[method] || !(amount > 0 && amount < 1e6) || !(total >= amount && total < 1e7)) return { error: 'bad_request' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { error: 'busy' };
  try {
    var sh = accountSheet_(), s = accountSession_(sh, body.token);
    if (!s) return { error: 'signed_out' };
    var email = String(sh.getRange(s.row, ACCOUNT_COL.email).getValue());
    var ref = 'PAY-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    var tab = payTab_();
    var checkout = payCheckout_(ref, email, method, amount);
    tab.appendRow([new Date(), ref, accountCell_(email, 120), accountCell_(body.prog, 60), PAY_PLANS[plan], PAY_METHODS[method],
      Math.round(amount * 100) / 100, Math.round(total * 100) / 100, checkout.url ? PAY_STATUS[1] : PAY_STATUS[0], '', '', '']);
    statsActive_(sh, s.row);
    return checkout.url ? { ok: true, ref: ref, url: checkout.url } : { ok: true, ref: ref, pending: true };
  } finally { lock.releaseLock(); }
}

/* The gateway's checkout page for this payment, or {} while no gateway is connected (Script Property PAY_GATEWAY). */
function payCheckout_(ref, email, method, amount) {
  var gateway = PropertiesService.getScriptProperties().getProperty('PAY_GATEWAY');
  if (!gateway) return {};
  console.error('PAY_GATEWAY "' + gateway + '" is set but no checkout is built for it yet.');
  return {};
}

/* The "Payments" tab of "Eduplan Payments" (4. Payments (private)), created when missing. */
function payTab_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('PAY_SHEET_ID'), ss = null;
  if (id) ss = driveSheetLive_(id);   // Drive.gs: not deleted or in the trash
  if (!ss) {
    ss = SpreadsheetApp.create('Eduplan Payments');
    DriveApp.getFileById(ss.getId()).moveTo(driveFolder_('pay'));
    ss.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
    var first = ss.getSheets()[0];
    first.setName(PAY_TAB);
    first.appendRow(PAY_HEADERS);
    first.getRange(1, 1, 1, PAY_HEADERS.length).setFontWeight('bold').setBackground('#e4f2fa');
    first.setFrozenRows(1);
    first.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
    first.getRange('J:J').setNumberFormat('yyyy-mm-dd hh:mm');
    first.getRange(2, PAY_COL.status, first.getMaxRows() - 1, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(PAY_STATUS, true).setAllowInvalid(false).build());
    props.setProperty('PAY_SHEET_ID', ss.getId());
  }
  return ss.getSheetByName(PAY_TAB) || ss.getSheets()[0];
}

/* Moves the rows of the old "Payments" tab in "Eduplan Student Portfolios" into "Eduplan Payments", then removes it. */
function payMoveOldTab_() {
  var old = statsBook_().getSheetByName(PAY_TAB);
  if (!old) return;
  var v = old.getDataRange().getValues().slice(1).filter(function (r) { return r[1]; }), tab = payTab_();
  var have = tab.getLastRow() > 1 ? tab.getRange(2, PAY_COL.ref, tab.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
  v.filter(function (r) { return have.indexOf(r[1]) < 0; }).forEach(function (r) {
    tab.appendRow(r.slice(0, 9).concat(['', '', '']));
  });
  statsBook_().deleteSheet(old);
  console.log('Moved ' + v.length + ' payment row(s) to Eduplan Payments.');
}

/* The installable edit trigger on "Eduplan Payments": choosing "Paid" saves the payment record. */
function paySetupTrigger_() {
  var id = payTab_().getParent().getId();
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'payOnEdit' && t.getTriggerSourceId() === id; });
  if (!has) ScriptApp.newTrigger('payOnEdit').forSpreadsheet(id).onEdit().create();
}

function payOnEdit(e) {
  var r = e && e.range;
  if (!r || r.getSheet().getName() !== PAY_TAB || r.getRow() < 2) return;
  if (r.getColumn() > PAY_COL.status || r.getLastColumn() < PAY_COL.status) return;
  for (var row = r.getRow(); row <= r.getLastRow(); row++) {
    if (String(r.getSheet().getRange(row, PAY_COL.status).getValue()) === 'Paid') payReceipt_(r.getSheet(), row);
  }
}

/* For the payment gateway's confirmation later: marks the request paid and saves the record. */
function payMarkPaid_(ref, transactionId) {
  var tab = payTab_(), last = tab.getLastRow();
  if (last < 2) return false;
  var refs = tab.getRange(2, PAY_COL.ref, last - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (refs[i][0] !== ref) continue;
    var row = i + 2;
    tab.getRange(row, PAY_COL.status).setValue('Paid');
    if (transactionId) tab.getRange(row, PAY_COL.txn).setValue(accountCell_(transactionId, 80));
    payReceipt_(tab, row);
    return true;
  }
  return false;
}

/* The payment record PDF in Receipts/<yyyy-MM>/<ref>/, once per payment; the link goes in the Receipt column. */
function payReceipt_(tab, row) {
  if (tab.getRange(row, PAY_COL.receipt).getValue()) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    if (tab.getRange(row, PAY_COL.receipt).getValue()) return;
    var v = tab.getRange(row, 1, 1, PAY_HEADERS.length).getValues()[0], ref = String(v[1] || '');
    if (!/^PAY-/.test(ref)) return;
    var paid = v[9] instanceof Date ? v[9] : new Date();
    if (!(v[9] instanceof Date)) tab.getRange(row, PAY_COL.paidOn).setValue(paid);
    var month = Utilities.formatDate(paid, 'Asia/Kuala_Lumpur', 'yyyy-MM'), root = driveFolder_('receipts');
    var dirs = root.getFoldersByName(month), mdir = dirs.hasNext() ? dirs.next() : root.createFolder(month);
    var rdirs = mdir.getFoldersByName(ref), dir = rdirs.hasNext() ? rdirs.next() : mdir.createFolder(ref);
    function money(n) { return 'RM ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function when(d) { return d instanceof Date ? Utilities.formatDate(d, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm') : String(d || ''); }
    var rows = [['Reference', ref], ['Requested on', when(v[0])], ['Paid on', when(paid)], ['Student (email)', v[2]], ['Programme', v[3]],
      ['Plan', v[4]], ['Payment method', v[5]], ['Amount paid', money(v[6])], ['Total after scholarship', money(v[7])],
      ['Transaction ID', v[10] || '(none recorded)']];
    var html = '<html><head><style>body{font-family:Arial,sans-serif;font-size:12px;color:#1c2733;margin:36px}h1{font-size:20px;margin:0 0 4px}' +
      '.s{color:#58616c;margin:0 0 18px}table{border-collapse:collapse;width:100%}td{border:1px solid #d5dde5;padding:8px}td:first-child{width:34%;background:#f2f6f9}' +
      '.f{margin-top:18px;color:#58616c;font-size:10px}</style></head><body><h1>Eduplan payment record</h1><p class="s">Tuition fee payment received by Eduplan</p><table>' +
      rows.map(function (x) { return '<tr><td>' + applyEsc_(x[0]) + '</td><td>' + applyEsc_(x[1]) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="f">Saved automatically by Eduplan on ' + applyEsc_(when(new Date())) + ' (Malaysia time) when this payment was marked Paid. ' +
      'The bank slip or the payment provider&#39;s receipt is kept in the same folder.</p></body></html>';
    var pdf = HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF).setName(ref + ' - Payment record.pdf');
    dir.createFile(pdf);
    tab.getRange(row, PAY_COL.receipt).setValue(dir.getUrl());
  } catch (err) {
    console.error('payReceipt_ ' + row + ': ' + err);
  } finally { lock.releaseLock(); }
}
