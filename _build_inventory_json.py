import re, json
PATH = r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html"
text = open(PATH, encoding="utf-8", errors="replace").read()

# --- p6 form schemas ---
m = re.search(r"var p6=\{", text)
if not m:
    m = re.search(r"p6=\{", text)
p6 = {}
if m:
    start = m.end() - 1
    depth = 0
    in_str = None
    esc = False
    i = start
    while i < len(text) and i < start + 500000:
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
                    p6_src = text[start : i + 1]
                    break
        i += 1
    else:
        p6_src = None
    if p6_src:
        for mod in re.finditer(r"(\w+):\{sections:\[", p6_src):
            key = mod.group(1)
            chunk = p6_src[mod.start() : mod.start() + 25000]
            sections = []
            for sm in re.finditer(r'title:"([^"]+)"', chunk):
                pass
            # sections with fields
            for sec in re.finditer(
                r'title:"([^"]+)",cols:(\d+),fields:\[(.*?)\]\}', chunk, re.DOTALL
            ):
                fields = re.findall(r'name:"([^"]+)",label:"([^"]+)"', sec.group(3))
                sections.append(
                    {
                        "title": sec.group(1),
                        "cols": int(sec.group(2)),
                        "fields": [{"name": a, "label": b} for a, b in fields],
                    }
                )
            if sections:
                p6[key] = sections

# --- Ii store: find Toe spread ---
m = re.search(r"\{\.\.\.Ii,", text)
if m:
    # search backwards for Ii=
    back = text[max(0, m.start() - 200000) : m.start()]
    im = list(re.finditer(r"Ii=\{", back))
    if im:
        rel = im[-1].start()
        abs_start = max(0, m.start() - 200000) + rel
        brace = text.find("{", abs_start)
        depth = 0
        in_str = None
        esc = False
        i = brace
        while i < len(text) and i < brace + 400000:
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
                        ii_src = text[brace : i + 1]
                        break
            i += 1
        else:
            ii_src = None
    else:
        ii_src = None
else:
    ii_src = None

ii_keys = []
if ii_src:
    for km in re.finditer(r"(\w+):(\[|\{)", ii_src):
        k = km.group(1)
        if k not in ii_keys:
            ii_keys.append(k)

# --- mA toolbar extraction ---
ma = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_mA.txt", encoding="utf-8").read()
# split mA body only
ma_body = ma[ma.find("function mA(") :]

# module-specific blocks e==="customers" etc
module_toolbars = {}
for mk in [
    "customers",
    "accounts",
    "assets",
    "workOrders",
    "contacts",
    "locations",
    "trucks",
    "routes",
    "tips",
    "aggTips",
    "products",
    "masterProducts",
]:
    pat = rf'e==="{mk}"'
    if pat.replace('e', 'moduleKey') in ma_body:
        pass
    idx = ma_body.find(f'moduleKey==="{mk}"')
    if idx < 0:
        idx = ma_body.find(f'e==="{mk}"')
    if idx >= 0:
        chunk = ma_body[idx : idx + 6000]
        labels = re.findall(r',"([^"]{2,45})"\)', chunk)
        module_toolbars[mk] = sorted(set(labels))

# generic toolbar strings in mA
all_btn = re.findall(r'"([A-Za-z][^"]{1,40})"\s*\)\s*,\s*o\.default\.createElement\("button"', ma_body)
all_btn += re.findall(r'createElement\("button"[^)]+\)[^"]*"([^"]+)"', ma_body)

# --- Foe sidebar: extract Qe key references ---
foe = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_Foe.txt", encoding="utf-8").read()
foe_keys = re.findall(r'Qe\[([^\]]+)\]|onOpenTab\([^)]*"([^"]+)"|"([a-z][a-zA-Z]+)"\s*,\s*Qe\.', foe)
# simpler: keys in onClick handlers
nav_clicks = re.findall(r'onClick:\(\)=>[^"]*"([a-zA-Z]+)"', foe)
nav_clicks += re.findall(r'moduleKey:"([a-zA-Z]+)"', foe)
nav_clicks += re.findall(r'"([a-z][a-zA-Z]+)"\s*\)\s*,\s*Qe\[', foe)

# Section labels in Foe
section_labels = re.findall(r'label:"([^"]+)"', foe[:15000])

# --- Boe routing ---
boe = text[text.find("function Boe(") : text.find("function Boe(") + 25000]
boe_routes = re.findall(r'moduleKey==="([^"]+)"|tab==="([^"]+)"|view==="([^"]+)"', boe)

# --- Global modules from Ioe / Hoe ---
for fn in ["Ioe", "Hoe", "Joe", "Koe", "Loe"]:
    body = text[text.find(f"function {fn}(") : text.find(f"function {fn}(") + 8000]
    if body:
        module_toolbars[f"__screen_{fn}"] = re.findall(r'"([A-Z][^"]{3,40})"', body)[:15]

out = {
    "p6_modules": list(p6.keys()),
    "p6": p6,
    "ii_store_keys": ii_keys,
    "mA_module_toolbars": module_toolbars,
    "foe_nav_clicks_sample": sorted(set(nav_clicks))[:50],
    "foe_section_labels_sample": section_labels[:30],
}

open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_inventory_data.json", "w", encoding="utf-8").write(
    json.dumps(out, indent=2, ensure_ascii=False)
)
print("p6 modules", len(p6))
print("ii keys", len(ii_keys), ii_keys[:35])
print("wrote _inventory_data.json")
