import json
d = json.load(open(r"C:/Users/MokshaVemula/Pictures/vision-app/vision_deep_inventory.json"))

print("=== LIST MODULES ===")
for k, v in sorted(d["module_catalog"].items()):
    if v.get("kind") == "list":
        cols = [c["label"] for c in v["cols"]]
        print(f"{k}|{v['label']}|cols={cols}|toggles={v.get('recordTypeToggle')}|new={v.get('newLabel')}|import={v.get('importLabel')}|empty={v.get('emptyTitle')}|hot={v.get('hotTicketFilter')}|style={v.get('listStyle')}|global={v.get('global')}|account={v.get('accountScoped')}|settings={v.get('settingsOnly')}")

print("\n=== NON-LIST MODULES ===")
for k, v in sorted(d["module_catalog"].items()):
    if v.get("kind") != "list":
        print(f"{k}|{v['label']}|kind={v.get('kind')}|global={v.get('global')}")

print("\n=== FORMS ===")
for k, form in d["form_schemas_p6"].items():
    print(f"\n## {k}: {form['title']}")
    for sec in form["sections"]:
        print(f"  [{sec['title']}]")
        for f in sec["fields"]:
            print(f"    - {f['label']} ({f['type']})")
