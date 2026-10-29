# Eduplan 教育展 (Exhibition) setup

The exhibition website lets organisers (主办方) open education fairs and schools (参展学校) book booths. Eduplan staff
(admins) approve every new organiser account and every new event before schools can see it.

- Website: `exhibition/` (`index.html`, `expo.js`, `expo.css`), live at
  `https://admineduplan2026.github.io/Further-Study-Tools/exhibition/`.
- Server: `apps-script/Exhibition.gs`, behind the same Apps Script `/exec` URL as the rest of EDUPLAN (`expo_*` actions).
- Entry points on the main site: the **About Exhibition →** button in About us (the opening cover and the About page)
  and the **Other Activities** card on the home page. Both read `EDUPLAN_EXHIBITION_URL` in `assets/js/config.js`;
  the Other Activities cards come from `EDUPLAN_ACTIVITIES` in the same file.

## Turn it on

Always edit, run and deploy the Apps Script project signed in as **admin.eduplan@gmail.com**, the account whose Drive
holds Eduplan's data, and keep **Execute as: Me (admin.eduplan@gmail.com)** on the deployment. Add the Script Property
`DRIVE_OWNER` = `admin.eduplan@gmail.com`: if the project ever runs as another account, it stops with "wrong account"
instead of quietly starting new, empty sheets in that account's Drive.

1. Run `python3 tools/bundle-apps-script.py`, paste `dist/Eduplan-all.gs` into the Apps Script project, then
   **Deploy > Manage deployments > Edit > Version: New version > Deploy** (the `/exec` URL stays the same).
2. In **Project Settings > Script Properties** add `EXPO_ADMIN_EMAILS` with the Eduplan staff emails that review
   organisers and events, comma-separated. Optional: `EXPO_SITE_URL` if the exhibition moves to its own domain.
3. In the editor select **expoSetup** and **Run** once. On Google's consent screen choose **Select all** (Drive, Sheets
   and email are all needed; a missing tick shows as "You do not have permission to call …" on the website). It creates
   **Eduplan Exhibitions** in `Eduplan Databases/5. Exhibitions (private)` (tabs Users, Events, Registrations,
   Sessions) and logs the admin emails. Cover images go to `Event covers (public links)` in the same folder.

## Who can do what

| Role | Can | Cannot |
|---|---|---|
| Organiser 主办方 | Sign up, save drafts, submit events (after approval), edit or cancel own events, accept or reject bookings with a note | See other organisers' events; publish before Eduplan approves the account and the event |
| Exhibitor 参展学校 | Sign up, browse published upcoming events with open registration, book booths, withdraw before the deadline | Book twice for one event; book a full, closed or cancelled event; see other schools' bookings |
| Admin (EXPO_ADMIN_EMAILS) | Approve or reject organisers and submitted events | Sign up as organiser or school |

One account has one role, chosen at sign-up. Sign-in is a 6-digit code by email (no password), as for students.

## Rules checked on the server

- An event cannot be on a past date; its registration deadline must be before the event and not in the past; it needs at
  least 1 booth. Times: end after start.
- Pending and accepted bookings hold their booths: a booking that would pass the event's capacity is refused (`full` /
  `not_enough_booths`). Accepting checks the accepted total again. Every write runs inside the script lock, so two
  schools booking the last booth at the same moment cannot both get it. An organiser cannot lower the capacity below
  the booths already booked.
- One booking per school per event. A school that withdrew can book again (same record).
- Every action checks the role and that the event or booking belongs to the caller.
- School contact details are only sent to the organiser of the event the school booked.

## New-exhibition emails to students and schools

When an admin approves an event, every student with an EDUPLAN account (column A of "Eduplan Student Portfolios")
and every exhibition school gets one email with the date, time, venue and a link to the event page
(`exhibition/#/e/<id>`). It is sent in the background about a minute later. Each email has a stop link
(`#/unsub/...`, signed with Script Property `EXPO_MAIL_SECRET`, made automatically); stopped addresses are kept as
hashes in the Unsubscribed tab. Progress is kept in the Notify tab.

The Gmail quota (about 100 emails a day on a free account) limits this: 25 a day are kept for sign-in codes, and the
rest continues the next day with the daily trigger. Run **expoSetup** once (signed in as admin.eduplan, "Select all")
to allow the triggers. Upcoming published events also appear first in **Recommended for you** on the EDUPLAN home page.

## Emails (best effort)

Sign-in codes, and notices for: a new organiser or event to review (to admins), a new booking (to the organiser),
accepted or rejected (to the school), approved or rejected (to the organiser) and a cancelled event (to every booked
school). A failed or skipped email never stops the action. Emails share the Gmail account's daily quota (about 100 a day
on a free account) with student sign-in and application notices.

## Privacy

Only the listed details are collected (no IC numbers). Sign-up shows a short notice that must be ticked. Organisation
names appear on public event pages; contact details do not.

## Test and try locally

```
node tools/test-exhibition.js          # rule tests (dates, full events, no overselling, duplicates, ownership, visibility)
node tools/expo-dev-server.js          # then open http://localhost:8080/exhibition/
```

The local server uses the real rules with in-memory data and prints sign-in codes in the terminal instead of emailing
them. Ready-made accounts: `organiser@test.local` (approved organiser), `school@test.local` and `school2@test.local`
(schools), `admin@test.local` (admin). A new code can be asked for once a minute per email.

## Not done yet

- Online payment of booth fees (the fee is shown only).
- A separate domain for the exhibition website.
