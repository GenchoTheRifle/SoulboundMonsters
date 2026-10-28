import re, os, glob

files = glob.glob('src/*.js')
referenced = set()

for f in files:
    with open(f, 'r') as fp:
        content = fp.read()
    # Find things like "Art/Maul_1.png"
    matches = re.findall(r'Art/[A-Za-z0-9_\- ]+\.png', content)
    for m in matches:
        referenced.add(m)

missing = []
for m in referenced:
    if not os.path.exists(os.path.join('public', m)):
        missing.append(m)

if missing:
    print("Missing art in JS:")
    for m in missing:
        print(m)
else:
    print("All art in JS exists in public/Art/")
