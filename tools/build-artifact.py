"""Rebuild the Eduplan artifact page from the repo: the page's own <style> block (the one after the
artifact host's wrapper style) gets styles.css, the page <script> gets the JS files, the founder photo is inlined.
Usage: python3 tools/build-artifact.py <current.html> <out-base.html>   (run from the repo root)"""
import sys,base64
h=open(sys.argv[1]).read()
first=h.index("</style>")                      # host wrapper style ends here
a=h.index("<style>",first)+len("<style>");b=h.index("</style>",a)
h=h[:a]+"\n"+open("assets/css/styles.css").read()+"\n"+h[b:]
a=h.index("<script>")+len("<script>");b=h.index("</script>",a)
js="\n".join(open("assets/js/"+f).read() for f in ["config.js","scholarship-data.js","faculty-data.js","app.js"])
assert "EDUPLAN_SHEET_DATA=" not in js
js=js.replace('"assets/img/founder.jpg"','"data:image/jpeg;base64,'+base64.b64encode(open("assets/img/founder.jpg","rb").read()).decode()+'"')
open(sys.argv[2],"w").write(h[:a]+"\n"+js+"\n"+h[b:])
