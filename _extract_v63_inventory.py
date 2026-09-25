"""Extract inventory from Vision V6.3 HTML prototype."""
import re
import json
from collections import Counter

PATH = r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html"

with open(PATH, "r", encoding="utf-8", errors="replace") as f:
    text = f.read()

print("=== FILE ===")
print("size_chars", len(text))

# --- Qe object: brace-match from Qe={
def extract_brace_object(s, start_idx):
    if s[start_idx] != "{":
        return None
    depth = 0
    i = start_idx
    in_str = None
    esc = False
    while i < len(s):
        c = s[i]
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
                    return s[start_idx : i + 1]
        i += 1
    return None

for marker in ["Qe={", "Qe = {", "var Qe={", "var Qe = {"]:
    idx = text.find(marker.replace(" ", ""))
    if idx < 0:
        idx = text.find(marker)
    if idx >= 0:
        brace = text.find("{", idx)
        qe_src = extract_brace_object(text, brace)
        print("Qe marker", marker, "at", idx, "obj_len", len(qe_src) if qe_src else 0)
        break
else:
    qe_src = None
    print("Qe NOT FOUND")

# Parse module entries from Qe without full eval - regex per key
qe_modules = []
if qe_src:
    # keys like customers:{label:...
    for m in re.finditer(r"(\w+)\s*:\s*\{", qe_src):
        key = m.group(1)
        if key in ("default", "prototype"):
            continue
        chunk_start = m.start()
        chunk = qe_src[chunk_start : chunk_start + 8000]
        label = re.search(r'label\s*:\s*"([^"]*)"', chunk)
        kind = re.search(r'kind\s*:\s*"([^"]*)"', chunk)
        data = re.search(r'data\s*:\s*"([^"]*)"', chunk)
        account_filter = re.search(r'accountFilter\s*:\s*"([^"]*)"', chunk)
        icon = re.search(r'icon\s*:\s*"([^"]*)"', chunk)
        qe_modules.append(
            {
                "key": key,
                "label": label.group(1) if label else None,
                "kind": kind.group(1) if kind else None,
                "data": data.group(1) if data else None,
                "accountFilter": account_filter.group(1) if account_filter else None,
                "icon": icon.group(1) if icon else None,
            }
        )
    print("\n=== Qe MODULES (%d) ===" % len(qe_modules))
    for mod in qe_modules:
        print(json.dumps(mod, ensure_ascii=False))

# uA, lA arrays
for name in ["uA", "lA"]:
    m = re.search(rf"{name}=\[", text)
    if not m:
        m = re.search(rf"var {name}=\[", text)
    if m:
        start = text.find("[", m.start())
        depth = 0
        in_str = None
        esc = False
        i = start
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
                elif c == "[":
                    depth += 1
                elif c == "]":
                    depth -= 1
                    if depth == 0:
                        arr_src = text[start : i + 1]
                        items = re.findall(r'"([^"]+)"', arr_src)
                        print(f"\n=== {name} ({len(items)}) ===")
                        print(items)
                        break
            i += 1
    else:
        print(f"\n=== {name} NOT FOUND ===")

# Woe, $oe global search lists
for name in ["Woe", "$oe"]:
    m = re.search(rf"var {name}=\[", text)
    if m:
        start = text.find("[", m.start())
        # find closing bracket (simple - strings only)
        end = text.find("],", start)
        if end < 0:
            end = text.find("];", start)
        snippet = text[start : end + 1] if end > 0 else text[start : start + 5000]
        items = re.findall(r'"([^"]+)"', snippet)
        print(f"\n=== {name} ({len(items)}) first20 ===")
        print(items[:20], "...")

# kind values globally
kinds = sorted(set(re.findall(r'kind:"([^"]+)"', text)))
print("\n=== kind: values ===", kinds)

# onCreate / onEdit in Qe
on_create = re.findall(r"onCreate\s*:\s*(\w+)", qe_src or text[:500000])
on_edit = re.findall(r"onEdit\s*:\s*(\w+)", qe_src or text[:500000])
print("\n=== onCreate handlers in Qe ===", sorted(set(on_create)))
print("=== onEdit handlers in Qe ===", sorted(set(on_edit)))

# columns / listFields in Qe chunks
if qe_src:
    for m in re.finditer(r"(\w+)\s*:\s*\{", qe_src):
        key = m.group(1)
        chunk = qe_src[m.start() : m.start() + 12000]
        for field_name in ["listFields", "columns", "searchFields", "detailTabs", "formSections"]:
            fm = re.search(rf"{field_name}\s*:\s*\[([^\]]{{0,3000}})\]", chunk)
            if fm:
                fields = re.findall(r'"([^"]+)"', fm.group(1))
                if fields:
                    print(f"\n{key}.{field_name}:", fields)

# Function names
funcs = re.findall(r"function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(", text)
c = Counter(funcs)
print("\n=== FUNCTIONS unique", len(c), "total", len(funcs), "===")
screenish = sorted(
    f
    for f in c
    if re.search(
        r"Screen|View|Modal|Drawer|Panel|Home|Dashboard|Report|Map|Support|Setup|Login|Record|List|Detail|Form|Overlay|Wizard|Import|Bulk|Picklist|Chatter|Activity|Notification|Customer|Account|Segment|V2|V63",
        f,
    )
)
for f in screenish:
    print(" ", f, "x", c[f])

# savedDashboards / Ii store seed
for pat in ["savedDashboards:", "savedDashboards=", "function Ii", "Ii=function", "Ii=()"]:
    i = text.find(pat)
    print(f"\n{pat} at", i)

m = re.search(r"savedDashboards\s*:\s*\[", text)
if m:
    start = text.find("[", m.start())
    obj = extract_brace_object(text, start)  # wrong - it's array
    # bracket match
    depth = 0
    in_str = None
    esc = False
    i = start
    while i < len(text) and i < start + 200000:
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
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    arr = text[start : i + 1]
                    names = re.findall(r'name\s*:\s*"([^"]+)"', arr)
                    ids = re.findall(r'id\s*:\s*"([^"]+)"', arr)
                    print("savedDashboards names:", names[:30], "count", len(names))
                    break
        i += 1

# Ii initial state keys
m = re.search(r"function Ii\(\)\{return\{", text)
if not m:
    m = re.search(r"Ii=\(\)=>\(\{", text)
if not m:
    m = re.search(r"var Ii=\{", text)
if m:
    brace = text.find("{", m.start())
    obj = extract_brace_object(text, brace)
    if obj:
        keys = re.findall(r"(\w+)\s*:", obj[:80000])
        # filter JS keywords noise
        keys_u = []
        seen = set()
        for k in keys:
            if k not in seen and k not in ("return", "function", "var", "let", "const"):
                seen.add(k)
                keys_u.append(k)
        print("\n=== Ii store top-level keys ===")
        print(keys_u)

# nav routing view values
views = sorted(set(re.findall(r'view:"([^"]+)"', text)))
tabs = sorted(set(re.findall(r'tab:"([^"]+)"', text)))
module_keys = sorted(set(re.findall(r'moduleKey:"([^"]+)"', text)))
print("\n=== nav view values ===", views)
print("=== nav tab sample (first 60) ===", tabs[:60])
print("=== moduleKey values ===", module_keys)

# Overlay patterns
overlay_hits = len(re.findall(r"fixed inset-0|slide-over|z-50|z-\[60\]|Drawer|Modal", text))
print("\n=== overlay-ish pattern count ===", overlay_hits)

# Write Qe to file for manual inspect
if qe_src:
    out = r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_qe_extract.txt"
    with open(out, "w", encoding="utf-8") as f:
        f.write(qe_src)
    print("\nWrote", out, len(qe_src))
