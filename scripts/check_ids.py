import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

with open('static/index.html', 'r', encoding='utf-8') as f:
    html_code = f.read()

# Find all getElementById in JS
ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js_code)
unique_ids = set(ids)

missing = []
for el_id in unique_ids:
    if f'id="{el_id}"' not in html_code and f"id='{el_id}'" not in html_code:
        missing.append(el_id)

print(f"Total getElementById queries: {len(ids)} ({len(unique_ids)} unique)")
print(f"Missing IDs in HTML ({len(missing)}):")
for m in sorted(missing):
    print("  - ", m)
