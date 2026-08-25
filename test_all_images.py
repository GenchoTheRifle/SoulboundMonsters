import json, re, glob, os

files = glob.glob('src/*.js') + ['index.html']
content = ""
for f in files:
    with open(f, 'r') as fp:
        content += fp.read()

# get all literal Art/....png strings
matches = re.findall(r'Art/[a-zA-Z0-9_\-\s]+\.png', content)
matches = set(matches)
print("Literal matches:", len(matches))
for m in matches:
    if not os.path.exists(os.path.join('public', m)):
        print("MISSING:", m)

