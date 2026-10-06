import json, os, glob, re

# Get all files in public/Art/
art_files = os.listdir('public/Art')
art_files_lower = {f.lower(): f for f in art_files}

# check public/data.json
with open('public/data.json', 'r') as f:
    data = json.load(f)

for k, v in data.get('STARTERS', {}).items():
    art = v.get('art')
    if art:
        basename = os.path.basename(art)
        if basename not in art_files and basename.lower() in art_files_lower:
            print(f"Case mismatch in public/data.json: {art} should be {art_files_lower[basename.lower()]}")

# check src/*.js
js_files = glob.glob('src/*.js')
for f in js_files:
    with open(f, 'r') as fp:
        content = fp.read()
    matches = re.findall(r'Art/([A-Za-z0-9_\-\s]+)\.png', content)
    for m in matches:
        basename = m + '.png'
        if basename not in art_files and basename.lower() in art_files_lower:
            print(f"Case mismatch in JS {f}: {basename} should be {art_files_lower[basename.lower()]}")

