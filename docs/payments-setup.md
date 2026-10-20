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

Each request is a row in the **Payments** tab of the private spreadsheet *Eduplan Student Portfolios*:
Time, Reference, Email, Programme, Plan, Method, Amount due now (RM), Total after scholarship (RM), Status.
The tab is created on the first request.

The student must be signed in (the reference is tied to their portfolio). In the Claude artifact preview the button
is disabled with "Online payment works on the live Eduplan website".

## Setup (Apps Script)

1. Open the Eduplan Apps Script project.
2. Add a file **Payments.gs** and paste `apps-script/Payments.gs`.
3. Replace **Code.gs** with `apps-script/Code.gs` (it adds the `pay_create` action).
4. **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The /exec URL stays the same.

## Connecting a payment gateway later

To send students to the real payment pages, Eduplan needs a merchant account:

- **FPX and Touch 'n Go eWallet**: a Malaysian payment gateway (for example Billplz, toyyibPay, iPay88,
  Razer Merchant Services, Stripe Malaysia with FPX/GrabPay/TNG). Most need an SSM-registered business.
- **PayPal**: a PayPal Business account.

Once the account exists, set the Script Property `PAY_GATEWAY` to the gateway's name and build its checkout in
`payCheckout_` (Payments.gs): it creates the gateway's bill with the reference and amount, and returns its
payment page URL. The website then sends the student straight to that page; bank and card details are entered only
on the gateway's own page, never on Eduplan. The gateway's API keys go in Script Properties only. A payment
callback (to mark rows as *Paid*) is added at the same time.
