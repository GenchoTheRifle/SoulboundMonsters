import re, os, glob

files = glob.glob('src/*.js') + glob.glob('src/*.css') + ['index.html']

referenced = set()

for f in files:
    with open(f, 'r') as fp:
        content = fp.read()
    # find all Art/...png or similar
    matches = re.findall(r'Art/[^"\']+', content)
    for m in matches:
        referenced.add(m)

missing = []
for m in referenced:
    if not os.path.exists(os.path.join('public', m)):
        missing.append(m)

print("Missing:")
for m in missing:
    print(m)

