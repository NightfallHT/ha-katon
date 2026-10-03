"""DEMO_MODE cache. Exact demo-story inputs return instantly."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

from util import AI_ROOT

_TEXT_FIELDS = {
    "/match": "query",
    "/simplify": "text",
    "/chat": "message",
    "/kreator/assist": "message",
    "/middleman/chat": "message",
    "/admin/enrich": "text",
}


def enabled() -> bool:
    return os.getenv("DEMO_MODE", "0").strip().lower() in {"1", "true", "yes"}


@lru_cache(maxsize=1)
def _cache() -> dict[str, Any]:
    path = AI_ROOT / "demo_cache.json"
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {}
    return data


def lookup(route: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    if not enabled():
        return None
    cache = _cache()
    exact = cache.get("exact", {}).get(route, {})
    key = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    if isinstance(exact, dict) and key in exact:
        return exact[key]
    field = _TEXT_FIELDS.get(route)
    if field:
        text = str(payload.get(field) or "").strip()
        by_text = cache.get("by_text", {}).get(route, {})
        if isinstance(by_text, dict) and text in by_text:
            return by_text[text]
    blob = json.dumps(payload, ensure_ascii=False)
    contains = cache.get("contains", {}).get(route, {})
    if isinstance(contains, dict):
        for needle, response in contains.items():
            if needle and needle in blob:
                return response
    return None
