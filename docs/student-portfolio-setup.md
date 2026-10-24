# Student portfolio (sign-in and autosave): setup

Students open **My portfolio** (`#portfolio`) in the menu, type their email and get a 6-digit code by email.
No password. Once signed in, the website saves their progress automatically and they can continue on any device.

## Sign-in when the website opens

The website opens with a sign-in page (welcome text on the left, sign-in box on the right). The menu and the chat
bubble appear only after signing in, and the student then lands on the page they opened (a shared link such as
`#universities/xmum` still works after signing in). A device stays signed in for 30 days, so returning students go
straight in.

Students are never locked out: if Eduplan's daily email limit is reached, the server is busy or cannot be reached,
the sign-in box shows **Continue without signing in** (for that browser tab). The Claude artifact preview has no
sign-in and shows **Continue to the preview**.

Because every new visitor needs one email, watch the daily email limit (see Setup below). With a free Gmail
account the website can sign in about 80 new students or devices a day.

## What is saved

| Section | Without signing in | Signed in |
|---|---|---|
| My results (exam, subjects and grades, or CGPA; kept until the student changes them) | this browser | portfolio |

**My results** also lists, under **Scholarships for my results**, every campus scholarship tier the student's results reach
(for example 5 A grades reach every "5As" tier), the next tier and what is missing, and the ones that are almost reached.
The AI study assistant receives the saved results with each question, so a student can ask
"Which campus scholarships can I get with my results?". For the live website, paste the latest
`apps-script/ChatKnowledge.gs` into Apps Script and deploy a new version.
| Saved programmes (the **Save** button on every programme card) | this browser | portfolio |
| Interest quiz answers and result | this browser | portfolio |
| Free consultation request | this browser | portfolio |
| Application form answers and progress | this tab only (cleared when it closes) | portfolio |
| Uploaded documents | this page only | **never saved**; they are sent only with the application |

- Each section remembers when it was last changed. When two devices differ, the newer section wins.
- Changes are saved about 1.5 seconds after the student stops typing, and when they leave the page.
  A small "Saved to your portfolio" note appears at the bottom left.
- **Sign out** removes the student's details from that browser. **Delete my portfolio** deletes their row.
  Applications already sent stay in Eduplan Applications (private).
- In the Claude artifact preview, sign-in is not available; saved programmes and the quiz stay in the browser.

## Where portfolios are kept

A private spreadsheet **Eduplan Student Portfolios** in **Eduplan Applications (private)** (created by the first
sign-in), one row per student:

| Column | Meaning |
|---|---|
| Email, Created, Last sign-in, Last saved | the account |
| Name, Mobile | from the application form, or the consultation request |
| Saved programmes | programme IDs, e.g. `XMUM-FIS, XMUM-BCS` |
| Interest quiz | the faculties the quiz suggested |
| Application | e.g. `Part 3 of 6 · XMUM-FIS`, `Ready to send`, or `Sent EDU-20261011-AB12` |
| Data, Sessions | used by the website. **Do not edit.** |

Counsellors can use the readable columns to follow up students who saved programmes or started an application.
The sheet contains personal data (NRIC numbers in the application answers): keep it private to Eduplan staff.

Security: sign-in codes expire after 10 minutes and allow 5 tries; one email can ask for 5 codes in 6 hours;
a device stays signed in for 30 days (up to 5 devices). Codes and session keys are stored only as hashes.

## Setup (together with the Apps Script deployment)

In the master sheet: **Extensions > Apps Script**.

1. Replace `Code.gs` with the latest `apps-script/Code.gs` (it now also routes the `account_...` requests).
2. Click **+ > Script**, name it `Account`, and paste `apps-script/Account.gs`. Save. (Already done? Paste the latest `Account.gs` again: it now also keeps **My results**.)
3. Choose the function `accountTest` and click **Run**. Allow the permissions (Sheets, Drive, and **Send email as you**).
   The log shows `{"sheet":"https://...","saved":true,...,"deleted":true}` and the sheet **Eduplan Student Portfolios**
   appears in **Eduplan Applications (private)**. No email is sent by the test.
4. **Deploy > Manage deployments > Edit > Version: New version > Deploy.** The `/exec` URL stays the same.
5. On the website, open **My portfolio**, sign in with your own email and check that the code arrives
   (look in Spam the first time and mark it "Not spam").

Optional Script Property: `ACCOUNT_DAILY_EMAILS` (default 80). A free Gmail account can send about
100 emails a day from Apps Script, shared with the application notifications (`APPLY_NOTIFY_EMAIL`). If more students
sign in each day, deploy the script from a Google Workspace account (1,500 emails a day) and raise the limit.

## Before going live

- Add the portfolio to Eduplan's personal data (PDPA) notice: what is kept (above), why (study guidance and
  applications), who can see it (Eduplan counsellors), how long it is kept, and that students can delete it
  from **My portfolio**. Then link the notice from the sign-in box.
- Decide how long inactive portfolios are kept (for example, delete rows not signed in to for 2 years).

## Student overview: who registered, signed in and used the website

`apps-script/Stats.gs` adds an overview to the private spreadsheet **Eduplan Student Portfolios**:

| Tab | What it shows |
|---|---|
| **Overview** | Registered students, new registrations (today / 7 days), active in the last 15 minutes ("online now"), active today / 7 days, sign-ins and registrations today, visits by guests and signed-in students, the latest 25 active students, the latest 25 sign-in events and a chart of visits per day. Updated every minute. |
| **Students** | One row per student; the new column **L "Last active"** is updated whenever the student uses the website. |
| **Sign-in log** | One row per event: *Registered* (first sign-in), *Signed in*, *Signed out*, *Deleted portfolio*. |
| **Visits** | One row per day (Malaysia time): visits by guests and by signed-in students, and by route (interest, scholarship, guidance). Guests are counted anonymously: no cookie, no IP address, no identifier; one count per browser tab. |

Set up:
1. Paste `apps-script/Stats.gs` (new file) and the updated `Code.gs` and `Account.gs`.
2. Select **statsSetup** and **Run** (it can be run again; it rebuilds the Overview tab). The log shows the link.
3. Deploy a new version (Deploy → Manage deployments → Edit → New version).

"Online now" means active in the last 15 minutes: the website reports activity when a signed-in student opens a
page or their portfolio is saved, not every second. Guests appear only as counts, never by name.
