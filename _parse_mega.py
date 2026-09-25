import re
PATH = r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html"
text = open(PATH, encoding="utf-8", errors="replace").read()

def slice_func(name, max_len=120000):
    m = re.search(rf"function {re.escape(name)}\(", text)
    if not m:
        return None
    nxt = re.search(r"\nfunction [A-Za-z_$]", text[m.end() : m.end() + max_len])
    end = m.end() + (nxt.start() if nxt else max_len)
    return text[m.start() : min(m.start() + max_len, end)]

for name in ["$ne", "Goe", "Hoe", "Ioe", "Joe", "Koe", "Loe", "Moe", "Noe", "Ooe", "Poe", "Qoe", "Roe", "Soe", "Toe", "Uoe", "Voe", "Xoe", "Yoe", "Zoe", "Aoe", "Boe", "Coe", "Doe", "Eoe"]:
    body = slice_func(name, 80000)
    if body and len(body) > 200:
        path = rf"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_{name.replace('$','dollar')}.txt"
        open(path, "w", encoding="utf-8").write(body)
        print(name, len(body), body[:120].replace("\n", " "))

# Parse FB (main) - first 15k for nav logic
fb = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_FB.txt", encoding="utf-8").read()
# find actual FB function start within line
idx = fb.find("function FB(")
if idx >= 0:
    fb = fb[idx:]
open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_FB_trim.txt", "w", encoding="utf-8").write(fb[:60000])

# Global content renderer - search view==="global"
for m in re.finditer(r'view==="global"', text):
    if m.start() < 2000000:
        print("global nav at", m.start())
        print(text[m.start()-200:m.start()+800][:1000])
        break

# kind:"search" context
idx = text.find('kind:"search"')
print("\nsearch kind context:\n", text[idx-400:idx+2500][:2900])

# Ii - search patterns
for pat in ["function Ii(", "Ii=function", "Ii=()=>", "initialStore", "savedDashboards:"]:
    print(pat, text.find(pat))

idx = text.find("savedDashboards:")
if idx > 0:
    print("\nsavedDashboards snippet:\n", text[idx:idx+4000])

# Extract store seed near savedDashboards
idx2 = text.find("accounts:[", idx - 500000 if idx > 0 else 0)
print("accounts:[ near seed", idx2)

# Find Je or form defs - search label:"Customer Information"
for label in ["Customer Information", "Account Information", "Work Order Details", "Asset Details"]:
    i = text.find(label)
    print(label, i)
