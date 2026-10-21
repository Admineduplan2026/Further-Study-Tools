# Eduplan's Google Drive: four separate databases

Everything Eduplan keeps is in one private folder in My Drive, **Eduplan Databases**, split into four parts:

```
Eduplan Databases/
  1. School databases/                     (was "Eduplan School Data")
       master sheet "Eduplan School Data" (Foundation scholarships, FAQ, Lists)
       XMUM/, UTAR/, APU/ ...              one folder per school with its sheet
  2. Student applications (private)/      (was "Eduplan Applications (private)")
       Eduplan Applications                one row per application
       XMUM/EDU-20261020-AB12 NAME/        the application PDF, the school's own form filled in from it,
                                           and the documents the student uploaded
  3. Students and visitors (private)/
       Eduplan Student Portfolios          Students (sign-ins, last active), Sign-in log, Visits, Overview
  4. Payments (private)/
       Eduplan Payments                    one row per payment request
       Receipts/2026-10/PAY-20261020-7F3A/ the payment record PDF, saved automatically when a payment is Paid
```

| Part | What is in it | Who may see it |
|---|---|---|
| 1. School databases | Universities, programmes, fees, scholarships (what the website shows) | Eduplan; each school's staff get their own school sheet only |
| 2. Student applications | Application forms, the school's official form filled in automatically, uploaded documents | Eduplan staff only |
| 3. Students and visitors | Who registered, signed in, signed out, was last active; visits per day by guests and by signed-in students | Eduplan staff only |
| 4. Payments | Every payment request (plan, method, amount) and the proof of every payment | Eduplan staff only |

Guests are counted, never identified: the Visits tab has only numbers per day (no name, email, IP address or cookie).

## Set up (once)

1. In the Apps Script project, add the file **Drive.gs** (paste `apps-script/Drive.gs`) and replace **Payments.gs**,
   **Account.gs**, **Apply.gs** and **Stats.gs** with the versions in `apps-script/`.
   Simpler: delete every .gs file in the project (keep appsscript.json), add one file **Eduplan** and paste
   `dist/Eduplan-all.gs`, which holds all of `apps-script/*.gs` (rebuild it with `python3 tools/bundle-apps-script.py`).
2. Select **driveOrganize** and click **Run**. Google asks for permission once (Drive, Sheets, triggers): allow it.
   The log lists the four folders with their links.
3. **Deploy → Manage deployments → Edit → Version: New version → Deploy** (the /exec URL stays the same).

driveOrganize only moves and renames: every folder, sheet and file keeps its link and its sharing, so the website,
the daily sync and the school staff's access keep working. It moves the old "Payments" tab out of "Eduplan Student
Portfolios" into "Eduplan Payments". It can be run again at any time.

## Proof of payment

In **Eduplan Payments**, the Status column has a list: *Requested: online payment not open yet*, *Sent to payment
page*, *Paid*, *Cancelled*. When a payment is **Paid**, choose *Paid* (or, once a payment gateway is connected, the
gateway sets it). Eduplan then automatically:

- fills in **Paid on**,
- saves a PDF **payment record** (reference, student email, programme, plan, method, amount, dates, transaction ID) in
  `4. Payments (private)/Receipts/<month>/<reference>/`,
- puts the folder's link in the **Receipt** column.

Put the bank slip, or the payment provider's receipt, in the same folder so the proof stays together. Type the bank's
or provider's transaction ID in **Transaction ID** before choosing *Paid* to have it on the record.
