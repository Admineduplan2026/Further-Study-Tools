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
 * Online payment through Billplz (Script Property PAY_GATEWAY = billplz): pay_create makes a Billplz bill and the reply
 * carries {url}, the bill's own page, where the student pays by FPX (and DuitNow / cards when Billplz turned them on).
 * Card and bank details are entered only there. When the bill is paid, Billplz calls this web app (callback, a form
 * POST with the bill id, handled in Code.gs doPost) and sends the student back to the website (?billplz[id]=…), which
 * asks pay_check. Both only ask Billplz again for the bill (GET /bills/<id>) and mark the row Paid when Billplz says it
 * is paid for the right amount, so a faked callback or link cannot mark anything paid. The student is emailed the PDF
 * receipt; the same PDF is kept in Receipts/. Without a gateway the reply is {ok, ref, pending:true} as before.
 *
 * Registration fee (plan "registration"): each university's own application fee, paid on the website's #fee/<programme>
 * page. The amount comes from the school sheets (column registration_fee_rm: on the Institutions tab for the whole
 * university, or on a Programmes row when that programme's fee is different), read on the server from the same data
 * the website uses, never from the browser. A programme whose university has no fee listed cannot be paid online.
 *
 * Script Properties for Billplz: PAY_GATEWAY = billplz; BILLPLZ_API_KEY (API Secret Key, Billplz > Settings > Keys &
 * Integration); BILLPLZ_COLLECTION_ID (Billing > the collection's ID); BILLPLZ_SANDBOX = yes while testing with a
 * billplz-sandbox.com account (delete it for real payments); optional PAY_RETURN_URL (default: the website).
 */

var PAY_TAB = 'Payments';
var PAY_HEADERS = ['Time', 'Reference', 'Email', 'Programme', 'Plan', 'Method', 'Amount due now (RM)', 'Total after scholarship (RM)',
  'Status', 'Paid on', 'Transaction ID', 'Receipt'];
var PAY_COL = { ref: 2, status: 9, paidOn: 10, txn: 11, receipt: 12 };
var PAY_STATUS = ['Requested: online payment not open yet', 'Sent to payment page', 'Paid', 'Cancelled'];
var PAY_PLANS = { semester: 'Per semester (instalments)', full: 'Full payment', registration: 'Registration fee' };
var PAY_METHODS = { fpx: 'FPX online banking', tng: "Touch 'n Go eWallet", paypal: 'PayPal', online: 'Online (Billplz)' };

/* What the payment page needs to know: whether online payment is open, and (with prog) that programme's registration fee. */
function payInfo_(prog) {
  var p = PropertiesService.getScriptProperties(), out = { online: p.getProperty('PAY_GATEWAY') === 'billplz' && !!p.getProperty('BILLPLZ_API_KEY'),
    sandbox: /^y/i.test(p.getProperty('BILLPLZ_SANDBOX') || '') };
  if (prog) { var r = payRegFee_(prog); out.reg_fee = r.fee; out.programme = r.programme; out.institution = r.institution; }
  return out;
}

/* The registration fee of a programme from the published sheet data: the programme's own registration_fee_rm, else its
   university's. {fee (0 when none), programme, institution}. */
function payRegFee_(progId) {
  var id = String(progId || ''), data;
  if (!id) return { fee: 0 };
  try { data = JSON.parse(apiJson_()); } catch (err) { console.error('payRegFee_: ' + err); return { fee: 0 }; }
  var p = (data.programmes || []).filter(function (x) { return String(x.programme_id) === id; })[0];
  if (!p) return { fee: 0 };
  var i = (data.institutions || []).filter(function (x) { return x.institution_id === p.institution_id; })[0] || {};
  var fee = Number(p.registration_fee_rm) > 0 ? Number(p.registration_fee_rm) : Number(i.registration_fee_rm) > 0 ? Number(i.registration_fee_rm) : 0;
  return { fee: Math.round(fee * 100) / 100, programme: p.programme_name, institution: i.short_name || i.name || p.institution_id };
}

function payCreate_(body) {
  var plan = String(body.plan || ''), method = String(body.method || ''), amount = Number(body.amount), total = Number(body.total);
  var reg = null;
  if (plan === 'registration') {   // the university's fee from the sheet data, not the browser's amount
    reg = payRegFee_(body.prog);
    amount = total = reg.fee;
    method = 'online';
    if (!amount) return { error: 'not_set' };
  }
  if (!PAY_PLANS[plan] || !PAY_METHODS[method] || !(amount > 0 && amount < 1e6) || !(total >= amount && total < 1e7)) return { error: 'bad_request' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { error: 'busy' };
  try {
    var sh = accountSheet_(), s = accountSession_(sh, body.token);
    if (!s) return { error: 'signed_out' };
    var email = String(sh.getRange(s.row, ACCOUNT_COL.email).getValue());
    var ref = 'PAY-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    var tab = payTab_();
    var checkout = payCheckout_(ref, email, method, amount, PAY_PLANS[plan], reg && (reg.institution + ' ' + reg.programme));
    if (checkout.error) return checkout;
    tab.appendRow([new Date(), ref, accountCell_(email, 120), accountCell_(body.prog, 60), PAY_PLANS[plan], PAY_METHODS[method],
      Math.round(amount * 100) / 100, Math.round(total * 100) / 100, checkout.url ? PAY_STATUS[1] : PAY_STATUS[0], '', checkout.id || '', '']);
    statsActive_(sh, s.row);
    return checkout.url ? { ok: true, ref: ref, url: checkout.url } : { ok: true, ref: ref, pending: true };
  } finally { lock.releaseLock(); }
}

/* The gateway's checkout page for this payment, or {} while no gateway is connected (Script Property PAY_GATEWAY). */
function payCheckout_(ref, email, method, amount, what, detail) {
  var gateway = PropertiesService.getScriptProperties().getProperty('PAY_GATEWAY');
  if (!gateway) return {};
  // Only the registration fee (amount set on the server) goes online for now; tuition stays a request that a counsellor confirms.
  if (gateway === 'billplz') return what === PAY_PLANS.registration ? billplzCreate_(ref, email, amount, what + (detail ? ': ' + detail : '')) : {};
  console.error('PAY_GATEWAY "' + gateway + '" is set but no checkout is built for it yet.');
  return {};
}

/* ---------- Billplz (API v3) ---------- */
function billplzBase_() {
  return /^y/i.test(PropertiesService.getScriptProperties().getProperty('BILLPLZ_SANDBOX') || '') ? 'https://www.billplz-sandbox.com/api/v3/' : 'https://www.billplz.com/api/v3/';
}
function billplzFetch_(path, opts) {
  var key = PropertiesService.getScriptProperties().getProperty('BILLPLZ_API_KEY');
  if (!key) return { error: 'not_set' };
  opts = opts || {};
  opts.muteHttpExceptions = true;
  opts.headers = { Authorization: 'Basic ' + Utilities.base64Encode(key + ':') };
  try {
    var res = UrlFetchApp.fetch(billplzBase_() + path, opts), code = res.getResponseCode(), data = JSON.parse(res.getContentText() || '{}');
    if (code < 200 || code >= 300) { console.error('Billplz ' + path + ' ' + code + ': ' + res.getContentText().slice(0, 300)); return { error: 'gateway', status: code }; }
    return data;
  } catch (err) {
    console.error('Billplz ' + path + ' failed: ' + err);
    return { error: 'gateway' };
  }
}
/* A Billplz bill for this payment: {url, id}. Billplz takes the amount in sen. */
function billplzCreate_(ref, email, amount, what) {
  var p = PropertiesService.getScriptProperties(), coll = p.getProperty('BILLPLZ_COLLECTION_ID');
  if (!coll) return { error: 'not_set' };
  var site = p.getProperty('PAY_RETURN_URL') || expoSite_().replace(/exhibition\/?$/, '');
  var bill = billplzFetch_('bills', { method: 'post', payload: {
    collection_id: coll, email: email, name: email.split('@')[0].slice(0, 255), amount: String(Math.round(amount * 100)),
    description: ('EDUPLAN ' + (what || 'payment') + ' (' + ref + ')').slice(0, 200),
    callback_url: ScriptApp.getService().getUrl(), redirect_url: site,
    reference_1_label: 'Reference', reference_1: ref
  } });
  if (bill.error || !bill.url || !bill.id) return { error: bill.error || 'gateway' };
  return { url: bill.url, id: bill.id };
}
/* Asks Billplz whether a bill is paid; marks its row Paid (once) and emails the receipt. {paid, ref, amount} or {error}. */
function payBillplzCheck_(billId) {
  var id = String(billId || '');
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(id)) return { error: 'bad_request' };
  var bill = billplzFetch_('bills/' + encodeURIComponent(id), { method: 'get' });
  if (bill.error) return bill;
  var tab = payTab_(), last = tab.getLastRow();
  if (last < 2) return { error: 'not_found' };
  var vals = tab.getRange(2, 1, last - 1, PAY_HEADERS.length).getValues(), row = 0, v = null;
  for (var i = 0; i < vals.length; i++) if (String(vals[i][PAY_COL.txn - 1]) === id) { row = i + 2; v = vals[i]; break; }
  if (!row) return { error: 'not_found' };
  var ref = String(v[PAY_COL.ref - 1]), want = Math.round(Number(v[6]) * 100);
  var paid = bill.paid === true && bill.state === 'paid' && Number(bill.paid_amount != null ? bill.paid_amount : bill.amount) >= want;
  if (!paid) return { paid: false, ref: ref, amount: Number(v[6]), prog: String(v[3] || '') };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  var already;
  try {
    already = String(tab.getRange(row, PAY_COL.status).getValue()) === 'Paid';
    if (!already) { tab.getRange(row, PAY_COL.status).setValue('Paid'); tab.getRange(row, PAY_COL.paidOn).setValue(new Date()); }
  } finally { lock.releaseLock(); }
  if (!already) { payReceipt_(tab, row); payReceiptEmail_(tab, row); }
  return { paid: true, ref: ref, amount: Number(v[6]), prog: String(v[3] || '') };
}
/* Emails the student their PDF receipt (once, after the PDF is saved). */
function payReceiptEmail_(tab, row) {
  try {
    var v = tab.getRange(row, 1, 1, PAY_HEADERS.length).getValues()[0], ref = String(v[1]), email = accountEmail_(v[2]), url = String(v[PAY_COL.receipt - 1] || '');
    if (!email) return;
    var m = /folders\/([\w-]+)/.exec(url), files = m ? DriveApp.getFolderById(m[1]).getFilesByType(MimeType.PDF) : null, pdf = files && files.hasNext() ? files.next().getBlob() : null;
    MailApp.sendEmail({ to: email, name: 'EDUPLAN', subject: 'EDUPLAN 付款收据 · Payment receipt ' + ref,
      body: '我们已收到你的付款，收据附在这封电邮里。\nWe have received your payment. Your receipt is attached.\n\n' +
        '编号 Reference: ' + ref + '\n项目 For: ' + v[4] + '\n金额 Amount: RM ' + Number(v[6]).toFixed(2) + '\n\nEDUPLAN',
      attachments: pdf ? [pdf] : [] });
  } catch (err) { console.warn('receipt email ' + row + ': ' + err); }
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
      '.f{margin-top:18px;color:#58616c;font-size:10px}</style></head><body><h1>EDUPLAN payment receipt</h1><p class="s">' + applyEsc_(v[4] || 'Payment') + ' received by EDUPLAN</p><table>' +
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

/* Run this from the Apps Script editor (function list: payCheckSetup) to check the Billplz settings. It never prints
   the API key. With every setting right it also asks Billplz for the collection, which proves the key and ID work. */
function payCheckSetup() {
  var p = PropertiesService.getScriptProperties(), info = payInfo_(), out = [];
  out.push('PAY_GATEWAY: ' + (p.getProperty('PAY_GATEWAY') === 'billplz' ? 'OK (billplz)' : 'WRONG: must be billplz, now "' + (p.getProperty('PAY_GATEWAY') || '') + '"'));
  out.push('BILLPLZ_API_KEY: ' + (p.getProperty('BILLPLZ_API_KEY') ? 'set' : 'MISSING'));
  out.push('BILLPLZ_COLLECTION_ID: ' + (p.getProperty('BILLPLZ_COLLECTION_ID') ? 'set' : 'MISSING'));
  var data = {}; try { data = JSON.parse(apiJson_()); } catch (err) {}
  var withFee = (data.institutions || []).filter(function (i) { return Number(i.registration_fee_rm) > 0; });
  out.push('Universities with a registration fee (registration_fee_rm): ' + withFee.length + ' of ' + (data.institutions || []).length +
    (withFee.length ? ' (' + withFee.map(function (i) { return (i.short_name || i.institution_id) + ' RM ' + i.registration_fee_rm; }).join(', ') + ')' : ''));
  out.push('Mode: ' + (info.sandbox ? 'SANDBOX (test, billplz-sandbox.com)' : 'PRODUCTION (real money, billplz.com)'));
  var linked = false;
  if (info.online && p.getProperty('BILLPLZ_COLLECTION_ID')) {
    var c = billplzFetch_('collections/' + encodeURIComponent(p.getProperty('BILLPLZ_COLLECTION_ID')), { method: 'get' });
    out.push('Billplz check: ' + (c.error ? 'FAILED (' + (c.status === 401 ? 'API key wrong, or sandbox/production mixed up' : c.status === 404 ? 'Collection ID not found' : c.error + ' ' + (c.status || '')) + ')' : 'OK, collection "' + (c.title || '') + '"'));
  }
  linked = /Billplz check: OK/.test(out.join('\n'));
  out.push(linked && withFee.length ? 'The website registration fee payment is OPEN for those universities (after a new deployment version).' : 'Online registration fee payment stays closed until the items above are fixed.');
  console.log(out.join('\n'));
  return out.join('\n');
}

/* Run once from the Apps Script editor (function list: regFeeColumnSetup). Adds the column registration_fee_rm to every
   school sheet: on the Institutions tab after hostel_fee_max (the university's registration fee) and on the Programmes
   tab after tuition_fee_rm (only for a programme whose fee is different; leave it empty otherwise). Sheets that already
   have the column are left as they are, so running it again is safe. Only the school sheets are opened. */
function regFeeColumnSetup() {
  var cols = [
    { tab: SHEETS.institutions, after: 'hostel_fee_max', label: 'Registration fee (RM)\n报名费（RM）',
      hint: 'Number only, e.g. 200. Paid online on the EDUPLAN website.' },
    { tab: SHEETS.programmes, after: 'tuition_fee_rm', label: 'Registration fee (RM, if different)\n报名费（如与院校不同）',
      hint: 'Number only. Empty = the university\'s fee.' }
  ], done = [], skipped = [];
  schoolFiles_().forEach(function (f) {
    var ss;
    try { ss = SpreadsheetApp.openById(f.getId()); } catch (err) { skipped.push(f.getName() + ' (cannot open)'); return; }
    cols.forEach(function (c) {
      var sh = ss.getSheetByName(c.tab);
      if (!sh) { skipped.push(f.getName() + ' › ' + c.tab + ' (no tab)'); return; }
      var keys = sh.getRange(KEY_ROW, 1, 1, sh.getLastColumn()).getValues()[0].map(function (k) { return String(k).trim(); });
      if (keys.indexOf('registration_fee_rm') > -1) return;
      var at = keys.indexOf(c.after);
      if (at < 0) { skipped.push(f.getName() + ' › ' + c.tab + ' (no ' + c.after + ' column)'); return; }
      sh.insertColumnAfter(at + 1);   // the new column takes the format of column `after`
      var col = at + 2;
      sh.getRange(1, col).setValue(c.label);
      sh.getRange(KEY_ROW, col).setValue('registration_fee_rm');
      sh.getRange(KEY_ROW + 1, col).setValue(c.hint);
      done.push(f.getName() + ' › ' + c.tab);
    });
  });
  var msg = 'Added registration_fee_rm to ' + done.length + ' tabs.' + (skipped.length ? '\nSkipped: ' + skipped.join('; ') : '');
  console.log(msg);
  return msg;
}
