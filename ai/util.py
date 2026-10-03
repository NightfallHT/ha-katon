"""Small text helpers. User text is never written to logs."""

from __future__ import annotations

import re
from pathlib import Path

AI_ROOT = Path(__file__).resolve().parent
REPO_ROOT = AI_ROOT.parent

_FOLD = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")


def fold(value: str) -> str:
    return value.translate(_FOLD).lower()


def read_prompt(name: str) -> str:
    return (AI_ROOT / "prompts" / name).read_text(encoding="utf-8")


def read_repo_text(relative: str) -> str | None:
    path = REPO_ROOT / relative
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")


def limit_words(text: str, max_words: int = 80, max_sentences: int = 6) -> str:
    clean = " ".join(text.split())
    if not clean:
        return clean
    parts = re.split(r"(?<=[.!?])\s+", clean)
    chosen: list[str] = []
    words = 0
    for part in parts:
        count = len(part.split())
        if chosen and words + count > max_words:
            break
        chosen.append(part)
        words += count
        if len(chosen) >= max_sentences:
            break
    if not chosen:
        return " ".join(clean.split()[:max_words])
    return " ".join(chosen)


def limit_sentences(text: str, max_sentences: int = 5) -> str:
    clean = " ".join(text.split())
    parts = re.split(r"(?<=[.!?])\s+", clean)
    kept = [part for part in parts if part][:max_sentences]
    return " ".join(kept) if kept else clean


def one_question(text: str) -> str:
    clean = " ".join(text.split())
    if clean.count("?") <= 1:
        return clean
    cut = clean.find("?")
    return clean[: cut + 1].strip()


def first_sentence(text: str) -> str:
    clean = " ".join(text.split())
    match = re.search(r"[.!?]", clean)
    if not match:
        return clean
    return clean[: match.end()].strip()
