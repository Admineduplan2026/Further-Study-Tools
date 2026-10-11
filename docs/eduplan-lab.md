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

## The Claude artifact previews

The previews cannot call the Apps Script, so they carry a snapshot of the sheet data. The daily sync routine
(05:47 Malaysia time) reads the sheets and refreshes both previews:

- Eduplan: https://claude.ai/artifact/Hwe6DFvyriBQ6sWEVLNQ6J
- Eduplan Lab: https://claude.ai/artifact/9kZqcodLMZEX6Hzn41o33j

To rebuild the Lab preview after a code change:

```
python3 tools/build-lab-artifact.py <scratch>/lab-base.html
node tools/sync-artifact.js <sheet-values.json> <scratch>/lab-base.html <scratch>/eduplan-lab.html
```

In the previews, the application form cannot send files: students get the "Send it yourself" options instead.
