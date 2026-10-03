#!/usr/bin/env python3
import json, os, ssl, urllib.request
token = os.environ["GITHUB_TOKEN"]
req = urllib.request.Request(
    "https://api.github.com/repos/NightfallHT/ha-katon/git/ref/heads/main",
    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "User-Agent": "ha-katon"},
)
with urllib.request.urlopen(req, context=ssl.create_default_context(), timeout=30) as response:
    data = json.load(response)
print(data["object"]["sha"])
