/* EDUPLAN website settings.
   EDUPLAN_API_URL: the Google Apps Script web app URL (ends in /exec) that serves the school data sheet.
   Leave it empty to use only the data in faculty-data.js and scholarship-data.js.
   When set, the website loads the published sheet data on top of those files; if the API cannot be
   reached, the website keeps showing the local data. See docs/google-sheet-api-setup.md. */
window.EDUPLAN_API_URL="https://script.google.com/macros/s/AKfycbwVtqrntxp2HITILIGk0pnV7Wk8FghGodcwKJTJGPazu1LdnmAOUYGKErbCeSzqaryp/exec";
/* EDUPLAN_SITE_URL: the public website address, used for the share links of programmes. */
window.EDUPLAN_SITE_URL="https://admineduplan2026.github.io/Further-Study-Tools/";
/* EDUPLAN_NO_DEMO: leaves the demo schools (institution_id starting with DEMO) out of the school data, also when the
   Apps Script has not been redeployed yet. apps-script/Code.gs HIDE_DEMO_SCHOOLS does the same on the server. */
window.EDUPLAN_NO_DEMO=function(d){if(!d||typeof d!=="object")return d;function ok(x){return !/^DEMO/i.test(String(x&&x.institution_id||""));}
 var o={};Object.keys(d).forEach(function(k){o[k]=d[k];});["institutions","programmes","campus_scholarships"].forEach(function(k){if(Array.isArray(o[k]))o[k]=o[k].filter(ok);});return o;};
