/* Eduplan Lab hosts the main Eduplan app (assets/js/app.js): the lab draws its own pages (search home, results,
   saved programmes, About us) and the main app draws everything else in the same page and layout: faculties,
   universities, scholarships, Ask more, the application form with uploads, accommodation and My portfolio.
   noGate: the lab opens without the sign-in page; students sign in from My portfolio. */
window.EDUPLAN_HOST={noGate:true,rendered:null,assetBase:window.EDUPLAN_ASSET_BASE!=null?window.EDUPLAN_ASSET_BASE:"../",   /* the main app's image paths start at the website root */

 owns:function(h){h=String(h||"").replace(/^#/,"");return h===""||h==="home"||h==="results"||h==="saved"||h==="about";}};
