"""Test Lab data: every school sheet's programmes (real names, read-only copy) with the blanks filled by made-up
(Demo) values, so every compare / fit feature has something to show. Writes testlab-values.json for
tools/sync-artifact.js. Nothing here is written to any Google Sheet."""
import json, sys, hashlib, copy
SP = sys.argv[1]
base = json.load(open(SP + "/sync-values-1022.json"))
cp = json.load(open(sys.argv[2]))["values"]          # Control Panel Programmes!B2:G : school, id, name, level, course, years
schools_meta = json.loads(sys.argv[3])                # [[id, name, type, state], ...]

def rnd(key, lo, hi, step=1):
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    n = (hi - lo) // step + 1
    return lo + (h % n) * step
def pick(key, opts): return opts[rnd(key, 0, len(opts) - 1)]

STATE_CITY = {"W.P. Kuala Lumpur": "Kuala Lumpur", "Selangor": "Shah Alam", "W.P. Putrajaya": "Putrajaya", "Negeri Sembilan": "Seremban",
  "Melaka": "Melaka", "Johor": "Johor Bahru", "Perak": "Ipoh", "Pulau Pinang": "George Town", "Kedah": "Alor Setar", "Sarawak": "Kuching", "Sabah": "Kota Kinabalu"}
CAREERS = {
 "01": ["Teacher", "Education officer", "Curriculum developer", "Tutor", "Early childhood educator"],
 "02": ["Graphic designer", "Illustrator", "Content creator", "Art director", "Translator", "Performer"],
 "03": ["Journalist", "Public relations officer", "Social researcher", "Content writer", "Communications executive"],
 "04": ["Accountant", "Financial analyst", "Marketing executive", "Business analyst", "Auditor", "Entrepreneur"],
 "05": ["Laboratory scientist", "Research assistant", "Data analyst", "Quality control officer", "Food technologist"],
 "06": ["Software developer", "Data scientist", "Cyber security analyst", "Systems analyst", "Cloud engineer", "UI/UX designer"],
 "07": ["Civil engineer", "Mechanical engineer", "Electrical engineer", "Project engineer", "Quantity surveyor", "Architect"],
 "08": ["Agronomist", "Veterinary assistant", "Aquaculture officer", "Plantation executive"],
 "09": ["Doctor", "Pharmacist", "Nurse", "Physiotherapist", "Biomedical scientist", "Dentist"],
 "10": ["Chef", "Hotel manager", "Event planner", "Tourism officer", "Pastry chef"],
 "00": ["Leads to a degree in your chosen field"],
}
INTAKES = ["January / May / September", "February / July", "March / August / October", "January / April / July / October"]
ENGLISH = ["MUET Band 3 or IELTS 5.0", "MUET Band 3.5 or IELTS 5.5", "MUET Band 4 or IELTS 6.0", "SPM English: credit"]

def fac(course): return (course or "")[:2] if (course or "")[:2].isdigit() else "00"
def years_for(level, name):
    if "Medicine" in name or "MBBS" in name or "Dental Surgery" in name: return 5
    return {"Pre-university (Foundation / Matriculation / Form 6 / A-Level)": 1, "Certificate": 1, "Diploma": 2.5, "Bachelor's Degree": 4 if "Engineering" in name else 3,
            "Master's Degree": 1.5, "PhD": 3, "Professional Certificate": 0.5}.get(level, 3)
def fee_for(pid, level, name, yrs):
    if "Medicine" in name or "MBBS" in name or "Dental Surgery" in name: return rnd(pid, 3000, 5200) * 100
    per = {"Pre-university (Foundation / Matriculation / Form 6 / A-Level)": (150, 350), "Certificate": (80, 180), "Diploma": (110, 250),
           "Bachelor's Degree": (180, 520), "Master's Degree": (180, 450), "PhD": (150, 300), "Professional Certificate": (200, 700)}.get(level, (150, 400))
    return int(round(rnd(pid, per[0], per[1]) * 100 * max(yrs, 0.5) / 100.0) * 100)
def entry_for(pid, level):
    if level.startswith("Pre-university"): return "• SPM: 5 credits including Mathematics and English"
    if level == "Certificate" or level == "Professional Certificate": return "• SPM: 1 credit and a pass in Bahasa Melayu"
    if level == "Diploma": return "• SPM: 3 credits including Mathematics"
    if level == "Bachelor's Degree": return "• STPM: 2 principal passes (C)\n• Foundation / Matriculation: CGPA 2.50"
    return ""

def fill(row, keys, school, city, demo_all):
    """row: dict key -> value. Fills only empty cells with Demo values; real values are kept."""
    pid = row["programme_id"]; name = row.get("programme_name", ""); level = row.get("level", ""); f = fac(row.get("course"))
    filled = []
    def put(k, v):
        if str(row.get(k, "") or "").strip() == "" and v not in ("", None): row[k] = v; filled.append(k)
    yrs = float(row["duration_years"]) if str(row.get("duration_years", "")).strip() else years_for(level, name)
    put("duration_years", yrs)
    put("intakes", pick(pid + "i", INTAKES)); put("campus", city); put("study_mode", "Full-time")
    if level.startswith("Pre-university") or level in ("Certificate", "Diploma", "Professional Certificate"): put("entry_spm", entry_for(pid, level))
    else: put("entry_other", entry_for(pid, level))
    put("english_requirement", pick(pid + "e", ENGLISH))
    put("tuition_fee_rm", fee_for(pid, level, name, yrs))
    car = CAREERS.get(f, CAREERS["00"]); n = rnd(pid + "c", 3, min(5, len(car)))
    put("career_prospects", "\n".join("• " + c for c in (car[rnd(pid + "s", 0, len(car) - 1):] + car)[:n]))
    put("overview", "(Demo) Test description of " + name + " at " + school + ". Not real information.")
    if filled: row["notes"] = ((row.get("notes") or "") + "\n(Demo) Made-up test values: " + ", ".join(filled)).strip()
    row["published"] = "Yes"
    return row

PKEYS = [s for s in base["schools"] if s["name"] == "APU"][0]["programmes"]
CKEYS = [s for s in base["schools"] if s["name"] == "APU"][0]["campus"]
IKEYS = [s for s in base["schools"] if s["name"] == "APU"][0]["institutions"]
pk, ck, ik = PKEYS[1], CKEYS[1], IKEYS[1]
def to_row(keys, d): return [d.get(k, "") for k in keys]
def sheet(head, rows): return head[:3] + rows

out = {"foundation": base["foundation"], "lists": base["lists"], "faq": base.get("faq", []), "schools": []}
done = set()
# 1) the published schools: keep their rows, fill blanks
for s in base["schools"]:
    s = copy.deepcopy(s); ins = s["institutions"]
    if len(ins) < 4 or not str(ins[3][0]).strip(): continue
    inst = dict(zip(ik, ins[3])); city = inst.get("city") or STATE_CITY.get(inst.get("state"), "Kuala Lumpur")
    rows = []
    for r in s["programmes"][3:]:
        d = dict(zip(pk, r))
        if not str(d.get("programme_id", "")).strip() or str(d["programme_id"]).startswith("EXAMPLE"): continue
        rows.append(to_row(pk, fill(d, pk, inst.get("short_name") or inst["name"], city, False)))
    s["programmes"] = sheet(s["programmes"], rows)
    out["schools"].append(s); done.add(s["name"]); done.add(inst["institution_id"])

# 2) every other school from the Control Panel list
meta = {m[0]: m for m in schools_meta if len(m) > 1}
by = {}
for r in cp:
    if len(r) < 2 or not r[1]: continue
    by.setdefault(r[0], []).append(r)
for sid, progs in by.items():
    if sid in done or sid not in meta or len(meta[sid]) < 3: continue
    m = meta[sid] + [""] * 4
    state = m[3]; city = "Singapore" if sid in ("PSB", "SIM") else STATE_CITY.get(state, "Kuala Lumpur")
    if sid == "BAC": state, city = "W.P. Kuala Lumpur", "Kuala Lumpur"
    if sid == "VELFORD": state, city = "Selangor", "Petaling Jaya"
    inst = {"institution_id": sid, "name": m[1], "short_name": sid if len(sid) <= 8 else m[1], "type": m[2], "state": state, "city": city,
            "website": "", "hostel": "Yes", "hostel_fee_min": rnd(sid + "h", 30, 60) * 10, "hostel_fee_max": rnd(sid + "H", 70, 150) * 10,
            "last_updated": "2026-10-23", "published": "Yes"}
    rows = []
    for r in progs:
        r = r + [""] * 6
        d = {"programme_id": r[1], "institution_id": sid, "programme_name": r[2], "level": r[3], "course": r[4], "duration_years": r[5]}
        if r[4][:2].isdigit():
            d["faculty_auto"] = ""
        rows.append(to_row(pk, fill(d, pk, inst["short_name"], city, True)))
    # (Demo) campus scholarships: SPM tiers
    tiers = [(rnd(sid + "a", 8, 10), rnd(sid + "w1", 6, 10) * 10), (rnd(sid + "b", 6, 7), rnd(sid + "w2", 3, 5) * 10), (rnd(sid + "c", 4, 5), rnd(sid + "w3", 1, 2) * 10)]
    crow = [to_row(ck, {"scholarship_id": "%s-DEMO-%dA" % (sid, a), "institution_id": sid, "scholarship_name": sid + " Merit Scholarship (Demo)", "type": "Merit scholarship",
                       "qualification": "SPM", "minimum_result": "%dAs" % a, "waiver_percent": w, "other_conditions": "(Demo) Made-up test scholarship. Not real.",
                       "last_updated": "2026-10-23", "published": "Yes"}) for a, w in tiers]
    out["schools"].append({"name": sid, "institutions": IKEYS[:3] + [to_row(ik, inst)], "programmes": sheet(PKEYS, rows), "campus": sheet(CKEYS, crow)})
json.dump(out, open(SP + "/testlab-values.json", "w"), ensure_ascii=False)
print(len(out["schools"]), "schools", sum(len(s["programmes"]) - 3 for s in out["schools"]), "programmes")
