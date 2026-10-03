"""Compare 5 Polish problem descriptions with the innovation catalog.

Uses Klaudia's `/data/seed` when it exists, otherwise the bundled fixtures.
Without LLM_API_KEY the script skips; the chosen default stays
text-embedding-3-small at 1536 dimensions so Ola's vector(1536) does not change.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from catalog import innovations, using_seed
from llm import llm
from services.match import innovation_embed_text

QUERIES = (
    "Starsi sąsiedzi na wsi są samotni i nie mają jak dojechać do lekarza.",
    "Seniorzy nie umieją korzystać z internetu i e-recepty.",
    "Młodzież w miasteczku ma obniżony nastrój i nie ma do kogo się zgłosić.",
    "Osoby na wózkach nie dostaną się do urzędu i przychodni.",
    "Rodziny z małymi dziećmi nie mają żłobka ani wsparcia sąsiedzkiego.",
)


def cosine(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = sum(a * a for a in left) ** 0.5
    right_norm = sum(b * b for b in right) ** 0.5
    if not left_norm or not right_norm:
        return 0.0
    return dot / (left_norm * right_norm)


async def run() -> None:
    rows = innovations()
    source = "data/seed" if using_seed() else "ai/fixtures"
    print(f"catalog={source} innovations={len(rows)} model={llm.embedding_model} dim={llm.embedding_dim}")
    if not llm.available():
        print("SKIP no LLM_API_KEY; keeping text-embedding-3-small / vector(1536)")
        return
    vectors = await llm.embed_many([innovation_embed_text(row) for row in rows])
    for query in QUERIES:
        query_vector = await llm.embed(query)
        ranked = sorted(
            ((cosine(query_vector, vector), row) for vector, row in zip(vectors, rows)),
            key=lambda pair: pair[0],
            reverse=True,
        )
        print(f"\n{query}")
        for score, row in ranked[:3]:
            print(f"  {score:.3f}  {row.get('title')}  [{row.get('category')}]")


if __name__ == "__main__":
    asyncio.run(run())
