import re
import json

t = open(
    r"c:\Users\MokshaVemula\Downloads\Vision_V6.3_Segment_based (4).html",
    encoding="utf-8",
    errors="replace",
).read()

i = t.find("p6={")
chunk = t[i : i + 350000]
mods = re.findall(r"(\w+):\{title:\"([^\"]+)\",sections:", chunk)
schemas = {}
for key, title in mods:
    start = chunk.find(f"{key}:{{title:")
    sub = chunk[start : start + 50000]
    secs = re.findall(r'title:"([^"]+)",cols:\d+,fields:\[(.*?)\]\}', sub, re.DOTALL)
    sections = []
    for st, flds in secs:
        names = re.findall(r'C\("([^"]+)","([^"]+)"', flds)
        sections.append({"title": st, "fields": [{"name": a, "label": b} for a, b in names]})
    schemas[key] = {"title": title, "sections": sections}

open(
    r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_p6_schemas.json", "w", encoding="utf-8"
).write(json.dumps(schemas, indent=2, ensure_ascii=False))
print("p6 modules", len(schemas), list(schemas.keys()))

sd = t.find("savedDashboards:")
j = sd
while j > 0 and t[j] != "{":
    j -= 1
keys = re.findall(r"(\w+):\[", t[j : sd + 8000])
print("array keys near Ii seed:", keys)

ma = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_mA.txt", encoding="utf-8").read()
labels = set(re.findall(r'btn-primary[^"]*"([^"]+)"', ma))
labels.update(re.findall(r'btn-secondary[^"]*"([^"]+)"', ma))
print("mA buttons:", sorted(labels))

foe = open(r"c:\Users\MokshaVemula\Documents\GitHub\rehrig\_fn_Foe.txt", encoding="utf-8").read()
for needle in ["Related", "Settings", "Analytics", "Vision", "Switch Service Provider"]:
    print(needle, foe.find(needle))

boe = t[t.find("function Boe(") : t.find("function Boe(") + 23000]
for comp in [
    "PicklistManagementV2",
    "SupportScreenV2",
    "Qne",
    "iie",
    "Tie",
    "Ioe",
    "Hoe",
    "Une",
    "Vne",
    "mA",
    "Sne",
    "DispatchLandingV2",
    "WoitWizardModalV2",
    "ConfigureScreen",
    "Gne",
]:
    if boe.find(comp) >= 0:
        print("Boe uses", comp)
