# AI document check: school documents vs. the school sheet

Every school folder in **Eduplan School Data** has a folder **documents (school uploads 学校资料)**. The school puts its
own documents there: brochures, fee schedules, scholarship pages, entry requirement tables. Claude reads them and
compares them with the school's Google Sheet, so the website shows what the school itself publishes.

```
Eduplan School Data/
└── UTAR/
    ├── UTAR                                  the school sheet (shared with the school)
    ├── documents (school uploads 学校资料)/   brochures, fees, scholarships (shared with the school)
    └── application/                          student applications (never shared)
```

## What the school does

1. Upload PDFs, Google Docs / Slides / Sheets, or photos (JPG, PNG) to the documents folder.
   Word and Excel files are not read: save them as PDF first. Up to 20 MB per school.
2. Fill in the sheet as usual. After a check, the sheet has a tab **Document check** listing the differences.
   The school can read it but not edit it.

## What Eduplan does

1. **Share the documents folder with the school** (right-click > Share > the school contact as Editor), in the same way
   as the sheet. Never share the school's main folder: `application/` holds students' personal data.
2. In the master sheet: **Eduplan > Check school documents with AI**. It sends every school whose sheet or documents
   changed since its last check. (To check every school again, run `verifyAll` in the Apps Script editor.)
3. The results arrive within about an hour (usually minutes) in:
   - the master sheet, tab **Document check**: every school;
   - each school's sheet, tab **Document check**: that school only.
4. Each row is one difference:

| Column | Meaning |
|---|---|
| Tab, Row, ID, Field | where it is in the sheet (`Not in the sheet` when the documents list something the sheet lacks) |
| In the sheet / In the documents | the two values, the document quoted word for word |
| Source | file name and page |
| Type | `mismatch`, `missing_in_sheet`, `check` (unclear, needs a person), `summary`, `ok`, `error` |
| Importance | `high` (fees, entry requirements, scholarship awards, programme names and levels), `medium`, `low` |
| What to change | one instruction naming the cell and the new value |

5. **Claude can be wrong.** Confirm each row against the document before editing the sheet or publishing it.

## Setup (once, together with the other Apps Script files)

1. In the master sheet: **Extensions > Apps Script > + > Script**, name it `Verify`, paste `apps-script/Verify.gs`.
   Paste the latest `apps-script/Code.gs` too (it adds the menu item). Save.
2. `ANTHROPIC_API_KEY` is the same Script Property the AI study assistant uses. Optional: `VERIFY_MODEL`
   (default `claude-opus-5-5`).
3. Reload the master sheet, then **Eduplan > Check school documents with AI**. Allow the new permissions the first
   time (Drive, Sheets, external requests, triggers).

## How it works

- `Verify.gs` sends one request per school through the **Message Batches API** (half the normal price, and no
  Apps Script time limit). A trigger checks every 5 minutes and removes itself when the results are written.
- The request holds the documents (as PDF or image blocks) and every filled row of the sheet's three tabs
  (contact person, Published and Check columns are left out). Claude answers in a fixed JSON format, one item per
  difference.
- Cost depends on the documents: each PDF page is about 1,500 to 3,000 input tokens, so a 30-page brochure costs
  about USD 0.10 to 0.20 with Claude Opus 5.5 at batch prices. Only changed schools are sent again.
