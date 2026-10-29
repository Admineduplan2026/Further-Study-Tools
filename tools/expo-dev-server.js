/* Local try-out of the Eduplan Exhibition (exhibition/) with the real server rules (apps-script/Exhibition.gs) and
   in-memory data, so nothing touches Google Drive or sends real email. Sign-in codes are printed here instead.

   node tools/expo-dev-server.js [port]      then open http://localhost:8080/exhibition/

   Test accounts (ready to use, sign in with the code printed in this window):
     organiser@test.local  approved organiser          school@test.local   school (exhibitor)
     admin@test.local      Eduplan admin               school2@test.local  second school */
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), port = Number(process.argv[2]) || 8080;
let seeding = true;
const expo = require("./expo-harness")({
  admins: ["admin@test.local"], quiet: true,
  onMail: m => {
    if (seeding) return;
    const code = /code: (\d{6})/.exec(m.subject);
    if (code) console.log("\n  Sign-in code for " + m.to + ": " + code[1]);
    else console.log("\n  Email to " + m.to + ": " + m.subject);
  }
});

/* Ready-made accounts: an approved organiser and two schools. */
function seed(email, role, extra) {
  const s = expo.signIn(email);
  return expo.call(Object.assign({ action: "expo_register", token: s.token, role, name: "Test " + role, position: "Manager", phone: "012-345 6789", consent: true }, extra)).me;
}
const org = seed("organiser@test.local", "organiser", { org_name: "Test Education Fair Sdn Bhd" });
seed("school@test.local", "exhibitor", { org_name: "Test University", school_type: "university", website: "https://university.test" });
seed("school2@test.local", "exhibitor", { org_name: "Test College", school_type: "college", website: "https://college.test" });
const adminToken = expo.signIn("admin@test.local").token, orgToken = expo.signIn("organiser@test.local").token;
expo.call({ action: "expo_admin_user", token: adminToken, user_id: org.id, decision: "approved" });
/* One published sample event a month from now, so the exhibition list and the EDUPLAN home page have something to show. */
const soon = d => new Date(Date.now() + d * 864e5 + 8 * 36e5).toISOString().slice(0, 10);
const sample = expo.call({ action: "expo_event_save", token: orgToken, submit: true, event: { title: "Penang Education Fair (sample)", description: "A sample event for trying the site.",
  date: soon(30), start_time: "10:00", end_time: "17:00", venue: "Sample Hall", address: "1 Sample Road", city: "George Town", state: "Pulau Pinang",
  booth_capacity: 20, registration_deadline: soon(20), booth_fee: 300 } });
expo.call({ action: "expo_admin_event", token: adminToken, event_id: sample.id, decision: "approved" });
expo.mails.length = 0;
seeding = false;

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/api" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 4e6) req.destroy(); });
    req.on("end", () => {
      let out;
      try { out = expo.call(JSON.parse(body)); } catch (e) { console.error(e); out = { error: "server" }; }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out));
    });
    return;
  }
  /* The site's settings, pointed at this local server instead of Apps Script. */
  if (url === "/assets/js/config.js") {
    res.writeHead(200, { "Content-Type": TYPES[".js"] });
    res.end(fs.readFileSync(path.join(root, url), "utf8") + '\nwindow.EDUPLAN_API_URL="/api";\n');
    return;
  }
  let file = path.join(root, url.endsWith("/") ? url + "index.html" : url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log("Eduplan Exhibition (local, test data only): http://localhost:" + port + "/exhibition/");
  console.log("Test accounts: organiser@test.local, school@test.local, school2@test.local, admin@test.local");
  console.log("Sign-in codes are printed here. Data is lost when you stop this server (Ctrl+C).");
});
