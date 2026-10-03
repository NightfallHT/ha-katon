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
echo "=== git-receive-pack probe (expect Zscaler 403 if blocked) ==="
curl -sS --cacert "$SSL_CERT_FILE" -o /tmp/receive-probe.out -w "http_code=%{http_code}\n" \
  -X POST -u "jasi306:$TOKEN" \
  -H "Content-Type: application/x-git-receive-pack-request" \
  -H "Accept: application/x-git-receive-pack-result" \
  --data-binary @/dev/null \
  "https://github.com/NightfallHT/ha-katon.git/git-receive-pack" | head -1
head -c 120 /tmp/receive-probe.out | tr '\n' ' '
echo
echo "=== GitHub REST probe ==="
curl -sS --cacert "$SSL_CERT_FILE" -o /tmp/api-probe.out -w "http_code=%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/user" | head -1
python3 -c "import json; print('login', json.load(open('/tmp/api-probe.out'))['login'])"
