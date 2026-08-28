#!/usr/bin/env python3
"""Validate that a target MAJOR.MINOR.PATCH version is strictly newer."""

from __future__ import annotations

import argparse
import re
import sys
from typing import Tuple


SEMVER_PATTERN = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$"
)


def parse_semver(value: str) -> Tuple[int, int, int]:
    """Parse a strict semantic core version."""
    match = SEMVER_PATTERN.fullmatch(value)
    if match is None:
        raise ValueError(
            f"{value!r} is not a plain MAJOR.MINOR.PATCH semantic version"
        )
    major, minor, patch = match.groups()
    return int(major), int(minor), int(patch)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Require TARGET to be a strict semantic version newer than CURRENT."
    )
    parser.add_argument("current")
    parser.add_argument("target")
    args = parser.parse_args()

    try:
        current = parse_semver(args.current)
        target = parse_semver(args.target)
    except ValueError as error:
        print(f"invalid: {error}", file=sys.stderr)
        return 2

    if target <= current:
        print(
            f"not-newer: target {args.target} must be newer than {args.current}",
            file=sys.stderr,
        )
        return 1

    print(f"ok: {args.current} -> {args.target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
