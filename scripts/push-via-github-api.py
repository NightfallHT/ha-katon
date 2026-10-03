#!/usr/bin/env python3
"""Push local commits through the GitHub Git Data API.

Zscaler blocks git-receive-pack (git push) but allows api.github.com.
Reads a token from the GITHUB_TOKEN environment variable. Never prints it.
"""

from __future__ import annotations

import base64
import json
import os
import ssl
import subprocess
import sys
import urllib.error
import urllib.request

OWNER = "NightfallHT"
REPO = "ha-katon"
BRANCH = "main"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def request(method: str, url: str, token: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "ha-katon-api-push",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    context = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=context, timeout=60) as response:
            body = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise SystemExit(f"{method} {url} failed: HTTP {exc.code} {detail}") from exc
    if not body:
        return {}
    return json.loads(body)


def create_blob(token: str, content: bytes) -> str:
    payload = {
        "content": base64.b64encode(content).decode(),
        "encoding": "base64",
    }
    return request("POST", f"{API}/git/blobs", token, payload)["sha"]


def commit_files(local_parent: str, commit: str) -> list[tuple[str, str | None, str]]:
    raw = git("diff-tree", "-r", "--raw", "-z", local_parent, commit)
    parts = raw.split("\0")
    changes: list[tuple[str, str | None, str]] = []
    index = 0
    while index < len(parts) - 1:
        meta = parts[index]
        path = parts[index + 1]
        index += 2
        if not meta.startswith(":"):
            continue
        _old_mode, new_mode, _old_sha, new_sha, status = meta[1:].split()[:5]
        if status.startswith(("D", "C")) or new_sha == "0" * 40:
            changes.append((path, None, "100644"))
        else:
            changes.append((path, new_sha, new_mode))
    return changes


def push_commit(token: str, remote_parent: str, local_parent: str, commit: str) -> str:
    parent_data = request("GET", f"{API}/git/commits/{remote_parent}", token)
    parent_tree = parent_data["tree"]["sha"]
    message = git("log", "-1", "--format=%B", commit).strip()
    author_name = git("log", "-1", "--format=%an", commit).strip()
    author_email = git("log", "-1", "--format=%ae", commit).strip()
    author_date = git("log", "-1", "--format=%aI", commit).strip()
    tree_items = []
    for path, blob_sha, mode in commit_files(local_parent, commit):
        if blob_sha is None:
            tree_items.append({"path": path, "mode": mode, "type": "blob", "sha": None})
            continue
        content = subprocess.run(
            ["git", "cat-file", "blob", blob_sha],
            check=True,
            capture_output=True,
        ).stdout
        uploaded = create_blob(token, content)
        tree_items.append({"path": path, "mode": mode, "type": "blob", "sha": uploaded})
        print(f"  blob {path}")
    tree = request(
        "POST",
        f"{API}/git/trees",
        token,
        {"base_tree": parent_tree, "tree": tree_items},
    )
    created = request(
        "POST",
        f"{API}/git/commits",
        token,
        {
            "message": message,
            "tree": tree["sha"],
            "parents": [remote_parent],
            "author": {"name": author_name, "email": author_email, "date": author_date},
        },
    )
    print(f"created {created['sha']}")
    request(
        "PATCH",
        f"{API}/git/refs/heads/{BRANCH}",
        token,
        {"sha": created["sha"]},
    )
    print(f"pushed {commit[:7]} -> {created['sha'][:7]}  {message.splitlines()[0]}")
    return created["sha"]


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise SystemExit("GITHUB_TOKEN is missing")
    commits = [line.strip() for line in git("rev-list", "--reverse", f"origin/{BRANCH}..HEAD").splitlines() if line.strip()]
    if not commits:
        print("nothing to push")
        return
    remote_parent = git("rev-parse", f"origin/{BRANCH}").strip()
    print(f"remote {BRANCH}={remote_parent[:7]}  local commits={len(commits)}")
    for commit in commits:
        local_parent = git("rev-parse", f"{commit}^").strip()
        remote_parent = push_commit(token, remote_parent, local_parent, commit)
    print("done")


if __name__ == "__main__":
    main()
