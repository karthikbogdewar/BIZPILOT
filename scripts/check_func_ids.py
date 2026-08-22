import re

with open('static/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

with open('static/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

func_matches = list(re.finditer(r'(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', js))

for i, m in enumerate(func_matches):
    fn_name = m.group(1)
    pos = m.start()
    end_pos = func_matches[i+1].start() if i+1 < len(func_matches) else len(js)
    body = js[pos:end_pos]
    ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", body)
    for el_id in set(ids):
        if f'id="{el_id}"' not in html and f"id='{el_id}'" not in html:
            print(f"Function '{fn_name}' uses MISSING element id: '{el_id}'")
