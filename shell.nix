{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  name = "ha-katon";

  packages = [
    pkgs.nodejs # 24.x — runs /web (Next.js), /tests (Playwright) and scripts/seed.ts
    pkgs.python311 # for /ai (FastAPI) — Janek
    pkgs.supabase-cli # supabase link / db push
  ];

  # Playwright ships prebuilt browser binaries that cannot run on NixOS.
  # Use the ones from nixpkgs instead and skip the npm postinstall download.
  PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";

  shellHook = ''
    echo "ha-katon dev shell — node $(node -v), npm $(npm -v), python $(python3 --version | cut -d' ' -f2)"
  '';
}
