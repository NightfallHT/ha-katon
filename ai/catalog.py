"""Local innovation/material catalog.

Prefers Klaudia's `/data/seed/*.json` when those files exist, otherwise the
bundled fixtures so matchmaking and the help bot work before the seed lands.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from util import AI_ROOT, REPO_ROOT

_NS = uuid.UUID("8f1b6c2a-4d3e-4a11-9c2b-0a6e5d7c8b90")


def _read_json_lists(directory) -> list[dict[str, Any]]:
    if not directory.is_dir():
        return []
    rows: list[dict[str, Any]] = []
    for path in sorted(directory.glob("*.json")):
        if "first-10" in path.name:
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if isinstance(payload, list):
            rows.extend(item for item in payload if isinstance(item, dict))
        elif isinstance(payload, dict):
            for value in payload.values():
                if isinstance(value, list):
                    rows.extend(item for item in value if isinstance(item, dict))
    return rows


def _kind(item: dict[str, Any]) -> str | None:
    if "population" in item and "name" in item and "title" not in item:
        return "gmina"
    if "indicator_name" in item or ("powiat" in item and "summary" not in item and "title" in item):
        return "challenge"
    material_type = item.get("type")
    if material_type in {"raport", "poradnik", "film", "canvas"}:
        return "material"
    if "summary" in item and "title" in item:
        return "innovation"
    if "title" in item and ("url" in item or "description" in item):
        return "material"
    return None


def _with_id(item: dict[str, Any], prefix: str) -> dict[str, Any]:
    copied = dict(item)
    if not copied.get("id"):
        copied["id"] = str(uuid.uuid5(_NS, prefix + ":" + str(copied.get("title") or copied.get("name") or "")))
    else:
        copied["id"] = str(copied["id"])
    return copied


def _buckets() -> dict[str, list[dict[str, Any]]]:
    seeded = _read_json_lists(REPO_ROOT / "data" / "seed")
    buckets: dict[str, list[dict[str, Any]]] = {"innovation": [], "material": [], "gmina": [], "challenge": []}
    for item in seeded:
        kind = _kind(item)
        if kind:
            titled = _with_id(item, kind)
            key = str(titled.get("title") or titled.get("name") or titled["id"])
            if any(str(existing.get("title") or existing.get("name")) == key for existing in buckets[kind]):
                continue
            buckets[kind].append(titled)
    if not buckets["innovation"]:
        fixtures = _read_json_lists(AI_ROOT / "fixtures")
        for item in fixtures:
            kind = _kind(item)
            if kind == "innovation":
                buckets["innovation"].append(_with_id(item, "innovation"))
            elif kind == "material":
                buckets["material"].append(_with_id(item, "material"))
    elif not buckets["material"]:
        for item in _read_json_lists(AI_ROOT / "fixtures"):
            if _kind(item) == "material":
                buckets["material"].append(_with_id(item, "material"))
    return buckets


def innovations() -> list[dict[str, Any]]:
    return list(_buckets()["innovation"])


def materials() -> list[dict[str, Any]]:
    return list(_buckets()["material"])


def innovation_by_id(innovation_id: str) -> dict[str, Any] | None:
    for item in innovations():
        if str(item.get("id")) == innovation_id:
            return item
    return None


def using_seed() -> bool:
    return any((REPO_ROOT / "data" / "seed").glob("*.json")) if (REPO_ROOT / "data" / "seed").is_dir() else False
