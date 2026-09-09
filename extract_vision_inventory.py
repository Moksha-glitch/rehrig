#!/usr/bin/env python3
"""Extract screen inventory from Vision V1.3 HTML prototype."""
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

def parse_nav_items(arr_text):
    items = []
    for m in re.finditer(r'\{([^}]+)\}', arr_text):
        chunk = m.group(1)
        k = re.search(r'k:"([^"]+)"', chunk)
        label = re.search(r'label:"([^"]+)"', chunk)
        icon = re.search(r'icon:"([^"]+)"', chunk)
        children = re.search(r'children:\[', chunk)
        item = {
            'k': k.group(1) if k else None,
            'label': label.group(1) if label else None,
            'icon': icon.group(1) if icon else None,
            'has_children': bool(children),
        }
        if children:
            child_start = chunk.index('children:[') + len('children:[') - 1
            child_arr = extract_balanced(chunk, child_start)
            if child_arr:
                item['children'] = parse_nav_items(child_arr)
        items.append(item)
    return items

results = {}

# VISION_SCREEN_MODULES_V2
m = re.search(r'const VISION_SCREEN_MODULES_V2=(\[)', HTML)
if m:
    arr = extract_balanced(HTML, m.start(1))
    # crude parse screens
    modules = []
    for mod in re.finditer(r'\{module:"([^"]+)",screens:\[', arr):
        mod_name = mod.group(1)
        scr_start = arr.index('screens:[', mod.start()) + len('screens:[') - 1
        scr_arr = extract_balanced(arr, scr_start)
        screens = []
        for sm in re.finditer(r'\{id:"([^"]+)",name:"([^"]+)"(?:,fields:\[([^\]]*)\])?', scr_arr or ''):
            fields_raw = sm.group(3)
            fields = re.findall(r'"([^"]+)"', fields_raw) if fields_raw else []
            screens.append({'id': sm.group(1), 'name': sm.group(2), 'fields': fields})
        modules.append({'module': mod_name, 'screens': screens})
    results['VISION_SCREEN_MODULES_V2'] = modules

# VISION_ONBOARD_SCREEN_MODULES_V2
m = re.search(r'const VISION_ONBOARD_SCREEN_MODULES_V2=(\[)', HTML)
if m:
    arr = extract_balanced(HTML, m.start(1))
    modules = []
    for mod in re.finditer(r'\{module:"([^"]+)",screens:\[', arr):
        mod_name = mod.group(1)
        scr_start = arr.index('screens:[', mod.start()) + len('screens:[') - 1
        scr_arr = extract_balanced(arr, scr_start)
        screens = []
        for sm in re.finditer(r'\{name:"([^"]+)"(?:,fields:\[([^\]]*)\])?', scr_arr or ''):
            fields_raw = sm.group(2)
            fields = re.findall(r'"([^"]+)"', fields_raw) if fields_raw else []
            screens.append({'name': sm.group(1), 'fields': fields})
        modules.append({'module': mod_name, 'screens': screens})
    results['VISION_ONBOARD_SCREEN_MODULES_V2'] = modules

# uA and lA
for name in ['uA', 'lA']:
    m = re.search(rf'{name}=\[', HTML)
    if m:
        arr = extract_balanced(HTML, m.end()-1)
        results[name] = parse_nav_items(arr) if arr else []

# _oe function - find nav trees by persona
m = re.search(r'function _oe\(', HTML)
if m:
    # grab until next function at top level (rough)
    chunk = HTML[m.start():m.start()+12000]
    results['_oe_snippet'] = chunk[:8000]

# Qe module catalog - search variations
for pat in [r'Qe=\[', r'const Qe=\[', r'var Qe=\[', r'let Qe=\[']:
    m = re.search(pat, HTML)
    if m:
        arr = extract_balanced(HTML, m.end()-1)
        results['Qe'] = parse_nav_items(arr) if arr else arr[:3000] if arr else None
        break

# cols definitions
cols_defs = []
for m in re.finditer(r'cols:\[(\{k:"[^"]+",l:"[^"]+"\}(?:,\{k:"[^"]+",l:"[^"]+"\})*)\]', HTML):
    cols = re.findall(r'\{k:"([^"]+)",l:"([^"]+)"\}', m.group(1))
    # get context - look back 200 chars for screen key
    ctx = HTML[max(0,m.start()-300):m.start()]
    key_m = re.search(r'(?:screen|page|view|id):"([^"]+)"', ctx)
    label_m = re.search(r'(?:title|label|name):"([^"]+)"', ctx[::-1])  # rough
    cols_defs.append({
        'context': ctx[-120:],
        'cols': [{'k': k, 'l': l} for k, l in cols]
    })
results['cols_defs'] = cols_defs

# List screen configs with more context - search for patterns like {key:"accounts"
list_configs = []
for m in re.finditer(r'\{key:"([^"]+)",title:"([^"]+)"[^}]{0,500}?cols:\[', HTML):
    key, title = m.group(1), m.group(2)
    rest = HTML[m.end()-6:]
    arr = extract_balanced(rest, rest.index('['))
    cols = re.findall(r'\{k:"([^"]+)",l:"([^"]+)"\}', arr or '')
    list_configs.append({'key': key, 'title': title, 'cols': cols})
results['list_configs'] = list_configs

# empty states
empty_states = list(set(re.findall(r'empty(?:Title|Text|Message)?:"([^"]{5,120})"', HTML)))
results['empty_states'] = empty_states

# toolbar actions
toolbar = list(set(re.findall(r'(?:toolbarAction|actionLabel|btnLabel):"([^"]+)"', HTML)))
results['toolbar_labels'] = toolbar

# persona nav - search rehrig/sp/customer patterns
persona_patterns = {}
for persona in ['rehrig', 'sp', 'customer', 'segment']:
    for m in re.finditer(rf'persona==="{persona}"[^;{{}}]{{0,2000}}', HTML):
        persona_patterns.setdefault(persona, []).append(m.group(0)[:500])
results['persona_snippets'] = {k: v[:3] for k, v in persona_patterns.items()}

# Search for global nav definitions
for pat_name, pat in [
    ('GLOBAL_NAV', r'GLOBAL_NAV[^=]*=\['),
    ('NAV_TREE', r'NAV_TREE[^=]*=\['),
    ('rehrigNav', r'rehrigNav[^=]*=\['),
    ('spNav', r'spNav[^=]*=\['),
    ('customerNav', r'customerNav[^=]*=\['),
]:
    m = re.search(pat, HTML)
    if m:
        arr = extract_balanced(HTML, m.end()-1)
        if arr and len(arr) < 50000:
            results[pat_name] = parse_nav_items(arr)

# Page titles in routing
page_titles = {}
for m in re.finditer(r'case"([^"]+)":[^;]{0,80}?title:"([^"]+)"', HTML):
    page_titles[m.group(1)] = m.group(2)
results['page_titles'] = page_titles

# VisionListPage or similar
for m in re.finditer(r'function \w+\(\{[^}]*title:"([^"]+)"[^}]*cols:\[(\{k:"[^"]+",l:"[^"]+"\}(?:,\{k:"[^"]+",l:"[^"]+"\})*)\]', HTML):
    cols = re.findall(r'\{k:"([^"]+)",l:"([^"]+)"\}', m.group(2))
    results.setdefault('list_pages', []).append({'title': m.group(1), 'cols': cols})

# Search label:" for module catalog entries near k:
module_catalog = []
for m in re.finditer(r'\{k:"([^"]+)",label:"([^"]+)"(?:,icon:"([^"]+)")?', HTML):
    module_catalog.append({'k': m.group(1), 'label': m.group(2), 'icon': m.group(3)})
# dedupe by k
seen = set()
deduped = []
for item in module_catalog:
    if item['k'] not in seen:
        seen.add(item['k'])
        deduped.append(item)
results['module_catalog'] = deduped

# Form sections - search section:" patterns
sections = list(set(re.findall(r'section:"([^"]+)"', HTML)))
results['form_sections'] = sorted(sections)

# ye label form fields
form_fields = re.findall(r'ye,\{label:"([^"]+)"', HTML)
results['form_field_labels'] = sorted(set(form_fields))

# Extended pattern search
terms = ['uA=[', 'lA=[', 'function _oe(', 'Qe=[', 'cols:[{k:', 'emptyTitle:', 'emptyText:', 'getPersona', 'persona==="rehrig"', 'persona==="sp"', 'persona==="customer"']
results['term_locations'] = {}
for term in terms:
    idx = HTML.find(term)
    results['term_locations'][term] = idx
    if idx >= 0:
        results[f'snippet_{term.replace("=","").replace("[","").replace('"','').replace("(","")}'] = HTML[idx:idx+4000]

# All cols patterns (k/l or k/label)
all_cols = []
for m in re.finditer(r'cols:\[([^\]]{10,3000}?)\]', HTML):
    chunk = m.group(1)
    cols_kl = re.findall(r'\{k:"([^"]+)",l:"([^"]+)"\}', chunk)
    cols_klabel = re.findall(r'\{k:"([^"]+)",label:"([^"]+)"\}', chunk)
    cols = cols_kl or cols_klabel
    if cols:
        ctx = HTML[max(0, m.start()-400):m.start()]
        all_cols.append({'context_tail': ctx[-200:], 'cols': cols})
results['all_cols'] = all_cols

# _oe full function
m = re.search(r'function _oe\([^)]*\)\{', HTML)
if m:
    # find matching brace
    start = m.start()
    brace = HTML.index('{', m.end()-1)
    depth = 0
    i = brace
    while i < len(HTML):
        if HTML[i] == '{': depth += 1
        elif HTML[i] == '}':
            depth -= 1
            if depth == 0:
                results['_oe_full'] = HTML[start:i+1]
                break
        elif HTML[i] in '"\'':
            q = HTML[i]; i += 1
            while i < len(HTML):
                if HTML[i] == '\\': i += 2; continue
                if HTML[i] == q: break
                i += 1
        i += 1

# Extract nav from _oe if found
if '_oe_full' in results:
    oe = results['_oe_full']
    for nav_name in re.findall(r'(\w+)=\[', oe):
        if nav_name in ('uA', 'lA', 'rA', 'sA', 'cA'):
            m2 = re.search(rf'{nav_name}=\[', oe)
            if m2:
                arr = extract_balanced(oe, m2.end()-1)
                results[nav_name] = parse_nav_items(arr) if arr else []

# List page definitions - search for title + cols nearby
list_pages = []
for m in re.finditer(r'title:"([^"]+)"', HTML):
    title = m.group(1)
    window = HTML[m.end():m.end()+800]
    cm = re.search(r'cols:\[([^\]]+)\]', window)
    if cm:
        cols = re.findall(r'\{k:"([^"]+)",(?:l|label):"([^"]+)"\}', cm.group(1))
        if cols:
            list_pages.append({'title': title, 'cols': cols})
results['list_pages_by_title'] = list_pages

# Toolbar / actions
actions = sorted(set(re.findall(r'"(New [^"]{3,40}|Import[^"]{0,30}|Export[^"]{0,30}|Mass Upload[^"]{0,30}|Filter[^"]{0,20})"', HTML)))
results['action_strings'] = actions[:80]

# Empty state strings
empty = sorted(set(re.findall(r'(?:empty(?:Title|Text|Message|Subtitle)|noResults(?:Title|Text)):"([^"]+)"', HTML)))
results['empty_states'] = empty

# Form sections in detail views
form_sections_detail = []
for m in re.finditer(r'(?:sectionTitle|groupTitle|sectionLabel):"([^"]+)"', HTML):
    form_sections_detail.append(m.group(1))
results['form_section_titles'] = sorted(set(form_sections_detail))

# ye,{label patterns
results['ye_labels'] = sorted(set(re.findall(r'ye,\{label:"([^"]+)"', HTML)))

# ue,{label for read-only detail fields  
results['ue_labels'] = sorted(set(re.findall(r'ue,\{label:"([^"]+)"', HTML)))

out = Path(r"C:/Users/MokshaVemula/Pictures/vision-app/vision_inventory_extract.json")
out.write_text(json.dumps(results, indent=2), encoding='utf-8')
print(f"Wrote {out}")
print(f"Modules V2: {len(results.get('VISION_SCREEN_MODULES_V2', []))}")
print(f"Onboard modules: {len(results.get('VISION_ONBOARD_SCREEN_MODULES_V2', []))}")
print(f"Module catalog items: {len(results.get('module_catalog', []))}")
print(f"All cols: {len(results.get('all_cols', []))}")
print(f"List pages by title: {len(results.get('list_pages_by_title', []))}")
print(f"uA items: {len(results.get('uA', []))}")
print(f"lA items: {len(results.get('lA', []))}")
print(f"Term locations: {results.get('term_locations')}")
