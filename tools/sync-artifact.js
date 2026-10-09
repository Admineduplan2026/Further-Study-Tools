#!/usr/bin/env node
/*
 * Put a snapshot of the published Google Sheet data into the Eduplan artifact page.
 *
 *   node tools/sync-artifact.js <sheet-values.json> <artifact.html> <out.html> [--if-changed]
 *
 * sheet-values.json holds the rows of each tab exactly as read (Google Sheets get_values, from row 1):
 *   {"foundation": [[...], ...], "lists": [...],                      <- master sheet (Eduplan only)
 *    "schools": [{"name": "UTAR", "institutions": [...], "programmes": [...], "campus": [...]}, ...]}
 * with one "schools" entry per school sheet in the "Eduplan School Data" Drive folder
 * (names starting with "_" are skipped by the API, so leave them out here too).
 * The older single-sheet form {"institutions", "programmes", "campus", "foundation", "lists"} still works.
 * The rows go through the same transform as the Apps Script API (apps-script/Code.gs),
 * so the artifact shows exactly what the website would show. The snapshot is written as
 * window.EDUPLAN_SHEET_DATA, which assets/js/app.js applies before the first render.
 *
 * --if-changed: when the artifact already holds the same data (ignoring generated_at),
 * write nothing, print {"changed": false, ...} and exit with code 3.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const args = process.argv.slice(2), ifChanged = args.includes("--if-changed");
const [valuesFile, inFile, outFile] = args.filter(a => a !== "--if-changed");
if (!outFile) { console.error("usage: node tools/sync-artifact.js <sheet-values.json> <artifact.html> <out.html>"); process.exit(2); }

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8"), ctx);
const values = JSON.parse(fs.readFileSync(valuesFile, "utf8"));
const need = (obj, keys, where) => keys.forEach(k => {
  if (!Array.isArray(obj[k])) { console.error("missing tab in sheet values: " + where + k); process.exit(1); }
});
need(values, ["foundation", "lists"], "");
if (Array.isArray(values.schools)) values.schools.forEach(s => need(s, ["institutions", "programmes", "campus"], (s.name || "?") + " > "));
else need(values, ["institutions", "programmes", "campus"], "");
const data = ctx.buildEduplanData(values, null, new Date().toISOString());

const MARK = "/* EDUPLAN_SHEET_DATA */";
const line = "window.EDUPLAN_SHEET_DATA=" + JSON.stringify(data).replace(/<\//g, "<\\/") + "; " + MARK;
let html = fs.readFileSync(inFile, "utf8");
const at = html.indexOf(MARK);
const summary = {
  institutions: data.institutions.length, programmes: data.programmes.length,
  campus_scholarships: data.campus_scholarships.length, foundation_scholarships: data.foundation_scholarships.length,
  sources: data.sources, skipped: data.skipped
};
if (ifChanged && at > -1) {
  const start = html.lastIndexOf("\n", at) + 1;
  const old = html.slice(start, at).replace(/^window\.EDUPLAN_SHEET_DATA=/, "").replace(/;\s*$/, "").replace(/<\\\//g, "</");
  const strip = d => { const c = Object.assign({}, d); delete c.generated_at; return JSON.stringify(c); };
  let same = false;
  try { same = strip(JSON.parse(old)) === strip(data); } catch (e) { same = false; }
  if (same) { console.log(JSON.stringify(Object.assign({ changed: false }, summary))); process.exit(3); }
}
if (at > -1) {
  const start = html.lastIndexOf("\n", at) + 1;
  html = html.slice(0, start) + line + html.slice(at + MARK.length);
} else {
  const open = html.indexOf("<script>\n");
  if (open < 0) { console.error("no <script> block found in " + inFile); process.exit(1); }
  html = html.slice(0, open + 9) + line + "\n" + html.slice(open + 9);
}
fs.writeFileSync(outFile, html);
console.log(JSON.stringify(Object.assign({ changed: true }, summary)));
