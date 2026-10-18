#!/usr/bin/env python3
"""Merge translated course text into assets/js/content-zh.js.

  python3 tools/make-content-zh.py <translations.json> [more.json ...]

Each JSON file is {"English text": "中文", ...}. Existing entries are kept unless a file gives a new value.
See tools/content-zh.md for the whole process."""
import json, re, sys
PATH = "assets/js/content-zh.js"
HEAD = ("/* Chinese for the course details that come from the school sheets (programme names, structures, entry rules,\n"
        "   overviews, careers, notes). Keys are the English text exactly as shown on the page; assets/js/i18n.js uses them\n"
        "   when the site is switched to 中文. Made with tools/make-content-zh.py; see tools/content-zh.md. */\n")
try:
    src = open(PATH, encoding="utf-8").read()
    zh = json.loads(re.search(r"window\.EDUPLAN_CONTENT_ZH=(\{.*\});", src, re.S).group(1))
except (OSError, AttributeError):
    zh = {}
for f in sys.argv[1:]:
    for k, v in json.load(open(f, encoding="utf-8")).items():
        if v and v != k:
            zh[k] = v
body = ",\n".join(json.dumps(k, ensure_ascii=False) + ":" + json.dumps(zh[k], ensure_ascii=False) for k in sorted(zh))
open(PATH, "w", encoding="utf-8").write(HEAD + "window.EDUPLAN_CONTENT_ZH={\n" + body.replace("</", "<\\/") + "\n};\n")
print(len(zh), "entries in", PATH)
