# Results check: AI reads the student's results slip

On the live website, **My results** can no longer be typed in. A signed-in student uploads a photo or PDF of their
results slip and chooses **Official results** or **Trial results**. Claude reads the exam, subjects and grades
(`apps-script/Results.gs`), and the website fills them in, marked "Verified by AI from your official / trial results
slip". The student cannot edit them; a new slip replaces them (for example when the official results come out).

## What the server checks

- The file is a results slip, for the exam the student chose.
- "Official results" must be an official slip (a school trial report is refused; the student can choose Trial).
- Every grade exists for that exam (SPM A+ … G; UEC A1 … F9; STPM A … F; IGCSE / O-Level / A-Level A* …). Grades
  Claude cannot read with certainty are left out.
- The grades are signed with `RESULTS_SECRET` (made automatically) together with the student's email. When the
  portfolio is saved, `Account.gs` keeps only signed results, so grades typed or edited in the browser are dropped.

The slip itself is not stored. Applications carry the line "Verified by AI from the official/trial results slip (date)".

## Set up

1. Paste `apps-script/Results.gs` (new file) and the updated `Code.gs` and `Account.gs` into the Apps Script project.
2. `ANTHROPIC_API_KEY` is the same key as the AI study assistant. Optional Script Properties:
   - `RESULTS_MODEL` (default `claude-opus-5-5`)
   - `RESULTS_DAILY_LIMIT` (default 200 slips a day for the whole website)
3. Deploy a new version (Deploy → Manage deployments → Edit → New version).

Results saved before this change are not signed, so students are asked to upload their slip once.

AI can misread a slip. If a student says a grade is wrong, a counsellor checks the slip with them; the student
uploads a clearer photo to replace the results.

In the preview (the published artifact) the website cannot reach the server, so results can still be typed there
to try the website; the page says so.

## Test

**1. The AI reading only (Apps Script editor, no website needed)**
Put a results slip photo or PDF in Google Drive. In `Results.gs`, set `FILE_ID`, `EXAM` and `KIND` at the top of
`resultsTest`, choose `resultsTest` in the toolbar and press **Run**. The execution log shows what Claude read
(subjects, grades, candidate name) or why the slip was refused (`not_slip`, `wrong_exam`, `not_official`, `unreadable`).

**2. The whole flow (live website)**
The published artifacts cannot reach Apps Script, so test on the website served from this repository: GitHub Pages
(`https://<owner>.github.io/<repo>/lab/`) or locally with `python3 -m http.server 8000` and
`http://localhost:8000/lab/`. Sign in with your email code, open My portfolio → My results, choose the exam and
Official / Trial, upload the slip and press **Read my results**.

# Name check: AI reads the student's IC

To book a free consultation, a student's name must be verified with their IC (MyKad or MyKid; international students:
passport photo page). Everyone else is a guest: they can browse but the consultation page asks them to verify first.

- The student takes a photo of the front of the IC in My profile or on the consultation page.
- `apps-script/Identity.gs` (`id_verify`) has Claude read the name and the IC / passport number, checks the number
  (12 digits starting with a real date of birth, or a passport number) and signs the name with the student's email.
- Only the **name and the last 4 digits** are kept, in the portfolio's profile. The photo and the full number are not
  stored. `Account.gs` drops a name check without a valid signature.
- The verified name is locked on the consultation form and fills in the application form; the consultation summary
  says "verified with IC ending 1234".

Set up: paste `apps-script/Identity.gs` (new file) and the updated `Code.gs` and `Account.gs`, then deploy a new
version. It uses the same `ANTHROPIC_API_KEY`, model and daily limit as the results check. Test in the editor with
`idTest` (put the IC photo's Drive file ID at the top, Run).

Students under 18: a MyKad or MyKid photo is personal data of a minor. Ask a PDPA adviser whether a parent's consent is
needed before the name check.
