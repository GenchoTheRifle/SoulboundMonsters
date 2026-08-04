import json, os

with open('data.json', 'r') as f:
    data = json.load(f)

missing = []

for k, v in data.get('STARTERS', {}).items():
    art = v.get('art')
    if art and art.startswith('Art/'):
        if not os.path.exists(os.path.join('public', art)):
            missing.append(art)
    for m in v.get('moves', []):
        if 'art' in m and m['art'].startswith('Art/'):
            if not os.path.exists(os.path.join('public', m['art'])):
                missing.append(m['art'])

for v in data.get('MERGES', []):
    art = v.get('art')
    if art and art.startswith('Art/'):
        if not os.path.exists(os.path.join('public', art)):
            missing.append(art)
    for m in v.get('moves', []):
        if 'art' in m and m['art'].startswith('Art/'):
            if not os.path.exists(os.path.join('public', m['art'])):
                missing.append(m['art'])

for k, v in data.get('BOSSES', {}).items():
    art = v.get('art')
    if art and art.startswith('Art/'):
        if not os.path.exists(os.path.join('public', art)):
            missing.append(art)
    for m in v.get('moves', []):
        if 'art' in m and m['art'].startswith('Art/'):
            if not os.path.exists(os.path.join('public', m['art'])):
                missing.append(m['art'])

if missing:
    print("Missing art:")
    for m in set(missing):
        print(m)
else:
    print("All art in data.json exists in public/Art/")
