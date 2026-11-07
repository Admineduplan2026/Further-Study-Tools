# Chinese for course details

The school sheets are written in English. When a reader switches the site to 中文, `assets/js/i18n.js` translates
every text on the page by exact match. The course details (programme names, overviews, programme structures,
career prospects, entry requirements, notes) use the dictionary in `assets/js/content-zh.js`.

When schools add or change programme text, new sentences show in English until they are added:

1. Build the artifact (`python3 tools/build-lab-artifact.py base.html --official` and `node tools/sync-artifact.js ...`).
2. `node tools/zh-collect.js <built.html> untranslated.json` lists the text that is still English in 中文 mode
   (opens every programme on the Ask more page and in the Lab detail panel).
3. Translate the list into `{"English": "中文"}` JSON. Keep exam names, grades, codes, RM amounts, URLs and
   Malaysian place names as they are; never add or drop facts.
4. `python3 tools/make-content-zh.py translations.json`, rebuild, and run step 2 again: the list should be empty
   (apart from text that stays English on purpose, such as "SPM" or "STPM").
