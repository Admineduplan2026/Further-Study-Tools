# Eduplan Lab (new layout): how it connects to Google Drive

Eduplan Lab (`lab/index.html`) is a second layout for the same website. It uses exactly the same Google Drive
set-up as the main site, so nothing extra is needed in Drive:

| What | Where it comes from / goes to |
|---|---|
| Universities, programmes, campus scholarships | each school's Google Sheet in **Eduplan School Data/&lt;SCHOOL&gt;/**, through the Apps Script `/exec` URL in `assets/js/config.js` |
| Foundation scholarships, FAQ (AI assistant) | the master sheet **Eduplan School Data** |
| Applications (form + uploaded documents) | **Eduplan School Data/&lt;SCHOOL&gt;/application/** as a PDF plus the files (apps-script/Apply.gs) |
| Student portfolios (sign-in, saved programmes, last search) | **Eduplan Applications (private)/Eduplan Student Portfolios** (apps-script/Account.gs) |

Edits to a school sheet show on both layouts within about a minute once the Apps Script is deployed
(docs/google-sheet-api-setup.md). A student who signs in on one layout sees the same portfolio on the other.

## Scholarship matching (Scholarship based)

The student picks an **exam type** and enters their result; the page shows the tier they reach in each campus scholarship.

| Exam type | Result entered | What counts as an A |
|---|---|---|
| SPM | number of As (0–12) | A+, A, A- |
| IGCSE | number of As (0–14) | A*, A |
| O-Level | number of As (0–12) | A*, A |
| UEC (Senior Middle 3) | number of As (0–12) | A1, A2 |
| STPM | number of As (0–5) | A, A- |
| A-Level | number of As (0–5) | A*, A |
| Foundation, Matriculation, Diploma | CGPA (0–4) | – |

- A tier is matched only when its `qualification` in the sheet is the same exam type (IGCSE and O-Level are kept apart).
  A CGPA tier filed under `Foundation` also counts for Matriculation or Diploma when its `minimum_result` names them,
  e.g. `Foundation/Matriculation/Diploma: CGPA 3.80 and above`.
- `minimum_result` is read as a number of As (`7As`) or a CGPA (`CGPA 3.70 and above`, `≥CGPA 3.90`, `CGPA 3.80-3.89`).
  Tiers that count only A+ (`8A+`, `8As (A+ and A only)`) are shown as conditions, never awarded automatically.

## My results and entry requirements

Students save their results once in **My portfolio > My results** (or in step 5 of the application form). The
scholarship search uses them automatically, and every programme card shows whether the student meets its entry
requirements. How to write entry requirements in the sheets: docs/entry-requirements.md.

## The Claude artifact previews

The previews cannot call the Apps Script, so they carry a snapshot of the sheet data. The daily sync routine
(05:47 Malaysia time) reads the sheets and refreshes both previews:

- Eduplan (official): https://claude.ai/artifact/Hwe6DFvyriBQ6sWEVLNQ6J. Since 12 October 2026 it uses this new layout,
  built with `--official` (title "Eduplan" and the main site's notice bar). The older layout stays in its version history.
- Eduplan Lab (trial copy for new ideas): https://claude.ai/artifact/9kZqcodLMZEX6Hzn41o33j

To rebuild both previews after a code change:

```
python3 tools/build-lab-artifact.py <scratch>/official-base.html --official
node tools/sync-artifact.js <sheet-values.json> <scratch>/official-base.html <scratch>/eduplan-official.html
python3 tools/build-lab-artifact.py <scratch>/lab-base.html
node tools/sync-artifact.js <sheet-values.json> <scratch>/lab-base.html <scratch>/eduplan-lab.html
```

In the previews, the application form cannot send files: students get the "Send it yourself" options instead.
