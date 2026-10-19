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
