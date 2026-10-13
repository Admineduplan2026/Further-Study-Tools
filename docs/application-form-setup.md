# Application form and the student journey: setup

## The journey on the website

Every route ends with the same three pages once the student chooses a programme ("Choose this programme" on a programme card):

| Route | Pages |
|---|---|
| Faculty | 1 Faculty · 2 Courses · 3 University & programme · 4 Ask more · 5 Apply · 6 Accommodation |
| University | 1 Universities · 2 University · 3 Programme · 4 Ask more · 5 Apply · 6 Accommodation |
| Scholarship | 1 Scholarship · 2 Scholarship type · 3 Requirements · 4 University · 5 Programme · 6 Ask more · 7 Apply · 8 Accommodation |

- **Ask more** (`#next/<programme_id>`): open the AI study assistant with the programme already mentioned, book a free
  consultation (the consultation page then offers "Continue to the application form"), or go straight to the form.
- **Apply** (`#apply`): six short parts (programme, about you, contact, family, education, documents and declaration).
  It covers every item on the XMUM Foundation application form. Students upload photos or PDFs of their NRIC/passport,
  results slip, passport photo, English certificate, scholarship form and fee receipt (5 MB each, 20 MB in total;
  photos are made smaller in the browser before sending). NRIC/passport and an exam results slip are required: the
  student says whether the slip is the **official** results or the school's **trial** exam (saved as
  `results-official-1.pdf` or `results-trial-1.jpg`).
  The subjects and grades are filled in from **My results** in the student's portfolio; a student with nothing saved
  enters them once in the form, and they are saved to My results.
- **Accommodation** (`#stay`): the student says whether they need help (type, room, budget, move-in month), then sends
  the application.

## Where applications go

When the student presses **Send my application to Eduplan**, the website posts the form and the files to the same
Apps Script `/exec` URL. `apps-script/Apply.gs` saves them in the chosen school's folder in **Eduplan School Data**:

```
Eduplan School Data/
  XMUM/
    XMUM                      (the school's Google Sheet)
    application/
      EDU-20261011-AB12 TAN WEI MING/
        EDU-20261011-AB12 TAN WEI MING - Application.pdf
        ic-1.jpg, results-2.pdf, ...
  UTAR/ ...
  Repository/                 (_Template and the master sheet shortcut)
```

- The **PDF** is the completed form laid out like a university application form (programme, personal and contact
  details, family, education, English, documents checklist, accommodation, declaration), with lines for the applicant's
  and parent's signatures and the photos of the documents on the following pages. PDF uploads are saved next to it.
- The school folder is found by the programme's `institution_id` (XMUM, UTAR, ...). Its `application` folder is
  created if it is missing. If a school has no folder yet, the application goes to
  **Eduplan Applications (private)/Unassigned** in the deploying account's Drive.
- A private spreadsheet **Eduplan Applications** (in **Eduplan Applications (private)**) gets one row per application,
  with a link to its folder and Status, Counsellor and Notes columns for the team.

**Who can see applications:** anyone who can open a school's folder can open its `application` folder. Share school
folders only with Eduplan staff. To let a school's staff fill in their data, share the school's **sheet**, not the folder.

**New school:** in Eduplan School Data, create a folder named the school's `institution_id` (e.g. `SEGI`), copy
`Repository/_Template` into it and rename the copy to the same ID. The `application` folder is created with the first application.

The student sees the reference number on screen.

If sending fails (or in the Claude artifact preview, which cannot send files), the page shows the summary with
**Share with documents** (phones: WhatsApp and other apps, files attached), **Copy summary** and
**Print or save as PDF**, so the student can still send everything by WhatsApp or email.

## Setup (once, together with the AI assistant setup)

In the master sheet: **Extensions > Apps Script**.

1. Replace `Code.gs` with the latest `apps-script/Code.gs` (it now receives both chat and application posts).
2. Replace `Chat.gs` with the latest `apps-script/Chat.gs`.
3. Click **+ > Script**, name it `Apply`, and paste `apps-script/Apply.gs`. Save.
4. Optional Script Properties:
   - `APPLY_NOTIFY_EMAIL`: an Eduplan address that gets a short email (reference, name, programme, folder link) for each new application.
   - `APPLY_DAILY_LIMIT`: applications accepted per day, default 100.
5. Choose the function `applyTest` and click **Run**. Allow the permissions (Drive, Sheets, PDF conversion, and Mail if you set
   `APPLY_NOTIFY_EMAIL`). The log shows `{"ok":true,"ref":"EDU-..."}`; the test PDF appears in
   **Eduplan Applications (private)/Unassigned** (the test has no school) and the sheet in **Eduplan Applications (private)**.
   Open the test PDF: its last page should show a blue-and-white striped picture captioned "NRIC or passport" (the test
   document photo). If the stripes are missing, check **Executions** for "PDF with photos failed".
   Delete the TEST row and folder.
6. **Deploy > Manage deployments > Edit > Version: New version > Deploy.** The `/exec` URL stays the same.

## Before going live

- Replace `[YOUR PHONE NUMBER]` and `[YOUR EMAIL]` on the website (they appear in the "Send it yourself" box).
- The declaration says Eduplan keeps the application and documents and shares them with the university.
  Have it checked against Eduplan's own personal data (PDPA) notice and link that notice on the website.
- Decide how long applications are kept and who may open the folder.
