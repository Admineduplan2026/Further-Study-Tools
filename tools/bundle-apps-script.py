"""Joins every apps-script/*.gs file into dist/Eduplan-all.gs, so the whole server can be pasted into Apps Script as
one file (delete the other .gs files in the project first; appsscript.json stays).
Usage: python3 tools/bundle-apps-script.py   (run from the repo root)"""
import glob, os
files = sorted(glob.glob("apps-script/*.gs"), key=lambda f: (os.path.basename(f) != "Code.gs", f))
os.makedirs("dist", exist_ok=True)
with open("dist/Eduplan-all.gs", "w") as out:
    out.write("/* Eduplan Apps Script, all files in one (made by tools/bundle-apps-script.py from apps-script/*.gs).\n"
              "   Paste this as the only .gs file in the project: " + ", ".join(os.path.basename(f) for f in files) + ". */\n")
    for f in files:
        out.write("\n/* ===== " + os.path.basename(f) + " ===== */\n\n" + open(f).read().rstrip() + "\n")
print("dist/Eduplan-all.gs", sum(os.path.getsize(f) for f in files), "bytes from", len(files), "files")
