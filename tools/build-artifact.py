"""Rebuild the Eduplan artifact page from the repo: the page's own <style> block (the one after the
artifact host's wrapper style) gets styles.css, the page <script> gets the JS files, the founder photo is inlined.
Usage: python3 tools/build-artifact.py <current.html> <out-base.html>   (run from the repo root)"""
import sys,base64
h=open(sys.argv[1]).read()
first=h.index("</style>")                      # host wrapper style ends here
a=h.index("<style>",first)+len("<style>");b=h.index("</style>",a)
import re,base64
css=open("assets/css/styles.css").read()
# Images the stylesheet references (url("../img/x.svg"), relative to assets/css) are inlined, since the artifact is a single page.
CSSMIME={"svg":"svg+xml","png":"png","jpg":"jpeg","jpeg":"jpeg","webp":"webp"}
css=re.sub(r'url\("\.\./img/([\w./-]+\.(svg|png|jpg|jpeg|webp))"\)',lambda m:'url("data:image/'+CSSMIME[m.group(2)]+';base64,'+base64.b64encode(open("assets/img/"+m.group(1),"rb").read()).decode()+'")',css)
h=h[:a]+"\n"+css+"\n"+h[b:]
a=h.index("<script>")+len("<script>");b=h.index("</script>",a)
# The AI chat instructions are kept in two identical copies (website and Apps Script).
assert open("assets/js/chat-knowledge.js").read()==open("apps-script/ChatKnowledge.gs").read(), "assets/js/chat-knowledge.js and apps-script/ChatKnowledge.gs differ"
js="\n".join(open("assets/js/"+f).read() for f in ["config.js","scholarship-data.js","faculty-data.js","quiz-data.js","app.js","chat-knowledge.js","chat.js","i18n.js"])
assert "EDUPLAN_SHEET_DATA=" not in js
import re
# Images referenced from the JS ("assets/img/....jpg|png|webp") are inlined, since the artifact is a single page.
MIME={"jpg":"jpeg","jpeg":"jpeg","png":"png","webp":"webp"}
js=re.sub(r'"(assets/img/[\w./-]+\.(jpg|jpeg|png|webp))"',lambda m:'"data:image/'+MIME[m.group(2)]+';base64,'+base64.b64encode(open(m.group(1),"rb").read()).decode()+'"',js)
open(sys.argv[2],"w").write(h[:a]+"\n"+js+"\n"+h[b:])
