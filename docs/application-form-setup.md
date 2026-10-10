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
  photos are made smaller in the browser before sending). NRIC/passport is required, and the results slip when the
  student has actual results.
- **Accommodation** (`#stay`): the student says whether they need help (type, room, budget, move-in month), then sends
  the application.

## Where applications go

When the student presses **Send my application to Eduplan**, the website posts the form and the files to the same
Apps Script `/exec` URL. `apps-script/Apply.gs` stores them in the Google Drive of the account that deploys the web app:

- a private folder **Eduplan Applications (private)**, with one sub-folder per application named
  `EDU-YYYYMMDD-XXXX STUDENT NAME`, holding `application.txt` and the documents;
- a private spreadsheet **Eduplan Applications** in that folder, one row per application with Status, Counsellor and
  Notes columns for the team.

Both are created on the first application and are not shared with anyone. Share them only with the staff who
handle applications. The student sees the reference number on screen.

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
5. Choose the function `applyTest` and click **Run**. Allow the permissions (Drive, Sheets, and Mail if you set
   `APPLY_NOTIFY_EMAIL`). The log shows `{"ok":true,"ref":"EDU-..."}` and the folder and sheet appear in Drive.
   Delete the TEST row and folder.
6. **Deploy > Manage deployments > Edit > Version: New version > Deploy.** The `/exec` URL stays the same.

## Before going live

- Replace `[YOUR PHONE NUMBER]` and `[YOUR EMAIL]` on the website (they appear in the "Send it yourself" box).
- The declaration says Eduplan keeps the application and documents and shares them with the university.
  Have it checked against Eduplan's own personal data (PDPA) notice and link that notice on the website.
- Decide how long applications are kept and who may open the folder.
