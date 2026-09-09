#!/usr/bin/env python3
"""Deep extract Vision V1.3 HTML prototype inventory."""
import re
import json
from pathlib import Path

HTML = Path(r"C:/Users/MokshaVemula/Downloads/Vision_V1_3 (7).html").read_text(encoding="utf-8")

def extract_balanced(s, start_idx, open_c='[', close_c=']'):
    depth = 0
    i = start_idx
    while i < len(s):
        c = s[i]
        if c == open_c:
            depth += 1
        elif c == close_c:
            depth -= 1
            if depth == 0:
                return s[start_idx:i+1]
        elif c in '"\'':
            q = c
            i += 1
            while i < len(s):
                if s[i] == '\\':
                    i += 2
                    continue
                if s[i] == q:
                    break
                i += 1
        i += 1
    return None

def extract_object_from_key(text, key):
    m = re.search(rf'{re.escape(key)}=\{{', text)
    if not m:
        return None
    return extract_balanced(text, m.end()-1, '{', '}')

def parse_nav_tree(arr_text):
    if not arr_text:
        return []
    groups = []
    for gm in re.finditer(r'\{label:"([^"]+)",key:"([^"]+)",items:\[', arr_text):
        label, key = gm.group(1), gm.group(2)
        items_start = arr_text.index('items:[', gm.start()) + len('items:[') - 1
        items_arr = extract_balanced(arr_text, items_start)
        items = []
        for im in re.finditer(r'\{key:"([^"]+)"', items_arr or ''):
            items.append({'key': im.group(1)})
        for im in re.finditer(r's\("([^"]+)"\)', items_arr or ''):
            items.append({'key': im.group(1), 'via': 'catalogRef'})
        groups.append({'label': label, 'key': key, 'items': items})
    return groups

# --- Module catalog ---
catalog_obj = None
for marker in ['Qe={', ',Qe={', 'var Qe={', 'const Qe={']:
    idx = HTML.find(marker)
    if idx >= 0:
        catalog_obj = extract_balanced(HTML, idx + marker.index('{'), '{', '}')
        break
if not catalog_obj:
    m = re.search(r'(\{home:\{label:"Home")', HTML)
    if m:
        catalog_obj = extract_balanced(HTML, m.start(1), '{', '}')

modules = {}
if catalog_obj:
    for m in re.finditer(r'(\w+):\{label:"([^"]+)"', catalog_obj):
        key, label = m.group(1), m.group(2)
        start = m.start()
        next_m = re.search(r',\w+:\{label:"', catalog_obj[start+10:])
        end = start + 10 + next_m.start() if next_m else len(catalog_obj)-1
        chunk = catalog_obj[start:end]

        kind = re.search(r'kind:"([^"]+)"', chunk)
        data = re.search(r'data:"([^"]+)"', chunk)
        singular = re.search(r'singular:"([^"]+)"', chunk)
        list_style = re.search(r'listStyle:"([^"]+)"', chunk)
        default_sort = re.search(r'defaultSort:"([^"]+)"', chunk)
        merged = re.search(r'merged(?:Into|With):"([^"]+)"', chunk)
        cols = re.findall(r'\{k:"([^"]+)",label:"([^"]+)"', chunk)
        record_type_toggle = re.search(r'recordTypeToggle:\[([^\]]+)\]', chunk)
        rtt = re.findall(r'"([^"]+)"', record_type_toggle.group(1)) if record_type_toggle else []
        new_label = re.search(r'newLabel:"([^"]+)"', chunk)
        import_label = re.search(r'importLabel:"([^"]+)"', chunk)
        empty_title = re.search(r'emptyTitle:"([^"]+)"', chunk)
        empty_text = re.search(r'emptyText:"([^"]+)"', chunk)
        variants = []
        for vm in re.finditer(r'\{key:"([^"]+)",label:"([^"]+)"(?:,useModule:"([^"]+)")?\}', chunk):
            variants.append({'key': vm.group(1), 'label': vm.group(2), 'useModule': vm.group(3)})

        modules[key] = {
            'key': key, 'label': label,
            'kind': kind.group(1) if kind else None,
            'data': data.group(1) if data else None,
            'singular': singular.group(1) if singular else None,
            'global': 'global:!0' in chunk,
            'accountScoped': 'accountFilter:"account"' in chunk,
            'settingsOnly': 'settingsOnly:!0' in chunk,
            'hotTicketFilter': 'hotTicketFilter:!0' in chunk,
            'listStyle': list_style.group(1) if list_style else None,
            'defaultSort': default_sort.group(1) if default_sort else None,
            'mergedWith': merged.group(1) if merged else None,
            'cols': [{'k': k, 'label': l} for k, l in cols],
            'recordTypeToggle': rtt,
            'variants': variants,
            'newLabel': new_label.group(1) if new_label else None,
            'importLabel': import_label.group(1) if import_label else None,
            'emptyTitle': empty_title.group(1) if empty_title else None,
            'emptyText': empty_text.group(1) if empty_text else None,
        }

# --- p6 form schemas ---
p6_obj = extract_object_from_key(HTML, 'p6')
forms = {}
if p6_obj:
    for m in re.finditer(r'(\w+):\{title:"([^"]+)"', p6_obj):
        key, title = m.group(1), m.group(2)
        brace = p6_obj.index('{', m.start() + len(key))
        entry = extract_balanced(p6_obj, brace, '{', '}')
        sections = []
        for sm in re.finditer(r'\{title:"([^"]+)",cols:(\d+),fields:\[', entry or ''):
            fields_start = (entry or '').index('fields:[', sm.start()) + len('fields:[') - 1
            fields_arr = extract_balanced(entry or '', fields_start)
            fields = re.findall(r'C\("([^"]+)","([^"]+)","([^"]+)"', fields_arr or '')
            sections.append({
                'title': sm.group(1),
                'fields': [{'name': f[0], 'label': f[1], 'type': f[2]} for f in fields]
            })
        forms[key] = {'title': title, 'sections': sections}

# --- _oe nav ---
oe_full = None
om = re.search(r'function _oe\(', HTML)
if om:
    brace = HTML.index('{', om.end()-1)
    depth = 0
    i = brace
    while i < len(HTML):
        if HTML[i] == '{': depth += 1
        elif HTML[i] == '}':
            depth -= 1
            if depth == 0:
                oe_full = HTML[om.start():i+1]
                break
        elif HTML[i] in '"\'':
            q = HTML[i]; i += 1
            while i < len(HTML) and HTML[i] != q: i += 1
        i += 1

nav_trees = {}
if oe_full:
    rm = re.search(r'u==="rehrig"\?d=(\[[\s\S]*?\]):u==="customer"', oe_full)
    cm = re.search(r'u==="customer"\?d=(\[[\s\S]*?\]):d=', oe_full)
    sm = re.search(r':d=(\[[\s\S]*?\]);', oe_full)
    if rm: nav_trees['rehrig'] = parse_nav_tree(rm.group(1))
    if cm: nav_trees['customer'] = parse_nav_tree(cm.group(1))
    if sm: nav_trees['sp'] = parse_nav_tree(sm.group(1))

# uA / lA
ua_m = re.search(r'uA=\[([^\]]+)\]', HTML)
la_m = re.search(r'lA=\[([^\]]+)\]', HTML)
ua_keys = re.findall(r'"([^"]+)"', ua_m.group(1)) if ua_m else []
la_keys = re.findall(r'"([^"]+)"', la_m.group(1)) if la_m else []

def label_for(k):
    return modules.get(k, {}).get('label', k)

# Onboard screens
onboard = []
om2 = re.search(r'const VISION_ONBOARD_SCREEN_MODULES_V2=(\[)', HTML)
if om2:
    arr = extract_balanced(HTML, om2.start(1))
    for mod in re.finditer(r'\{module:"([^"]+)",screens:\[', arr):
        mod_name = mod.group(1)
        scr_start = arr.index('screens:[', mod.start()) + len('screens:[') - 1
        scr_arr = extract_balanced(arr, scr_start)
        screens = []
        for sm in re.finditer(r'\{name:"([^"]+)"(?:,fields:\[([^\]]*)\])?', scr_arr or ''):
            name = sm.group(1)
            fields = re.findall(r'"([^"]+)"', sm.group(2) or '')
            nl = name.lower()
            if any(x in nl for x in ['popup', 'modal', 'slide-over', 'picker', 'panel']):
                ptype = 'MODAL/DRAWER'
            elif 'stage' in nl:
                ptype = 'WIZARD_STEP'
            else:
                ptype = 'PAGE'
            screens.append({'name': name, 'type': ptype, 'fields': fields})
        onboard.append({'module': mod_name, 'screens': screens})

# Profile modules V2
profile_modules = []
pm = re.search(r'const VISION_SCREEN_MODULES_V2=(\[)', HTML)
if pm:
    arr = extract_balanced(HTML, pm.start(1))
    for mod in re.finditer(r'\{module:"([^"]+)",screens:\[', arr):
        mod_name = mod.group(1)
        scr_start = arr.index('screens:[', mod.start()) + len('screens:[') - 1
        scr_arr = extract_balanced(arr, scr_start)
        screens = []
        for sm in re.finditer(r'\{id:"([^"]+)",name:"([^"]+)"(?:,fields:\[([^\]]*)\])?', scr_arr or ''):
            fields = re.findall(r'"([^"]+)"', sm.group(3) or '')
            screens.append({'id': sm.group(1), 'name': sm.group(2), 'fields': fields})
        profile_modules.append({'module': mod_name, 'screens': screens})

out = {
    'module_catalog': modules,
    'form_schemas_p6': forms,
    'nav_trees_by_persona': nav_trees,
    'account_scoped_rails': {
        'uA_upper': [{'key': k, 'label': label_for(k)} for k in ua_keys],
        'lA_lower': [{'key': k, 'label': label_for(k)} for k in la_keys],
    },
    'onboard_screens': onboard,
    'profile_permission_modules': profile_modules,
    'setup_sections': sorted(set(re.findall(r'setupSection:"([^"]+)"', HTML))),
}

Path(r"C:/Users/MokshaVemula/Pictures/vision-app/vision_deep_inventory.json").write_text(
    json.dumps(out, indent=2), encoding='utf-8')

print(f"Catalog modules: {len(modules)}")
print(f"Form schemas: {len(forms)}")
print(f"Personas: {list(nav_trees.keys())}")
print(f"Forms keys: {list(forms.keys())[:20]}")
