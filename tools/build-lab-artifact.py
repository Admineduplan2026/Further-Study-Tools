"""Build the Eduplan Lab artifact page (one self-contained HTML file) from lab/ and the shared assets.
Usage: python3 tools/build-lab-artifact.py <out-base.html> [--official]   (run from the repo root)
--official builds the official Eduplan artifact from the same files: title "Eduplan" and the main site's notice bar
instead of the "Eduplan Lab: a trial page" bar.
Then put the sheet data in with: node tools/sync-artifact.js <sheet-values.json> <out-base.html> <out.html>"""
import sys,base64,re
def uri(path,mime):return "data:"+mime+";base64,"+base64.b64encode(open(path,"rb").read()).decode()
assert open("assets/js/chat-knowledge.js").read()==open("apps-script/ChatKnowledge.gs").read(), "assets/js/chat-knowledge.js and apps-script/ChatKnowledge.gs differ"
css=open("assets/css/styles.css").read()
# Images the main stylesheet references (url("../img/x.svg")) are inlined, as in tools/build-artifact.py.
CSSMIME={"svg":"svg+xml","png":"png","jpg":"jpeg","jpeg":"jpeg","webp":"webp"}
css=re.sub(r'url\("\.\./img/([\w./-]+\.(svg|png|jpg|jpeg|webp))"\)',lambda m:'url("'+uri("assets/img/"+m.group(1),"image/"+CSSMIME[m.group(2)])+'")',css)
css+="\n"+open("lab/lab.css").read()
html=open("lab/index.html").read()
body=html[html.index("<body>")+6:html.index("<script")].strip()
official="--official" in sys.argv[2:]
if official:
 main=open("classic.html").read()
 notice=re.search(r'<div class="sample">.*?</div>',main).group(0)
 body=re.sub(r'<div class="sample">.*?</div>',lambda m:notice,body,count=1)
settings="window.EDUPLAN_LOGO=%r;window.EDUPLAN_CAMPUS_PHOTOS={XMUM:%r,UTAR:%r,APU:%r};window.EDUPLAN_FOUNDER_PHOTO=%r;" % (
 uri("assets/img/logo.png","image/png"),uri("assets/img/campus/xmum.jpg","image/jpeg"),uri("assets/img/campus/utar.jpg","image/jpeg"),uri("assets/img/campus/apu.jpg","image/jpeg"),uri("assets/img/founder.jpg","image/jpeg"))
files=["assets/js/config.js","lab/lab-config.js","lab/lab-about.js","assets/js/scholarship-data.js","assets/js/faculty-data.js","assets/js/quiz-data.js","assets/js/fit-data.js","assets/js/results.js","assets/js/privacy-notice.js","lab/lab-zh.js","lab/lab-host.js","assets/js/school-forms.js","assets/js/career-data.js","assets/js/app.js","lab/lab.js","assets/js/chat-knowledge.js","assets/js/chat.js","assets/js/content-zh.js","assets/js/i18n.js"]
js=settings+"\n"+"\n".join(open(f).read() for f in files)
assert "EDUPLAN_SHEET_DATA=" not in js
# Images the main app references ("assets/img/....jpg") are inlined, as in tools/build-artifact.py.
MIME={"jpg":"jpeg","jpeg":"jpeg","png":"png","webp":"webp"}
js=re.sub(r'"(assets/img/[\w./-]+\.(jpg|jpeg|png|webp))"',lambda m:'"'+uri(m.group(1),"image/"+MIME[m.group(2)])+'"',js)
out=('<title>'+("Eduplan" if official else "Eduplan Lab")+'</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap">\n'
 '<style>\n'+css+'\n</style>\n'+body+'\n<script>\n'+js+'\n</script>\n')
open(sys.argv[1],"w").write(out)
