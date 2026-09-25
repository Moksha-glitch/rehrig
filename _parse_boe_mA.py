import re

t = open(
    r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html",
    encoding="utf-8",
    errors="replace",
).read()
boe = t[t.find("function Boe(") : t.find("function Boe(") + 23000]

# Map moduleKey branches to createElement components
pairs = re.findall(
    r'moduleKey==="([^"]+)"[^)]*\)[^?]*\?[^:]*:|\&\&e\.moduleKey==="([^"]+)"\)[^,]*,[^)]*createElement\(([A-Za-z_$][A-Za-z0-9_$]*)',
    boe,
)
print("=== Boe global moduleKey -> component (heuristic) ===")
for a, b, c in re.findall(
    r'e\.moduleKey==="([^"]+)"\)[^}]{0,400}?createElement\(([A-Za-z_$][A-Za-z0-9_$]*)',
    boe,
):
    print(f"  {a} -> {c}")

# Also includes() configure group
if "ConfigureScreen" in boe or "configure" in boe.lower():
    print("configure group in boe")

for line_part in boe.split("createElement"):
    if "moduleKey" in line_part[:200]:
        m = re.search(r"moduleKey===.*?createElement\(([A-Za-z_$][\w$]*)", "createElement" + line_part[:500])
        if m:
            pass

# Extract all e.moduleKey==="x" in Boe
mods = re.findall(r'e\.moduleKey==="([^"]+)"', boe)
print("Boe moduleKey literals:", sorted(set(mods)))

ma = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_mA.txt", encoding="utf-8").read()
# Human readable strings in mA (unicode letters)
strings = re.findall(r'"([A-Za-z][A-Za-z0-9 /&\-–—·]+)"', ma)
interesting = sorted(
    set(
        s
        for s in strings
        if any(
            x in s.lower()
            for x in [
                "create",
                "new ",
                "mass",
                "export",
                "import",
                "upload",
                "filter",
                "login",
                "switch",
                "hot",
                "past",
                "no ",
                "empty",
                "all ",
                "record",
            ]
        )
    )
)
print("\n=== mA UI strings ===")
for s in interesting[:60]:
    print(" ", s)

# Foe nav item labels - look for z.label patterns
foe = t[t.find("function Foe(") : t.find("function Foe(") + 21000]
labels = re.findall(r"label:Qe\.(\w+)\.label|Qe\[\"(\w+)\"\]\.label", foe)
# NavItem probably uses q.label from Qe
nav_modules = re.findall(r"modKey:\"(\w+)\"|key:\"(\w+)\"", foe)
print("\nFoe mod keys sample:", sorted(set(a or b for a, b in nav_modules))[:40])

# Default sidebar section state
print("Foe default sections: related=uA, settings=lA, analytics=dashboards/reports/chatter")
