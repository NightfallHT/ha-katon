#!/usr/bin/env bash
set -euo pipefail
export SSL_CERT_FILE="${SSL_CERT_FILE:-/home/jkaminsk/ca-bundle-plus-zscaler.crt}"
GCM="/home/jkaminsk/bin/gcm.exe"
mapfile -t lines < <("$GCM" get <<EOF
protocol=https
host=github.com
EOF
)
USER=""
TOKEN=""
for line in "${lines[@]}"; do
  case "$line" in
    username=*) USER="${line#username=}" ;;
    password=*) TOKEN="${line#password=}" ;;
  esac
done
if [[ -z "$TOKEN" ]]; then
  echo "NO_TOKEN"
  exit 1
fi
echo "user=$USER"
curl -sS --cacert "$SSL_CERT_FILE" -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/NightfallHT/ha-katon" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('message:', d.get('message')); p=d.get('permissions'); print('permissions:', p if p else 'none')"
curl -sS --cacert "$SSL_CERT_FILE" -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/NightfallHT/ha-katon/branches/main/protection" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('branch_protection:', d.get('message', 'enabled' if d else 'none'))"
