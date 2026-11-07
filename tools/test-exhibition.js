/* Tests for the Eduplan Exhibition server rules (apps-script/Exhibition.gs), run in Node with tools/expo-harness.js.
   Usage: node tools/test-exhibition.js        (exit code 1 when a test fails) */
const assert = require("assert");
const harness = require("./expo-harness");

const TODAY = "2026-11-01";
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + "\n    " + (e && e.message || e)); }
}

/* A fresh server with an approved organiser, a second organiser, three schools and an admin. */
function setup() {
  const h = harness({ admins: ["admin@test.local"], today: TODAY, quiet: true });
  const reg = (email, role, extra) => {
    const s = h.signIn(email);
    const r = h.call(Object.assign({ action: "expo_register", token: s.token, role, org_name: email.split("@")[0] + " Org", name: "Test Person",
      position: "Manager", phone: "012-345 6789", consent: true }, role === "exhibitor" ? { school_type: "university", website: "https://school.test" } : {}, extra || {}));
    assert.ok(r.me, "register " + email + ": " + JSON.stringify(r));
    return { token: s.token, id: r.me.id };
  };
  const admin = h.signIn("admin@test.local").token;
  const org = reg("org@test.local", "organiser"), org2 = reg("org2@test.local", "organiser");
  [org, org2].forEach(o => assert.ok(h.call({ action: "expo_admin_user", token: admin, user_id: o.id, decision: "approved" }).ok));
  const schools = ["a", "b", "c", "d", "e"].map(x => reg("school-" + x + "@test.local", "exhibitor"));
  return { h, admin, org, org2, schools };
}
const EVENT = { title: "KL Education Fair", description: "Meet universities.", date: "2026-12-10", start_time: "10:00", end_time: "17:00",
  venue: "Mid Valley Exhibition Centre", address: "Lingkaran Syed Putra", city: "Kuala Lumpur", state: "W.P. Kuala Lumpur",
  booth_capacity: 3, registration_deadline: "2026-12-01", booth_fee: 500 };
/* Creates an event, submits it and has the admin approve it; returns its id. */
function publish(t, who, over) {
  const r = t.h.call({ action: "expo_event_save", token: who.token, submit: true, event: Object.assign({}, EVENT, over || {}) });
  assert.ok(r.ok, "save: " + JSON.stringify(r));
  assert.strictEqual(r.status, "pending");
  assert.ok(t.h.call({ action: "expo_admin_event", token: t.admin, event_id: r.id, decision: "approved" }).ok);
  return r.id;
}
const apply = (t, school, id, booths) => t.h.call({ action: "expo_apply", token: school.token, event_id: id, booths: booths || 1, topics: "Engineering, Medicine" });

console.log("Event dates");
test("an event cannot be created for a past date", () => {
  const t = setup();
  const r = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: Object.assign({}, EVENT, { date: "2026-10-31", registration_deadline: "2026-10-20" }) });
  assert.strictEqual(r.error, "past_date");
});
test("the registration deadline must be before the event date", () => {
  const t = setup();
  ["2026-12-10", "2026-12-11"].forEach(d => {
    const r = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: Object.assign({}, EVENT, { registration_deadline: d }) });
    assert.strictEqual(r.error, "deadline_after_event", d);
  });
});
test("booth capacity must be more than 0", () => {
  const t = setup();
  [0, -2, 1.5, "x"].forEach(c => {
    const r = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: Object.assign({}, EVENT, { booth_capacity: c }) });
    assert.strictEqual(r.error, "bad_capacity", String(c));
  });
});
test("an organiser waiting for approval can save drafts but not submit", () => {
  const t = setup();
  const s = t.h.signIn("new@test.local");
  t.h.call({ action: "expo_register", token: s.token, role: "organiser", org_name: "New", name: "N", position: "P", phone: "0123456789", consent: true });
  assert.strictEqual(t.h.call({ action: "expo_event_save", token: s.token, submit: true, event: EVENT }).error, "organiser_not_approved");
  assert.strictEqual(t.h.call({ action: "expo_event_save", token: s.token, submit: false, event: EVENT }).status, "draft");
});

console.log("Booths");
test("a full event takes no more registrations", () => {
  const t = setup(), id = publish(t, t.org);
  [0, 1, 2].forEach(i => assert.ok(apply(t, t.schools[i], id).ok));
  assert.strictEqual(apply(t, t.schools[3], id).error, "full");
  const ev = t.h.call({ action: "expo_events", token: t.schools[4].token }).events.find(e => e.id === id);
  assert.ok(ev && ev.full && ev.remaining === 0, "listed as full");
});
test("bookings at the same moment cannot oversell, and every write runs inside the lock", () => {
  const t = setup(), id = publish(t, t.org, { booth_capacity: 4 });
  /* Five schools ask for 2, 1, 2, 1, 1 booths of 4 in one burst. Apps Script runs requests in parallel; the script lock
     makes each booking re-count the booths before it writes, so the total can never pass the capacity. */
  const res = [2, 1, 2, 1, 1].map((n, i) => apply(t, t.schools[i], id, n));
  const booked = t.h.tables.registrations.filter(r => r.event_id === id && r.status === "pending").reduce((s, r) => s + Number(r.booths_requested), 0);
  assert.ok(booked <= 4, "booked " + booked);
  assert.deepStrictEqual(res.map(r => r.ok ? "ok" : r.error), ["ok", "ok", "not_enough_booths", "ok", "full"]);
  assert.strictEqual(t.h.writesOutsideLock(), 0, "writes outside the script lock");
});
test("accepting never takes accepted booths past the capacity", () => {
  const t = setup(), id = publish(t, t.org, { booth_capacity: 2 });
  const a = apply(t, t.schools[0], id, 2);
  assert.ok(t.h.call({ action: "expo_reg_decide", token: t.org.token, reg_id: a.id, decision: "accepted" }).ok);
  /* The organiser cannot shrink the event below the booths already booked. */
  const r = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: Object.assign({}, EVENT, { id, booth_capacity: 1 }) });
  assert.strictEqual(r.error, "capacity_below_booked");
});
test("a school cannot register twice for the same event", () => {
  const t = setup(), id = publish(t, t.org);
  const first = apply(t, t.schools[0], id);
  assert.ok(first.ok);
  assert.strictEqual(apply(t, t.schools[0], id).error, "duplicate");
  /* After withdrawing, the school may apply again, on the same record. */
  assert.ok(t.h.call({ action: "expo_withdraw", token: t.schools[0].token, reg_id: first.id }).ok);
  const again = apply(t, t.schools[0], id);
  assert.ok(again.ok && again.id === first.id);
  assert.strictEqual(t.h.tables.registrations.filter(r => r.event_id === id).length, 1);
});
test("registration closes after the deadline and withdrawal too", () => {
  const t = setup(), id = publish(t, t.org);
  const a = apply(t, t.schools[0], id);
  t.h.setToday("2026-12-02");
  assert.strictEqual(apply(t, t.schools[1], id).error, "closed");
  assert.strictEqual(t.h.call({ action: "expo_withdraw", token: t.schools[0].token, reg_id: a.id }).error, "closed");
});

console.log("Ownership and roles");
test("an organiser cannot see or change another organiser's event", () => {
  const t = setup(), id = publish(t, t.org);
  const a = apply(t, t.schools[0], id);
  const other = t.org2.token;
  assert.strictEqual(t.h.call({ action: "expo_event_regs", token: other, event_id: id }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_event_save", token: other, submit: true, event: Object.assign({}, EVENT, { id, title: "Taken over" }) }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_event_cancel", token: other, event_id: id }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_reg_decide", token: other, reg_id: a.id, decision: "accepted" }).error, "forbidden");
  assert.ok(!t.h.call({ action: "expo_my_events", token: other }).events.some(e => e.id === id), "listed for the other organiser");
  assert.strictEqual(t.h.tables.events.find(e => e.id === id).title, EVENT.title);
});
test("roles are checked on every action", () => {
  const t = setup(), id = publish(t, t.org);
  assert.strictEqual(t.h.call({ action: "expo_apply", token: t.org.token, event_id: id, topics: "x" }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_event_save", token: t.schools[0].token, submit: true, event: EVENT }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_admin_list", token: t.org.token }).error, "forbidden");
  assert.strictEqual(t.h.call({ action: "expo_my_events" }).error, "signed_out");
  assert.strictEqual(t.h.call({ action: "expo_register", token: t.org.token, role: "exhibitor", org_name: "x", name: "x", position: "x", phone: "0123456789",
    school_type: "college", website: "https://x.test", consent: true }).error, "already_registered");
});
test("a school sees only its own registrations; contact details go only to the event's organiser", () => {
  const t = setup(), id = publish(t, t.org);
  apply(t, t.schools[0], id); apply(t, t.schools[1], id);
  const mine = t.h.call({ action: "expo_my_regs", token: t.schools[0].token }).registrations;
  assert.strictEqual(mine.length, 1);
  const other = t.h.call({ action: "expo_my_regs", token: t.schools[1].token }).registrations[0];
  assert.strictEqual(t.h.call({ action: "expo_withdraw", token: t.schools[0].token, reg_id: other.id }).error, "not_found");
  assert.ok(!JSON.stringify(t.h.call({ action: "expo_public" })).includes("school-a@test.local"));
  assert.ok(!JSON.stringify(t.h.call({ action: "expo_events", token: t.schools[2].token })).includes("@test.local"));
  assert.ok(JSON.stringify(t.h.call({ action: "expo_event_regs", token: t.org.token, event_id: id })).includes("school-a@test.local"));
});

console.log("What schools can see");
test("schools see only published, upcoming events whose registration is still open", () => {
  const t = setup();
  const open = publish(t, t.org);
  const pending = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: Object.assign({}, EVENT, { title: "Pending" }) }).id;
  const draft = t.h.call({ action: "expo_event_save", token: t.org.token, submit: false, event: Object.assign({}, EVENT, { title: "Draft" }) }).id;
  const cancelled = publish(t, t.org, { title: "Cancelled" });
  t.h.call({ action: "expo_event_cancel", token: t.org.token, event_id: cancelled });
  const closingSoon = publish(t, t.org, { title: "Closes 5 Nov", registration_deadline: "2026-11-05", date: "2026-11-20" });
  let ids = t.h.call({ action: "expo_events", token: t.schools[0].token }).events.map(e => e.id);
  assert.deepStrictEqual(ids.sort(), [open, closingSoon].sort());
  assert.strictEqual(t.h.call({ action: "expo_apply", token: t.schools[0].token, event_id: pending, topics: "x" }).error, "not_found");
  assert.strictEqual(t.h.call({ action: "expo_apply", token: t.schools[0].token, event_id: draft, topics: "x" }).error, "not_found");
  assert.strictEqual(t.h.call({ action: "expo_apply", token: t.schools[0].token, event_id: cancelled, topics: "x" }).error, "cancelled");
  t.h.setToday("2026-11-06");   // the second event's deadline has passed: it leaves the schools' list
  ids = t.h.call({ action: "expo_events", token: t.schools[0].token }).events.map(e => e.id);
  assert.deepStrictEqual(ids, [open]);
  /* The public home page still lists it (upcoming), marked closed for registration. */
  const pub = t.h.call({ action: "expo_public" }).events.find(e => e.id === closingSoon);
  assert.ok(pub && pub.status === "closed" && !pub.open);
  t.h.setToday("2026-12-11");
  assert.strictEqual(t.h.call({ action: "expo_public" }).events.length, 0, "past events leave the public list");
});
test("filters by state, city and date", () => {
  const t = setup();
  const kl = publish(t, t.org), pg = publish(t, t.org, { title: "Penang Fair", city: "George Town", state: "Pulau Pinang", date: "2026-12-20" });
  const q = f => t.h.call(Object.assign({ action: "expo_events", token: t.schools[0].token }, f)).events.map(e => e.id);
  assert.deepStrictEqual(q({ state: "Pulau Pinang" }), [pg]);
  assert.deepStrictEqual(q({ city: "kuala" }), [kl]);
  assert.deepStrictEqual(q({ from: "2026-12-15" }), [pg]);
  assert.deepStrictEqual(q({ to: "2026-12-15" }), [kl]);
});

console.log("Notifications and cancellation");
test("emails go out at each step, and a cancelled event shows as cancelled to schools", () => {
  const t = setup(), id = publish(t, t.org);
  const a = apply(t, t.schools[0], id);
  assert.ok(t.h.mails.some(m => m.to === "org@test.local" && /新的摊位报名/.test(m.subject)), "organiser told about the booking");
  t.h.call({ action: "expo_reg_decide", token: t.org.token, reg_id: a.id, decision: "accepted", note: "Booth A1" });
  assert.ok(t.h.mails.some(m => m.to === "school-a@test.local" && /已接受/.test(m.subject)), "school told it was accepted");
  t.h.call({ action: "expo_event_cancel", token: t.org.token, event_id: id });
  assert.ok(t.h.mails.some(m => /school-a@test.local/.test(m.to) && /活动已取消/.test(m.subject)), "school told about the cancellation");
  const mine = t.h.call({ action: "expo_my_regs", token: t.schools[0].token }).registrations[0];
  assert.strictEqual(mine.status, "cancelled");
  assert.strictEqual(mine.organiser_note, "Booth A1");
});
test("a failed email does not stop the booking", () => {
  const t = setup(), id = publish(t, t.org);
  t.h.failMail(true);   // the mail service throws from now on
  const res = apply(t, t.schools[0], id);
  t.h.failMail(false);
  assert.ok(res.ok, JSON.stringify(res));
  assert.strictEqual(t.h.tables.registrations.filter(r => r.event_id === id).length, 1);
});
console.log("New-event emails");
test("a published event is emailed once to every student account and school, not to organisers or admins", () => {
  const t = setup();
  t.h.students.push("Stu1@test.local", "stu2@test.local", "stu1@test.local", "school-a@test.local", "not an email");
  const id = publish(t, t.org);
  t.h.mails.length = 0;
  assert.strictEqual(t.h.notify().sent, 7);
  const to = t.h.mails.map(m => m.to).sort();
  assert.deepStrictEqual(to, ["school-a@test.local", "school-b@test.local", "school-c@test.local", "school-d@test.local", "school-e@test.local", "stu1@test.local", "stu2@test.local"]);
  assert.ok(t.h.mails.every(m => m.subject.indexOf(EVENT.title) >= 0 && m.body.indexOf("2026-12-10") >= 0 && m.body.indexOf("#/unsub/") >= 0));
  t.h.mails.length = 0;
  assert.strictEqual(t.h.notify().sent, 0, "a second run sends nothing more");
  assert.ok(t.h.tables.notify.find(j => j.event_id === id).done_at);
});
test("drafts, rejected events and organisers waiting for approval send no emails", () => {
  const t = setup();
  t.h.students.push("stu@test.local");
  const r = t.h.call({ action: "expo_event_save", token: t.org.token, submit: true, event: EVENT });
  t.h.call({ action: "expo_admin_event", token: t.admin, event_id: r.id, decision: "rejected", note: "x" });
  t.h.call({ action: "expo_event_save", token: t.org.token, event: EVENT });
  t.h.mails.length = 0;
  t.h.notify();
  assert.strictEqual(t.h.mails.length, 0);
});
test("a low daily quota stops the sending and the next run carries on without repeats", () => {
  const t = setup();
  ["s1", "s2", "s3", "s4"].forEach(x => t.h.students.push(x + "@test.local"));
  publish(t, t.org);
  t.h.mails.length = 0;
  t.h.quota.left = 28;   // 25 are kept for sign-in codes
  assert.strictEqual(t.h.notify().sent, 3);
  t.h.students.push("late@test.local");   // a student who signs up in between is added at the end of the sheet
  t.h.quota.left = 1000;
  t.h.notify();
  const to = t.h.mails.map(m => m.to);
  assert.strictEqual(new Set(to).size, to.length, "nobody gets it twice");
  assert.strictEqual(to.length, 10, "4 students, 1 newcomer, 5 schools");
});
test("the stop link works only with its own signature, and stopped emails stay stopped", () => {
  const t = setup();
  t.h.students.push("stu@test.local");
  const link = t.h.unsubLink("stu@test.local"), sig = link.split("/").pop();
  assert.strictEqual(t.h.call({ action: "expo_unsub", email: "stu@test.local", sig: "forged" }).error, "bad_link");
  assert.strictEqual(t.h.call({ action: "expo_unsub", email: "other@test.local", sig }).error, "bad_link");
  assert.ok(t.h.call({ action: "expo_unsub", email: "stu@test.local", sig }).ok);
  assert.ok(t.h.call({ action: "expo_unsub", email: "STU@test.local", sig }).ok, "twice is fine");
  publish(t, t.org);
  t.h.mails.length = 0;
  t.h.notify();
  assert.ok(t.h.mails.every(m => m.to !== "stu@test.local"));
  assert.strictEqual(t.h.mails.length, 5);
});
test("the background sending writes its progress inside the lock", () => {
  const t = setup();
  t.h.students.push("stu@test.local");
  publish(t, t.org);
  const before = t.h.writesOutsideLock();
  t.h.notify();
  assert.strictEqual(t.h.writesOutsideLock(), before);
});
test("sign-up needs the privacy consent and the listed fields only", () => {
  const t = setup();
  const s = t.h.signIn("noconsent@test.local");
  assert.strictEqual(t.h.call({ action: "expo_register", token: s.token, role: "exhibitor", org_name: "X", name: "N", position: "P", phone: "0123456789",
    school_type: "college", website: "https://x.test" }).error, "consent");
  const r = t.h.call({ action: "expo_register", token: s.token, role: "exhibitor", org_name: "X", name: "N", position: "P", phone: "0123456789",
    school_type: "college", website: "https://x.test", consent: true, ic_number: "900101-01-1234" });
  assert.ok(r.me);
  assert.ok(!JSON.stringify(t.h.tables.users).includes("900101"), "extra fields are not stored");
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
