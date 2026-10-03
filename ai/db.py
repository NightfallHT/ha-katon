"""Supabase REST access (service role). No-ops when env is missing.

Expects Ola's schema: innovations.embedding vector(1536) and
match_innovations(query_embedding vector(1536), match_count int).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

log = logging.getLogger("ai.db")


class Db:
    def enabled(self) -> bool:
        return bool(os.getenv("SUPABASE_URL", "").strip() and os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip())

    def _base(self) -> str:
        return os.getenv("SUPABASE_URL", "").rstrip("/") + "/rest/v1"

    def _headers(self, prefer: str = "return=representation") -> dict[str, str]:
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        }

    async def _request(self, method: str, path: str, *, json_body: Any = None, prefer: str = "return=representation") -> Any:
        if not self.enabled():
            return None
        timeout = httpx.Timeout(15.0, connect=5.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.request(
                    method,
                    self._base() + path,
                    headers=self._headers(prefer),
                    json=json_body,
                )
        except httpx.HTTPError:
            log.warning("db transport failure")
            return None
        if response.status_code >= 400:
            log.warning("db http %s %s", method, response.status_code)
            return None
        if not response.content:
            return []
        return response.json()

    async def match_innovations(self, embedding: list[float], match_count: int = 10) -> list[dict[str, Any]]:
        rows = await self._request(
            "POST",
            "/rpc/match_innovations",
            json_body={"query_embedding": embedding, "match_count": match_count},
        )
        if not isinstance(rows, list):
            return []
        ids = [str(row["id"]) for row in rows if row.get("id")]
        extra = await self._by_ids(ids)
        merged: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row)
            item["id"] = str(item.get("id"))
            item.update(extra.get(item["id"], {}))
            merged.append(item)
        return merged

    async def _by_ids(self, ids: list[str]) -> dict[str, dict[str, Any]]:
        if not ids:
            return {}
        quoted = ",".join(ids)
        rows = await self._request(
            "GET",
            f"/innovations?id=in.({quoted})&select=id,title,summary,description,category,tags,target_groups",
        )
        if not isinstance(rows, list):
            return {}
        return {str(row["id"]): row for row in rows if row.get("id")}

    async def insert_need(
        self,
        *,
        text: str,
        category: str,
        target_group: str,
        location: str | None,
        keywords: list[str],
        role: str | None,
    ) -> str | None:
        rows = await self._request(
            "POST",
            "/needs",
            json_body={
                "text": text,
                "category": category,
                "target_group": target_group,
                "location": location,
                "keywords": keywords,
                "role": role,
            },
        )
        if isinstance(rows, list) and rows:
            return str(rows[0].get("id") or "")
        if isinstance(rows, dict) and rows.get("id"):
            return str(rows["id"])
        return None

    async def similar_needs(self, category: str) -> dict[str, Any]:
        since = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%SZ")
        rows = await self._request(
            "GET",
            f"/needs?category=eq.{category}&created_at=gte.{since}&select=text&limit=20",
        )
        if not isinstance(rows, list):
            return {"count": 0, "example": None}
        example = None
        for row in rows:
            sample = (row.get("text") or "").strip()
            if sample:
                example = sample
                break
        return {"count": len(rows), "example": example}

    async def list_innovations(self) -> list[dict[str, Any]]:
        rows = await self._request(
            "GET",
            "/innovations?select=id,title,summary,description,tags,target_groups,category",
        )
        if not isinstance(rows, list):
            return []
        return rows

    async def list_published(self) -> list[dict[str, Any]]:
        rows = await self._request(
            "GET",
            "/innovations?published=eq.true&select=id,title,summary,category,tags",
        )
        return rows if isinstance(rows, list) else []

    async def list_materials(self) -> list[dict[str, Any]]:
        rows = await self._request("GET", "/materials?select=title,description,url,type")
        return rows if isinstance(rows, list) else []

    async def get_innovation(self, innovation_id: str) -> dict[str, Any] | None:
        rows = await self._request(
            "GET",
            f"/innovations?id=eq.{innovation_id}&select=id,title,summary,description,category,tags,target_groups&limit=1",
        )
        if isinstance(rows, list) and rows:
            return rows[0]
        return None

    async def update_embedding(self, innovation_id: str, embedding: list[float]) -> bool:
        result = await self._request(
            "PATCH",
            f"/innovations?id=eq.{innovation_id}",
            json_body={"embedding": embedding},
            prefer="return=minimal",
        )
        return result is not None


db = Db()
