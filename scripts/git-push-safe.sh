#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export SSL_CERT_FILE="${SSL_CERT_FILE:-/home/jkaminsk/ca-bundle-plus-zscaler.crt}"
git config http.sslCAInfo "$SSL_CERT_FILE" 2>/dev/null || true
if [[ -f scripts/probe-zscaler-github.sh ]]; then
  probe_out="$(bash scripts/probe-zscaler-github.sh 2>&1 || true)"
  if echo "$probe_out" | grep -q 'http_code=403'; then
    echo "$probe_out" | head -4
    echo "PUSH ZABLOKOWANY przez Zscaler (git-receive-pack 403)."
    echo "Wyłącz VPN/Zscaler lub użyj hotspotu, potem uruchom ponownie:"
    echo "  git fetch origin && git pull --rebase origin main && git push origin main"
    echo "Szczegóły: docs/GIT-PUSH-ZSCALER.md"
    exit 2
  fi
fi
git fetch origin
git pull --rebase origin main
git push origin main
echo "Push OK."
