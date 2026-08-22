import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

with open('static/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

matches = re.findall(r"document\.getElementById\(['\"]([^'\"]+)['\"]\)\.([a-zA-Z]+)", js)
missing_direct_calls = []
for el_id, prop in matches:
    if f'id="{el_id}"' not in html and f"id='{el_id}'" not in html:
        missing_direct_calls.append((el_id, prop))

print("Direct un-guarded property accesses on missing elements:")
for m in set(missing_direct_calls):
    print("  - ", m)
