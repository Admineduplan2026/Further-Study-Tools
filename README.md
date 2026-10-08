# Further-Study-Tools
Eduplan education tools is a tool with leads the students to a right study institution.  We lead the students through three different segmentation approaches  1. Interested-based  2.Scholarship-based 3.Hazed-based  Throughout this tool,we can track the students in the right segmentation in an accuracy and efficiency ways. 

## Website

The Eduplan website is a static site (no build step) made from the Eduplan artifact.

```
index.html              page shell: header, navigation, footer
assets/css/styles.css   all styles
assets/js/config.js            EDUPLAN_API_URL: the school data API (empty = local data only)
assets/js/scholarship-data.js  all scholarship data (Foundation and Campus scholarships)
assets/js/faculty-data.js      all faculty data (fields 00-10, their courses, universities offering each)
assets/js/app.js        page code, plus the sample data used by Guided questions, Universities and Accommodation
assets/img/             logo and the three tool card illustrations
```

Pages (hash links): Home, About Us, Faculty, Universities, Scholarships, Accommodation,
Guided questions, and Free Consultation.

Interest-based flow: Page 1 is the "Interest based" button (home and About Us) -> Page 2
(`#faculty`) picks a faculty 00-10 -> Page 3 (`#faculty/05`) lists its courses -> Page 4
(`#faculty/05/biotechnology`) lists the universities offering that course.
To add a course or the universities that offer it, edit `assets/js/faculty-data.js` only.

Scholarship-based flow: Page 1 is the "Scholarship based" button (home and About Us) ->
Page 2 (`#scholarships`) picks Foundation Scholarship or Campus Scholarship -> Page 3
(`#scholarships-foundation` or `#scholarships-campus`). Page 3 opens only after a choice on Page 2.
To add a foundation, university or waiver tier, edit `assets/js/scholarship-data.js` only.

### School data from Google Sheets (API)

Partner institutions fill in `data/eduplan-school-data.xlsx` (imported as a Google Sheet). The Apps Script in
`apps-script/Code.gs` serves the rows marked Published = Yes as JSON, and the website loads them when
`EDUPLAN_API_URL` is set in `assets/js/config.js`. Setup steps: `docs/google-sheet-api-setup.md`.

### Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Publish with GitHub Pages

In the repository go to **Settings → Pages**, set **Source** to "Deploy from a branch",
pick the branch and the `/ (root)` folder, and save.

### Before launch

The universities, scholarships, fees and contact details are placeholders. Replace:

- the data arrays at the top of `assets/js/app.js` (`COURSES`, `UNIS`)
- the empty `universities` lists in `assets/js/faculty-data.js`
- `[YOUR PHONE NUMBER]`, `[YOUR EMAIL]` and `[YOUR OFFICE ADDRESS]` in `index.html` and `assets/js/app.js`
- then remove the yellow "Sample data" banner at the top of `index.html`
