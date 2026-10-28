/* Runs apps-script/Exhibition.gs (with the Account.gs sign-in helpers) in Node, with Google's services replaced by
   small in-memory stand-ins: the spreadsheet tables, the script lock, the cache, script properties and email.
   Used by tools/test-exhibition.js and tools/expo-dev-server.js. Nothing is sent or saved outside this process.

   const expo = require("./expo-harness")({admins: ["admin@test.local"], today: "2026-11-01"});
   expo.call({action: "expo_public"});      // same JSON as the Apps Script /exec answer
   expo.codes["someone@test.local"]         // the last sign-in code "emailed" to that address */
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");

module.exports = function (opts) {
  opts = opts || {};
  const root = path.join(__dirname, ".."), mails = [], codes = {}, props = { EXPO_ADMIN_EMAILS: (opts.admins || []).join(",") };
  const cache = new Map();
  let lockHeld = false, writesOutsideLock = 0, mailDown = false;

  /* Tables as arrays of row objects with string values, like the sheet. Writes outside the script lock are counted:
     every write must happen inside expoLocked_, which is what keeps two bookings from both taking the last booth. */
  const tables = {};
  function table(name) {
    const rows = tables[name] = tables[name] || [];
    const str = o => { const r = {}; Object.keys(o).forEach(k => { if (k !== "_row") r[k] = o[k] == null ? "" : String(o[k]); }); return r; };
    return {
      all: () => rows.map(r => Object.assign({}, r)),
      insert: o => { if (!lockHeld) writesOutsideLock++; rows.push(str(o)); },
      update: (key, value, patch) => {
        if (!lockHeld) writesOutsideLock++;
        const r = rows.find(x => x[key] === value);
        if (!r) return false;
        Object.assign(r, str(patch));
        return true;
      }
    };
  }

  const fmtParts = d => {
    const p = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return p;
  };
  const ctx = {
    console: opts.quiet ? { log() {}, warn() {}, error() {} } : console,
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" }, Charset: { UTF_8: "utf8" },
      computeDigest: (alg, s) => Array.from(crypto.createHash("sha256").update(String(s), "utf8").digest()).map(b => (b > 127 ? b - 256 : b)),
      getUuid: () => crypto.randomUUID(),
      formatDate: (d, tz, f) => {
        const p = fmtParts(d);
        if (f === "yyyy-MM-dd") return p.year + "-" + p.month + "-" + p.day;
        return p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute + ":" + p.second;
      },
      base64Decode: s => Array.from(Buffer.from(s, "base64"))
    },
    CacheService: { getScriptCache: () => ({
      get: k => { const v = cache.get(k); return v && v.until > Date.now() ? v.value : null; },
      put: (k, v, s) => cache.set(k, { value: v, until: Date.now() + (s || 600) * 1000 }),
      remove: k => cache.delete(k)
    }) },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (lockHeld) throw new Error("lock taken twice in one request"); lockHeld = true; return true; },
      releaseLock: () => { lockHeld = false; }
    }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) },
    MailApp: {
      getRemainingDailyQuota: () => 100,
      sendEmail: m => {
        if (mailDown) throw new Error("mail service down (test)");
        mails.push(m);
        const code = /code: (\d{6})/.exec(m.subject);
        if (code) m.to.split(",").forEach(t => { codes[t] = code[1]; });
        if (opts.onMail) opts.onMail(m);
      }
    }
  };
  vm.createContext(ctx);
  ["apps-script/Account.gs", "apps-script/Exhibition.gs"].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f }));
  vm.runInContext("expoStore_ = function () { return __store; }; expoSaveCover_ = function (c) { return __cover(c); };", Object.assign(ctx, {
    __store: { table },
    __cover: c => (/^image\/(jpeg|png|webp)$/.test(c.type || "") ? "https://example.test/cover-" + crypto.randomUUID().slice(0, 8) + ".jpg" : { error: "bad_image" })
  }));
  if (opts.today) vm.runInContext("expoToday_ = function () { return " + JSON.stringify(opts.today) + "; };", ctx);

  return {
    /* One API request, answered as JSON text and parsed back, exactly as the website receives it. */
    call: body => JSON.parse(JSON.stringify(ctx.expoAction_(JSON.parse(JSON.stringify(body))))),
    setToday: d => vm.runInContext("expoToday_ = function () { return " + JSON.stringify(d) + "; };", ctx),
    /* Signs an email in through the real code flow and returns {token, me}. */
    signIn: function (email) {
      ["wait", "sent"].forEach(s => cache.delete("expo-otp-" + hashHex("" + email) + ":" + s));
      const sent = this.call({ action: "expo_code", email });
      if (sent.error) throw new Error("expo_code " + email + ": " + sent.error);
      const r = this.call({ action: "expo_verify", email, code: codes[email] });
      ["wait", "sent"].forEach(s => cache.delete("expo-otp-" + hashHex("" + email) + ":" + s));   // so the browser can ask for a code right away
      return r;
    },
    tables, mails, codes, props,
    writesOutsideLock: () => writesOutsideLock,
    failMail: on => { mailDown = !!on; }
  };
  function hashHex(s) { return ctx.accountHash_(s); }
};
