#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export SSL_CERT_FILE="${SSL_CERT_FILE:-/home/jkaminsk/ca-bundle-plus-zscaler.crt}"
export REQUESTS_CA_BUNDLE="$SSL_CERT_FILE"
GCM="${GCM:-$HOME/bin/gcm.exe}"
mapfile -t lines < <("$GCM" get <<EOF
protocol=https
host=github.com
EOF
)
TOKEN=""
for line in "${lines[@]}"; do
  case "$line" in password=*) TOKEN="${line#password=}" ;; esac
done
if [[ -z "$TOKEN" ]]; then
  echo "Brak tokenu GitHub w Git Credential Manager."
  exit 1
fi
export GITHUB_TOKEN="$TOKEN"
python3 scripts/push-via-github-api.py
