"""Deep extraction for V6.3 HTML inventory."""
import re
import json

PATH = r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html"
OUT = r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_v63_inventory_chunks.txt"

with open(PATH, "r", encoding="utf-8", errors="replace") as f:
    text = f.read()

lines = text.split("\n")
print("lines", len(lines))

def extract_func(name, max_len=25000):
    pat = rf"function {name}\("
    m = re.search(pat, text)
    if not m:
        pat2 = rf"function {name}\("
        return None
    start = m.start()
    return text[start : start + max_len]

chunks = []

for fn in [
    "Une", "mA", "FB", "Foe", "Gne", "Hne", "Ine", "Jne", "Kne", "Lne",
    "One", "Rne", "Sne", "Tne", "Vne", "Wne", "Xne", "Yne", "Zne",
    "SupportScreenV2", "PicklistManagementV2", "ServiceNotificationsScreenV2",
    "SPReportWorkspace", "DispatchLandingV2", "DispatchBuilderV2",
    "Tie", "Mie", "qne",
]:
    c = extract_func(fn)
    if c:
        chunks.append(f"\n\n===== function {fn} (first {len(c)} chars) =====\n")
        chunks.append(c)
        print("found", fn, len(c))
    else:
        print("MISSING", fn)

# Ii store
m = re.search(r"function Ii\(\)\{return\{", text)
if m:
    start = m.start()
    chunk = text[start : start + 120000]
    chunks.append("\n\n===== function Ii =====\n")
    chunks.append(chunk)
    print("Ii len", len(chunk))

# Record schemas - look for patterns like customers:{fields
for marker in ["RECORD_SCHEMAS", "recordSchemas", "FORM_SCHEMAS", "moduleForms", "Be={"]:
    idx = text.find(marker)
    print(marker, idx)

# Extract Be= if exists (common minified name for forms)
m = re.search(r"Be=\{", text)
if m:
    chunks.append("\n\n===== Be= forms (first 80k) =====\n")
    chunks.append(text[m.start() : m.start() + 80000])
    print("Be at", m.start())

# Search for kind:"search" context
for m in re.finditer(r'kind:"search"', text):
    chunks.append("\n\n===== kind search at %d =====\n" % m.start())
    chunks.append(text[m.start() - 500 : m.start() + 2000])
    print("kind search at", m.start())
    break

# Une kind switches
une = extract_func("Une", 35000)
if une:
    switches = re.findall(r'f\.kind==="([^"]+)"|kind==="([^"]+)"', une)
    print("Une kind checks:", sorted(set(a or b for a, b in switches)))

# Global renderer in FB
fb = extract_func("FB", 40000)
if fb:
    renders = re.findall(r"createElement\(([A-Za-z_$][A-Za-z0-9_$]*)", fb)
    from collections import Counter
    top = Counter(renders).most_common(40)
    print("FB createElement top:", top)

# Foe nav keys - onClick patterns openTab
foe = extract_func("Foe", 30000)
if foe:
    tabs = re.findall(r'onOpenTab\?\.\("([^"]+)"\)|onOpenTab\("([^"]+)"\)|moduleKey:"([^"]+)"', foe)
    # simpler
    nav_keys = re.findall(r'"([a-zA-Z]+)"\s*,\s*label:', foe)
    open_tabs = re.findall(r'onOpenTab\([^)]+\)', foe[:15000])
    print("Foe onOpenTab samples:", open_tabs[:15])

with open(OUT, "w", encoding="utf-8") as f:
    f.write("".join(chunks))
print("Wrote", OUT)

# Parse Qe cols into json
qe_path = r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_qe_extract.txt"
with open(qe_path, encoding="utf-8") as f:
    qe = f.read()

modules = {}
for m in re.finditer(r"(\w+):\{label:\"([^\"]+)\",icon:\w+,kind:\"([^\"]+)\"", qe):
    key, label, kind = m.groups()
    chunk = qe[m.start() : m.start() + 4000]
    global_flag = "global:!0" in chunk or "global:!0" in chunk.replace(" ", "")
    settings = "settingsOnly:!0" in chunk
    cols = re.findall(r'label:"([^"]+)"', chunk)
    # first col labels from cols array only
    col_labels = []
    cm = re.search(r"cols:\[(.*?)\]\}", chunk, re.DOTALL)
    if cm:
        col_labels = re.findall(r'label:"([^"]+)"', cm.group(1))
    modules[key] = {
        "label": label,
        "kind": kind,
        "global": "global:!0" in chunk,
        "settingsOnly": settings,
        "cols": col_labels,
    }

with open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_qe_modules.json", "w", encoding="utf-8") as f:
    json.dump(modules, f, indent=2, ensure_ascii=False)
print("Wrote _qe_modules.json", len(modules))


def extract_func_body(name):
    m = re.search(rf"function {name}\(", text)
    if not m:
        return None
    i = m.end() - 1
    while i < len(text) and text[i] != "{":
        i += 1
    if i >= len(text):
        return None
    depth = 0
    in_str = None
    esc = False
    while i < len(text):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == in_str:
                in_str = None
        else:
            if c in ('"', "'"):
                in_str = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[m.start() : i + 1]
        i += 1
    return None


print("\n=== FULL FUNCTION SIZES ===")
for fn in [
    "Une",
    "mA",
    "FB",
    "Foe",
    "Gne",
    "Hne",
    "Ine",
    "Jne",
    "Lne",
    "One",
    "Rne",
    "Sne",
    "Tne",
    "Vne",
    "Wne",
    "Goe",
    "Hoe",
    "Ioe",
]:
    body = extract_func_body(fn)
    print(fn, len(body) if body else "MISSING")

une = extract_func_body("Une")
if une:
    with open(
        r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_Une_full.txt", "w", encoding="utf-8"
    ) as f:
        f.write(une)
    kinds = re.findall(r'f\.kind==="([^"]+)"', une)
    print("Une f.kind:", kinds)
    t_checks = sorted(set(re.findall(r't==="([^"]+)"', une)))
    print("Une t===:", t_checks)
    comps = sorted(set(re.findall(r"createElement\(([A-Za-z_$][A-Za-z0-9_$]*)", une)))
    print("Une components:", comps)

ma = extract_func_body("mA")
if ma:
    with open(
        r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_mA_full.txt", "w", encoding="utf-8"
    ) as f:
        f.write(ma)
    # toolbar button labels (text nodes in buttons)
    btn_labels = re.findall(
        r'createElement\("button"[^)]*\)[^,]*,[^"]*"([^"]{2,50})"', ma
    )
    print("mA button labels sample:", sorted(set(btn_labels))[:40])

fb = extract_func_body("FB")
if fb:
    with open(
        r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_FB_full.txt", "w", encoding="utf-8"
    ) as f:
        f.write(fb)
    print("FB len", len(fb))
    nav_samples = re.findall(r"setNav\(\{[^\}]{0,300}\}", fb)
    print("setNav count", len(nav_samples))
    for s in nav_samples[:12]:
        print(" ", s[:250])

foe = extract_func_body("Foe")
if foe:
    with open(
        r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_Foe_full.txt", "w", encoding="utf-8"
    ) as f:
        f.write(foe)

# Form schema object - search id patterns with fields arrays
m = re.search(r"Je=\{", text)
if not m:
    m = re.search(r"Ke=\{", text)
if not m:
    m = re.search(r"Ze=\{", text)
for marker in ["Je={", "Ke={", "Ze={", "Ye={", "Xe={", "We={", "Ve={"]:
    idx = text.find(marker)
    if idx >= 0:
        print(marker, "at", idx)

# RECORD_FORMS near singular definitions
for m in re.finditer(r'singular:"([^"]+)"', text):
    pass
singulars = sorted(set(re.findall(r'singular:"([^"]+)"', text)))
print("singulars count", len(singulars), singulars[:20])

# Extract large object with module form fields - look for customers:{sections
idx = text.find("customers:{sections:")
if idx < 0:
    idx = text.find('customers:{label:"Customer"')
print("customers form idx", idx)

# Ii keys with array lengths (approx)
ii = extract_func_body("Ii")
if ii:
    with open(
        r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_Ii_full.txt", "w", encoding="utf-8"
    ) as f:
        f.write(ii[:150000])
    keys = re.findall(r"(\w+):(\[|\{)", ii[:120000])
    print("Ii collections:", [k for k, v in keys if v == "["][:40])

# Global search catalog Je or search modal
for pat in ["SearchModal", "function ene", "function nne", "kind:\"search\"", "Woe=", "globalNav"]:
    print(pat, text.find(pat))

# buildScreenModulesV2 modules list
bsm = text.find("function buildScreenModulesV2")
if bsm >= 0:
    chunk = text[bsm : bsm + 15000]
    mod_names = re.findall(r'module:"([^"]+)"', chunk)
    print("buildScreenModulesV2 modules:", mod_names[:30], "... total", len(mod_names))
