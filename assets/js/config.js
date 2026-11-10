/* EDUPLAN website settings.
   EDUPLAN_API_URL: the Google Apps Script web app URL (ends in /exec) that serves the school data sheet.
   Leave it empty to use only the data in faculty-data.js and scholarship-data.js.
   When set, the website loads the published sheet data on top of those files; if the API cannot be
   reached, the website keeps showing the local data. See docs/google-sheet-api-setup.md. */
window.EDUPLAN_API_URL="https://script.google.com/macros/s/AKfycbwVtqrntxp2HITILIGk0pnV7Wk8FghGodcwKJTJGPazu1LdnmAOUYGKErbCeSzqaryp/exec";
/* EDUPLAN_GOOGLE_CLIENT_ID: the OAuth client ID for "Continue with Google" (Google Cloud > APIs & Services > Credentials,
   a Web application client with this website as an authorised JavaScript origin). It is public by design. The same ID
   goes in the Apps Script Property GOOGLE_CLIENT_ID. Leave it empty to hide the Google button. */
window.EDUPLAN_GOOGLE_CLIENT_ID="506099753176-4sjstrjgmtvbjf35qd6jp3pcao53kd06.apps.googleusercontent.com";
/* EDUPLAN_SITE_URL: the public website address, used for the share links of programmes. */
window.EDUPLAN_SITE_URL="https://admineduplan2026.github.io/Further-Study-Tools/";
/* EDUPLAN_EXHIBITION_URL: the Eduplan 教育展 (Exhibition) website, opened by the "About Exhibition" button in About us and
   by its card in Other Activities. Change it here only, e.g. when the exhibition gets its own domain. */
window.EDUPLAN_EXHIBITION_URL=window.EDUPLAN_SITE_URL+"exhibition/";
/* EDUPLAN_ACTIVITIES: the cards of the home page's "Other Activities" section, in order. To add an activity, add one
   entry: icon, title and text in English (the Chinese is in lab/lab-zh.js), and the link. */
window.EDUPLAN_ACTIVITIES=[
 {id:"exhibition",icon:"🎪",title:"EDUPLAN Activity",text:"Education talks and fairs with limited seats. Free sign-up for students and parents.",url:window.EDUPLAN_EXHIBITION_URL}
];
/* EDUPLAN_NO_DEMO: leaves the demo schools (institution_id starting with DEMO) out of the school data, also when the
   Apps Script has not been redeployed yet. apps-script/Code.gs HIDE_DEMO_SCHOOLS does the same on the server. */
window.EDUPLAN_NO_DEMO=function(d){if(!d||typeof d!=="object")return d;function ok(x){return !/^DEMO/i.test(String(x&&x.institution_id||""));}
 var o={};Object.keys(d).forEach(function(k){o[k]=d[k];});["institutions","programmes","campus_scholarships"].forEach(function(k){if(Array.isArray(o[k]))o[k]=o[k].filter(ok);});return o;};
