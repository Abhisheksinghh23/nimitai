import json
import urllib.parse
import urllib.request
from pathlib import Path

env = {}
for line in Path('.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k] = v
key = env['GEMINI_API_KEY']
models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash']

for model in models:
    data = json.dumps({
        'contents': [{'role': 'user', 'parts': [{'text': 'Reply only JSON {"ok":true}'}]}],
        'generationConfig': {'temperature': 0}
    }).encode()
    url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + urllib.parse.quote_plus(key)
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            text = r.read().decode('utf-8')
            print('MODEL', model, 'STATUS', r.status)
            print(text[:1000])
    except Exception as e:
        print('MODEL', model, 'ERR', type(e).__name__, e)
