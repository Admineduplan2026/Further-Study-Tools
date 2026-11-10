# Tuition payments: setup

After the application (and the accommodation page), students go to **Pay tuition fees** (`#pay`):

1. **Choose a plan**: *Per semester (instalments)* or *Full payment*. The page shows the tuition, the campus
   scholarship from the student's verified results, and the total after scholarship.
2. **Choose a payment method** (`#pay/method`): *FPX online banking*, *Touch 'n Go eWallet* or *PayPal*, then
   **Continue to payment**.

**My portfolio** has a **My payment** card with the programme, the total, the chosen plan and the last payment
request, and a link back to `#pay`.

Payments go to **Eduplan** and are for **tuition**. The amounts are estimates from the website's fee data: the
per-semester amount assumes two semesters a year (total after scholarship ÷ number of semesters). Eduplan confirms
the real amount with the university before taking any money.

## What happens today (no payment gateway yet)

Eduplan has no payment gateway account yet, so the website cannot send students to FPX, Touch 'n Go or PayPal.
**Continue to payment** records the request and the student sees its reference (for example `PAY-20261020-7F3A`)
with the message that online payment is not open yet and Eduplan will contact them with the payment details.

Each request is a row in the private spreadsheet *Eduplan Payments* in `Eduplan Databases/4. Payments (private)`:
Time, Reference, Email, Programme, Plan, Method, Amount due now (RM), Total after scholarship (RM), Status, Paid on,
Transaction ID, Receipt. When Eduplan marks a payment *Paid*, a PDF payment record is saved automatically as proof
(see [google-drive-structure.md](google-drive-structure.md#proof-of-payment)).

The student must be signed in (the reference is tied to their portfolio). In the Claude artifact preview the button
is disabled with "Online payment works on the live Eduplan website".

## Setup (Apps Script)

1. Open the Eduplan Apps Script project.
2. Add a file **Payments.gs** and paste `apps-script/Payments.gs`; add **Drive.gs** the same way.
3. Replace **Code.gs** with `apps-script/Code.gs` (it adds the `pay_create` action).
4. Run **driveOrganize** once (see [google-drive-structure.md](google-drive-structure.md)).
5. **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The /exec URL stays the same.

## Connecting a payment gateway later

To send students to the real payment pages, Eduplan needs a merchant account:

- **FPX and Touch 'n Go eWallet**: a Malaysian payment gateway (for example Billplz, toyyibPay, iPay88,
  Razer Merchant Services, Stripe Malaysia with FPX/GrabPay/TNG). Most need an SSM-registered business.
- **PayPal**: a PayPal Business account.

Once the account exists, set the Script Property `PAY_GATEWAY` to the gateway's name and build its checkout in
`payCheckout_` (Payments.gs): it creates the gateway's bill with the reference and amount, and returns its
payment page URL. The website then sends the student straight to that page; bank and card details are entered only
on the gateway's own page, never on Eduplan. The gateway's API keys go in Script Properties only. The gateway's
payment confirmation then calls `payMarkPaid_` (Payments.gs), which marks the row *Paid* and saves the payment record.

## Registration fee through Billplz (built)

The website's **Pay registration fee** page (`#fee`, also in the menu) takes the EDUPLAN registration fee online
through Billplz. Tuition payments stay requests that a counsellor confirms.

How it works:

1. A signed-in student opens `#fee` and presses **Pay**. `pay_create` (plan `registration`) makes a Billplz bill for
   the amount in Script Property `PAY_REG_FEE` (never the browser's amount), records a row in the Payments tab
   (status *Sent to payment page*, the Billplz bill id in *Transaction ID*) and sends the student to Billplz.
2. The student pays by FPX on Billplz's page.
3. Billplz calls the Apps Script web app (callback) and sends the student back to the website. Both only ask
   Billplz again for the bill (`GET /api/v3/bills/<id>`); the row becomes *Paid* only when Billplz says the bill is paid
   for the full amount. A faked link or callback cannot mark anything paid.
4. Once paid: the PDF receipt is saved in `Receipts/<yyyy-MM>/<ref>/` (link in the *Receipt* column) and emailed to
   the student. The website shows "Payment received" with the reference.

Script Properties (Apps Script > Project Settings > Script Properties):

| Property | Value |
|---|---|
| `PAY_GATEWAY` | `billplz` |
| `BILLPLZ_API_KEY` | Billplz > Settings > Keys & Integration > API Secret Key |
| `BILLPLZ_COLLECTION_ID` | Billplz > Billing > the collection's ID (e.g. `abcd1234`) |
| `BILLPLZ_SANDBOX` | `yes` while testing with a billplz-sandbox.com account; delete it for real payments |
| `PAY_REG_FEE` | the fee in RM, e.g. `50` |
| `PAY_RETURN_URL` | optional: where Billplz sends the student back (default: the website's home page) |

After setting them, deploy a new version of the web app (Deploy > Manage deployments > Edit > New version).
Tests: `node tools/test-billplz.js`.
