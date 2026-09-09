import re
from pathlib import Path
HTML = Path(r"C:/Users/MokshaVemula/Downloads/Vision_V1_3 (7).html").read_text('utf-8')

# Find list page component - search for hotTicketFilter usage and New singular
for term in ['hotTicketFilter', 'recordTypeToggle', 'No records', 'no records', 'Get started', 'Create your first', 'Nothing here', 'emptyMsg', 'listEmpty']:
    idx = HTML.find(term)
    print(f'{term}: {idx}')
    if idx >= 0:
        print(HTML[idx-200:idx+400])
        print('---')

# Extract configure modules with newLabel
for m in re.finditer(r'(\w+):\{label:"([^"]+)"[^}]*newLabel:"([^"]+)"', HTML):
    print('CONFIGURE NEW:', m.group(1), m.group(2), m.group(3))

# tips variants
idx = HTML.find('variants:[{key:"individual"')
if idx >= 0:
    print('\nTIPS MODULE:', HTML[idx-300:idx+600])

# account rail uA rendering
idx = HTML.find('m6.map')
if idx < 0:
    idx = HTML.find('uA.filter') 
if idx < 0:
    # search for upper account modules
    idx = HTML.find('m6=')
print('\nAccount upper rail context:', HTML[idx:idx+3000][:3000] if idx>=0 else 'not found')

# Extract function for account sidebar - search "All accounts"
idx = HTML.find('All accounts')
print('\nAccount sidebar:', HTML[idx-500:idx+4000][:4500])
