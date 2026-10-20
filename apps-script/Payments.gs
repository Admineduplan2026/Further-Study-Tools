/**
 * Eduplan tuition payments: the student chooses a plan (per semester or full payment) and a method (FPX, Touch 'n Go
 * eWallet or PayPal) after applying. Payments go to Eduplan's merchant account.
 *
 * The website POSTs {"action":"pay_create","token":"...","prog":"<programme id>","plan":"semester"|"full",
 *   "method":"fpx"|"tng"|"paypal","amount":<RM due now>,"total":<RM after scholarship>} to /exec (doPost in Code.gs).
 * The student must be signed in. Every request is written to the "Payments" tab of "Eduplan Student Portfolios"
 * (Time, Reference, Email, Programme, Plan, Method, Amount due now, Total, Status) so Eduplan can confirm the amount
 * with the university and follow up.
 *
 * No payment gateway is connected yet: the reply is {ok, ref, pending:true} and the website tells the student that a
 * counsellor will send the payment details. When Eduplan opens a merchant account (FPX / Touch 'n Go through a
 * Malaysian gateway, PayPal through PayPal Business), the gateway's checkout is added in payCheckout_ and the reply
 * carries {url} to send the student to the gateway's own page. Card and bank details are entered only there.
 */

var PAY_TAB = 'Payments';
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
    var tab = statsTab_(PAY_TAB, ['Time', 'Reference', 'Email', 'Programme', 'Plan', 'Method', 'Amount due now (RM)', 'Total after scholarship (RM)', 'Status']);
    var checkout = payCheckout_(ref, email, method, amount);
    tab.appendRow([new Date(), ref, accountCell_(email, 120), accountCell_(body.prog, 60), PAY_PLANS[plan], PAY_METHODS[method],
      Math.round(amount * 100) / 100, Math.round(total * 100) / 100, checkout.url ? 'Sent to payment page' : 'Requested: online payment not open yet']);
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
