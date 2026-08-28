#!/usr/bin/env python3
"""Report the active Claude Code usage block and a passive work recommendation.

Reads the local Claude Code session transcripts, reconstructs the rolling
five-hour usage block, and prints one JSON object. It never sleeps, never
resumes work, and never fails a run: unreadable or missing usage data reports
``available: false`` with a ``proceed`` recommendation.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, List, Optional


DEFAULT_SESSION_HOURS = 5
DEFAULT_WARN_PERCENT = 70.0
DEFAULT_STOP_PERCENT = 90.0


class Entry:
    __slots__ = ("timestamp", "tokens")

    def __init__(self, timestamp: datetime, tokens: int) -> None:
        self.timestamp = timestamp
        self.tokens = tokens


class Block:
    def __init__(self, start: datetime, length: timedelta) -> None:
        self.start = start
        self.end = start + length
        self.last = start
        self.tokens = 0

    def add(self, entry: Entry) -> None:
        self.last = entry.timestamp
        self.tokens += entry.tokens


def parse_timestamp(raw: str) -> Optional[datetime]:
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def usage_tokens(record: dict) -> int:
    message = record.get("message")
    usage = message.get("usage") if isinstance(message, dict) else None
    if not isinstance(usage, dict):
        return 0
    total = 0
    for key in (
        "input_tokens",
        "output_tokens",
        "cache_creation_input_tokens",
        "cache_read_input_tokens",
    ):
        value = usage.get(key)
        if isinstance(value, int):
            total += value
    return total


def read_entries(projects_dir: Path) -> List[Entry]:
    entries: List[Entry] = []
    if not projects_dir.is_dir():
        return entries
    for path in projects_dir.rglob("*.jsonl"):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(record, dict):
                continue
            timestamp = parse_timestamp(record.get("timestamp", ""))
            if timestamp is None:
                continue
            tokens = usage_tokens(record)
            if tokens:
                entries.append(Entry(timestamp, tokens))
    entries.sort(key=lambda item: item.timestamp)
    return entries


def build_blocks(entries: Iterable[Entry], length: timedelta) -> List[Block]:
    blocks: List[Block] = []
    current: Optional[Block] = None
    for entry in entries:
        starts_new = (
            current is None
            or entry.timestamp >= current.end
            or entry.timestamp - current.last >= length
        )
        if starts_new:
            current = Block(entry.timestamp.replace(minute=0, second=0, microsecond=0), length)
            blocks.append(current)
        assert current is not None
        current.add(entry)
    return blocks


def recommend(used_percent: Optional[float], warn: float, stop: float) -> tuple[str, str]:
    if used_percent is None:
        return "proceed", "No historical block is large enough to infer a limit yet."
    if used_percent >= stop:
        return "stop", f"{used_percent:.0f}% of the inferred block budget is used."
    if used_percent >= warn:
        return "checkpoint", f"{used_percent:.0f}% of the inferred block budget is used."
    return "proceed", f"{used_percent:.0f}% of the inferred block budget is used."


def build_report(
    projects_dir: Path,
    now: datetime,
    session_hours: int,
    token_limit: Optional[int],
    warn: float,
    stop: float,
) -> dict:
    length = timedelta(hours=session_hours)
    entries = read_entries(projects_dir)
    if not entries:
        return {
            "available": False,
            "now": now.isoformat(),
            "recommendation": "proceed",
            "reason": f"No usage transcripts found under {projects_dir}.",
        }

    blocks = build_blocks(entries, length)
    active = next(
        (
            block
            for block in blocks
            if now < block.end and now - block.last < length
        ),
        None,
    )

    if token_limit is None:
        historical = [block.tokens for block in blocks if block is not active]
        token_limit = max(historical) if historical else None

    if active is None:
        return {
            "available": True,
            "now": now.isoformat(),
            "block": None,
            "tokenLimit": token_limit,
            "usedPercent": 0.0 if token_limit else None,
            "recommendation": "proceed",
            "reason": "No usage block is currently open.",
        }

    used_percent = (
        round(active.tokens / token_limit * 100, 1) if token_limit else None
    )
    recommendation, reason = recommend(used_percent, warn, stop)
    return {
        "available": True,
        "now": now.isoformat(),
        "block": {
            "startsAt": active.start.isoformat(),
            "endsAt": active.end.isoformat(),
            "minutesRemaining": max(
                0, int((active.end - now).total_seconds() // 60)
            ),
            "tokensUsed": active.tokens,
        },
        "tokenLimit": token_limit,
        "usedPercent": used_percent,
        "recommendation": recommendation,
        "reason": reason,
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--projects-dir",
        default=str(Path.home() / ".claude" / "projects"),
        help="Directory holding Claude Code session transcripts.",
    )
    parser.add_argument("--now", default=None, help="ISO timestamp to evaluate against.")
    parser.add_argument("--session-hours", type=int, default=DEFAULT_SESSION_HOURS)
    parser.add_argument("--token-limit", type=int, default=None)
    parser.add_argument("--warn-percent", type=float, default=DEFAULT_WARN_PERCENT)
    parser.add_argument("--stop-percent", type=float, default=DEFAULT_STOP_PERCENT)
    args = parser.parse_args(argv)

    now = parse_timestamp(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        now = datetime.now(timezone.utc)

    report = build_report(
        Path(args.projects_dir),
        now,
        args.session_hours,
        args.token_limit,
        args.warn_percent,
        args.stop_percent,
    )
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
