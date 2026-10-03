#!/usr/bin/env bash
set -euo pipefail
export SSL_CERT_FILE="${SSL_CERT_FILE:-/home/jkaminsk/ca-bundle-plus-zscaler.crt}"
GCM="/home/jkaminsk/bin/gcm.exe"
mapfile -t lines < <("$GCM" get <<EOF
protocol=https
host=github.com
EOF
)
TOKEN=""
for line in "${lines[@]}"; do
  case "$line" in password=*) TOKEN="${line#password=}" ;; esac
done
python3 <<PY
import json, os, urllib.request
token = """$TOKEN"""
req = lambda url: json.load(urllib.request.urlopen(urllib.request.Request(
    url, headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json", "User-Agent": "ha-katon-diagnose"}
)))
user = req("https://api.github.com/user")
print("authenticated_as:", user.get("login"))
print("token_scopes_header: see curl -I if needed")
repo = req("https://api.github.com/repos/NightfallHT/ha-katon")
print("repo_owner:", repo.get("owner", {}).get("login"), repo.get("owner", {}).get("type"))
print("permissions:", repo.get("permissions"))
# SSO organizations requiring authorization
try:
    orgs = req("https://api.github.com/user/orgs")
    for org in orgs[:5]:
        print("org:", org.get("login"))
except Exception as exc:
    print("orgs:", exc)
PY
