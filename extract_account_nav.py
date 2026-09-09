import re, json
from pathlib import Path
HTML = Path(r"C:/Users/MokshaVemula/Downloads/Vision_V1_3 (7).html").read_text('utf-8')

# Find account sidebar - search m6 or uA usage
for term in ['m6.map', 'uA.map', 'lA.map', 'accountModule', 'AccountSidebar', 'function $e', 'function Pe', 'function Ne']:
    idx = HTML.find(term)
    print(f'{term}: {idx}')
    if idx >= 0:
        print(HTML[idx:idx+2000])
        print('---')

# empty states in catalog
for m in re.finditer(r'empty(?:Title|Text|Subtitle):"([^"]+)"', HTML):
    ctx = HTML[max(0,m.start()-80):m.start()]
    key_m = re.search(r'(\w+):\{label:"', ctx[::-1])
    print('EMPTY:', m.group(1), '| near:', ctx[-60:])

# newLabel importLabel
for m in re.finditer(r'(newLabel|importLabel|massUploadLabel):"([^"]+)"', HTML):
    print(m.group(1), m.group(2))

# n6 nav label overrides
nm = re.search(r'n6=\{([^}]+(?:\{[^}]*\}[^}]*)*)\}', HTML)
if nm:
    print('n6:', nm.group(0)[:2000])

# search account view sidebar
idx = HTML.find('m6=uA')
print('\nm6 context:', HTML[idx:idx+5000][:5000])
