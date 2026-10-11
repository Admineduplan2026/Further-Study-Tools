"""Build the Eduplan Lab artifact page (one self-contained HTML file) from lab/ and the shared assets.
Usage: python3 tools/build-lab-artifact.py <out-base.html>   (run from the repo root)
Then put the sheet data in with: node tools/sync-artifact.js <sheet-values.json> <out-base.html> <out.html>"""
import sys,base64,re
MAIN_ARTIFACT="https://claude.ai/artifact/Hwe6DFvyriBQ6sWEVLNQ6J"   # the main Eduplan artifact (links for Apply, consultation, sign-in)
def uri(path,mime):return "data:"+mime+";base64,"+base64.b64encode(open(path,"rb").read()).decode()
assert open("assets/js/chat-knowledge.js").read()==open("apps-script/ChatKnowledge.gs").read(), "assets/js/chat-knowledge.js and apps-script/ChatKnowledge.gs differ"
css=open("lab/lab.css").read()
html=open("lab/index.html").read()
body=html[html.index("<body>")+6:html.index("<script")].strip()
settings="window.EDUPLAN_MAIN_URL=%r;window.EDUPLAN_LOGO=%r;window.EDUPLAN_CAMPUS_PHOTOS={XMUM:%r};" % (
 MAIN_ARTIFACT,uri("assets/img/logo.png","image/png"),uri("assets/img/campus/xmum.jpg","image/jpeg"))
files=["assets/js/config.js","lab/lab-config.js","assets/js/faculty-data.js","assets/js/quiz-data.js","lab/lab-zh.js","lab/lab.js","assets/js/chat-knowledge.js","assets/js/chat.js","assets/js/i18n.js"]
js=settings+"\n"+"\n".join(open(f).read() for f in files)
assert "EDUPLAN_SHEET_DATA=" not in js
out=('<title>Eduplan Lab</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap">\n'
 '<style>\n'+css+'\n</style>\n'+body+'\n<script>\n'+js+'\n</script>\n')
open(sys.argv[1],"w").write(out)
