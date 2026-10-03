# Git push a Zscaler (403) — diagnoza i obejście

## Co się dzieje

- **`git fetch` / `git pull` działają**, a **`git push` kończy się HTTP 403**.
- W logu (`GIT_CURL_VERBOSE=1 git push`) widać **`server: Zscaler/6.2`** i odpowiedź **HTML**, nie JSON od GitHuba.
- To **nie** jest brak uprawnień do repo: konto `jasi306` ma `push: true` na `NightfallHT/ha-katon` (REST API zwraca 200).
- Zscaler **blokuje POST** na `…/git-receive-pack` (wysyłanie packfile), podczas gdy zwykłe API GitHub (`api.github.com`) przechodzi.

## Szybka weryfikacja (WSL)

```bash
bash scripts/probe-zscaler-github.sh
```

- `git-receive-pack` → `http_code=403` + HTML = push zablokowany przez proxy.
- `GitHub REST` → `http_code=200` = logowanie OK.

## Co zrobić (wybierz jedno)

1. **Wyłącz Zscalera** (VPN firmowy) na 2–5 minut, potem:
   ```bash
   cd /mnt/c/trash/HackYeah/ha-katon   # lub ścieżka Windows
   git fetch origin
   git pull --rebase origin main
   git push origin main
   ```
2. **Hotspot z telefonu** (bez firmowego proxy) — ten sam zestaw poleceń.
3. **Poproś IT** o wyjątek dla `github.com` / `git-receive-pack` (push), nie tylko przeglądarki.
4. **Push z maszyny bez Zscalera** (dom, inny laptop) — sklonuj repo, `git pull`, wklej brakujący commit albo cherry-pick.

Po wyłączeniu Zscalera warto zrestartować WSL: `wsl --shutdown`, potem ponownie otwórz terminal.

## Certyfikaty (osobny problem)

Gdy Zscaler jest włączony, WSL potrzebuje bundle CA (już skonfigurowane u Janka):

```bash
git config --global http.sslCAInfo /home/jkaminsk/ca-bundle-plus-zscaler.crt
git config --global credential.helper /home/jkaminsk/bin/gcm.exe
```

Szczegóły: [`docs/KLUCZE.md`](KLUCZE.md) i skrypt `setup-wsl-git.sh` w katalogu nadrzędnym workspace.

## Token / logowanie GitHub

- Credential helper: **Git Credential Manager** (`~/bin/gcm.exe` → Windows GCM).
- Zalogowane konto: **`jasi306`** (OAuth `gho_…` w menedżerze haseł Windows).
- **Nie trzeba** nowego tokena, jeśli probe REST daje 200 i `permissions.push: true`.
- Jeśli kiedyś zmienisz konto na **`NightfallHT`**, w Windows: *Panel sterowania → Menedżer poświadczeń → Poświadczenia Windows → git:https://github.com* → usuń wpis, potem `git push` i zaloguj się ponownie.

## Dla agentów AI

Jeśli użytkownik prosi o push i dostajesz **403 + Zscaler** w verbose logu:

1. Uruchom `scripts/probe-zscaler-github.sh`.
2. Wyjaśnij, że to **proxy**, nie GitHub.
3. Zaproponuj wyłączenie Zscalera / hotspot i ponowny `git pull --rebase && git push`.
4. **Nie** proś o wklejanie PAT na czat — wystarczy GCM albo wyłączenie proxy.
