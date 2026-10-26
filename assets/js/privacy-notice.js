/* First-visit notice: EDUPLAN uses no cookies or tracking, only this browser's storage to remember progress.
   Shown until the visitor taps OK (remembered in localStorage); the link opens #privacy. */
(function(){
var KEY="eduplan-notice";
try{if(localStorage.getItem(KEY))return;}catch(e){return;}
function show(){
 var d=document.createElement("div");d.className="pnotice";d.setAttribute("role","region");d.setAttribute("aria-label","Privacy notice");
 d.innerHTML='<p>EDUPLAN uses no cookies and no tracking. Your progress (results, saved programmes, language) is kept in this browser only, until you sign in. <a href="#privacy">Privacy, cookies and security</a></p>'+
  '<button type="button" class="btn sm">OK</button>';
 d.querySelector("button").addEventListener("click",function(){try{localStorage.setItem(KEY,"1");}catch(e){}d.remove();});
 d.querySelector("a").addEventListener("click",function(){try{localStorage.setItem(KEY,"1");}catch(e){}d.remove();});
 document.body.appendChild(d);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show);else show();
})();
