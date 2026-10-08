# Further-Study-Tools
Eduplan education tools is a tool with leads the students to a right study institution.  We lead the students through three different segmentation approaches  1. Interested-based  2.Scholarship-based 3.Hazed-based  Throughout this tool,we can track the students in the right segmentation in an accuracy and efficiency ways. 

## Website

The Eduplan website is a static site (no build step) made from the Eduplan artifact.

```
index.html              page shell: header, navigation, footer
assets/css/styles.css   all styles
assets/js/app.js        data (courses, universities, scholarships) and the three tools
assets/img/             logo and the three tool card illustrations
```

Pages (hash links): Home, About Us, Courses, Universities, Scholarships, Accommodation,
Scholarship match, Interest match, Guided questions, and Free Consultation.

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

- the data arrays at the top of `assets/js/app.js` (`COURSES`, `UNIS`, `SCHOLARSHIPS`)
- `[YOUR PHONE NUMBER]`, `[YOUR EMAIL]` and `[YOUR OFFICE ADDRESS]` in `index.html` and `assets/js/app.js`
- then remove the yellow "Sample data" banner at the top of `index.html`
