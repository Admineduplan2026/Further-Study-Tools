/* EDUPLAN website settings.
   EDUPLAN_API_URL: the Google Apps Script web app URL (ends in /exec) that serves the school data sheet.
   Leave it empty to use only the data in faculty-data.js and scholarship-data.js.
   When set, the website loads the published sheet data on top of those files; if the API cannot be
   reached, the website keeps showing the local data. See docs/google-sheet-api-setup.md. */
window.EDUPLAN_API_URL="https://script.google.com/macros/s/AKfycbwVtqrntxp2HITILIGk0pnV7Wk8FghGodcwKJTJGPazu1LdnmAOUYGKErbCeSzqaryp/exec";
/* EDUPLAN_SITE_URL: the public website address, used for the share links of programmes. */
window.EDUPLAN_SITE_URL="https://admineduplan2026.github.io/Further-Study-Tools/";
