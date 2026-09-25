import re

t = open(
    r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html",
    encoding="utf-8",
    errors="replace",
).read()
foe = t[t.find("function Foe(") : t.find("function Foe(") + 21000]

# Nav keys passed to onOpenTab / setNav
keys = re.findall(r'onOpenTab\?\.\("([^"]+)"\)|onOpenTab\("([^"]+)"\)', foe)
keys = sorted(set(a or b for a, b in keys))
print("Foe onOpenTab keys:", keys)

# Qe module keys referenced
qe_keys = re.findall(r"Qe\.(\w+)|Qe\[\"(\w+)\"\]", foe)
qe_keys = sorted(set(a or b for a, b in qe_keys))
print("Foe Qe keys:", qe_keys)

# Section labels (uppercase tracking)
sections = re.findall(r'"([A-Z][^"]{2,40})"\s*,\s*sectionKey:', foe)
print("Foe sections:", sections)

boe = t[t.find("function Boe(") : t.find("function Boe(") + 23000]
# if chains on nav.view / moduleKey
routes = re.findall(
    r'(e\.view==="[^"]+"[^)]*\)|r\.moduleKey==="[^"]+"|f\.kind==="[^"]+")', boe
)
print("Boe route patterns sample:", routes[:25])

# Extract global kind switch
for kind in [
    "list",
    "dashboard",
    "dashboards",
    "reports",
    "picklists",
    "bulkImport",
    "mapCenter",
    "setup",
    "configure",
    "support",
    "chatter",
    "manageAccount",
    "customerPortal",
    "record",
    "detail",
    "search",
    "special",
    "reportSubs",
]:
    if f'kind==="{kind}"' in boe or f'.kind==="{kind}"' in boe:
        print("Boe kind branch:", kind)

# Ii top-level keys: from Toe
toe = t[t.find("function Toe(") : t.find("function Toe(") + 3000]
# find spread Ii
m = re.search(r"\{\.\.\.Ii,", toe)
if m:
    # search Ii= before toe in file
    idx = t.rfind("Ii={", 0, t.find("function Toe("))
    print("Ii={ at", idx)
    if idx >= 0:
        snippet = t[idx : idx + 8000]
        top_keys = re.findall(r"^(\w+):", snippet, re.MULTILINE)
        # better: only at depth 1
        keys2 = re.findall(r"(\w+):(\[|\"|\d|!|\{)", snippet[:6000])
        seen = []
        for k, _ in keys2:
            if k not in seen and k not in ("return",):
                seen.append(k)
        print("Ii keys:", seen)

# Store collections count markers
for coll in [
    "accounts",
    "customers",
    "contacts",
    "assets",
    "workOrders",
    "locations",
    "segments",
    "trucks",
    "routes",
    "dispatches",
    "tips",
    "aggTips",
    "notes",
    "notifications",
    "savedReports",
    "savedDashboards",
    "profiles",
    "users",
    "picklists",
    "bulkImportJobs",
    "masterProducts",
    "products",
    "customerLocations",
    "maintProfiles",
    "requestTypes",
    "resolutionCodes",
    "reqCodes",
    "chatter",
    "activities",
]:
    if f"{coll}:" in t[idx : idx + 120000] if idx >= 0 else "":
        pass

if idx >= 0:
    seed = t[idx : idx + 200000]
    arrays = re.findall(r"(\w+):\[", seed)
    uniq = []
    for a in arrays:
        if a not in uniq:
            uniq.append(a)
    print("Ii array collections:", uniq)
