#!/usr/bin/env python3
"""Read-only inventory of skill packages across sibling repositories.

Discovery is derived entirely from this file's own location: walk up to the
repository root (the directory holding ``skills/``), take its parent as the
workspace root, and scan that parent's immediate children for Git repositories
that carry canonical skills. No absolute workspace path is hardcoded, so the
inventory keeps working when the workspace is moved or renamed.

The script never writes, stages, or commits anything, in this repository or a
sibling. It is the discovery half of the ``workspace-sync`` skill; every
judgment about which version is *better* belongs to the agent reading its
output, not here -- line counts are a weak signal and are reported as data, not
as a ranking.

Usage:
    python scripts/workspace_scan.py                 # table for humans
    python scripts/workspace_scan.py --json          # machine-readable
    python scripts/workspace_scan.py --skill improve # one skill group only
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, Iterator, List, Optional


def find_repo_root(start: Path) -> Path:
    """Return the nearest ancestor of *start* that contains a ``skills`` dir."""
    for candidate in [start, *start.parents]:
        if (candidate / "skills").is_dir():
            return candidate
    raise SystemExit(
        "ERROR: no ancestor directory with a skills/ folder; "
        "run this from inside a repository that has canonical skills"
    )


REPO_ROOT = find_repo_root(Path(__file__).resolve().parent)
WORKSPACE_ROOT = REPO_ROOT.parent


def is_repository(path: Path) -> bool:
    """True when *path* looks like a Git repository holding canonical skills."""
    return (path / ".git").exists() and (path / "skills").is_dir()


def iter_repositories() -> Iterator[Path]:
    """Yield this repository first, then every sibling with canonical skills."""
    yield REPO_ROOT
    try:
        children = sorted(p for p in WORKSPACE_ROOT.iterdir() if p.is_dir())
    except OSError:
        return
    for child in children:
        if child != REPO_ROOT and is_repository(child):
            yield child


def read_description(skill_file: Path) -> str:
    """Return the frontmatter description, or an empty string when absent."""
    try:
        text = skill_file.read_text(encoding="utf-8")
    except OSError:
        return ""
    if not text.startswith("---"):
        return ""
    closing = text.find("\n---", 3)
    if closing == -1:
        return ""
    for line in text[3:closing].splitlines():
        if line.startswith("description:"):
            return line.split(":", 1)[1].strip()
    return ""


def body_lines(skill_file: Path) -> int:
    """Return the line count of the body after the closing frontmatter fence."""
    try:
        text = skill_file.read_text(encoding="utf-8")
    except OSError:
        return 0
    if text.startswith("---"):
        closing = text.find("\n---", 3)
        if closing != -1:
            text = text[closing + 4 :]
    return len(text.splitlines())


def last_commit(repo: Path, path: Path) -> Optional[str]:
    """Return the last author date for *path*, or None when Git is unavailable.

    Fails open: a missing Git binary, an unreadable repository, or a file with
    no history all report as None rather than aborting the inventory.
    """
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%as", "--", str(path)],
            cwd=repo,
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    output = result.stdout.strip()
    return output or None


def count_files(directory: Path) -> int:
    """Return the number of files directly under *directory*, ignoring caches."""
    if not directory.is_dir():
        return 0
    return sum(
        1
        for entry in directory.iterdir()
        if entry.is_file() and not entry.name.endswith(".pyc")
    )


def scan_repository(repo: Path) -> Dict[str, dict]:
    """Return ``{skill_name: facts}`` for every canonical skill in *repo*."""
    skills: Dict[str, dict] = {}
    skills_root = repo / "skills"
    for skill_dir in sorted(p for p in skills_root.iterdir() if p.is_dir()):
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.is_file():
            continue
        name = skill_dir.name
        skills[name] = {
            "path": str(skill_file.relative_to(repo)).replace("\\", "/"),
            "bodyLines": body_lines(skill_file),
            "description": read_description(skill_file),
            "references": count_files(skill_dir / "references"),
            "scripts": count_files(skill_dir / "scripts"),
            "assets": count_files(skill_dir / "assets"),
            "claudePointer": (repo / ".claude" / "skills" / name / "SKILL.md").is_file(),
            "copilotPrompt": (
                repo / ".github" / "prompts" / f"{name}.prompt.md"
            ).is_file(),
            "openaiMetadata": (skill_dir / "agents" / "openai.yaml").is_file(),
            "lastCommit": last_commit(repo, skill_file),
        }
    return skills


def build_inventory(only: Optional[str]) -> dict:
    """Assemble the full cross-repository inventory."""
    repositories: Dict[str, dict] = {}
    for repo in iter_repositories():
        skills = scan_repository(repo)
        if only:
            skills = {k: v for k, v in skills.items() if k == only}
        repositories[repo.name] = {
            "root": str(repo),
            "isCurrent": repo == REPO_ROOT,
            "skills": skills,
        }

    groups: Dict[str, List[str]] = {}
    for repo_name, facts in repositories.items():
        for skill_name in facts["skills"]:
            groups.setdefault(skill_name, []).append(repo_name)

    current = repositories[REPO_ROOT.name]["skills"]
    missing_here = sorted(name for name in groups if name not in current)

    return {
        "workspaceRoot": str(WORKSPACE_ROOT),
        "currentRepository": REPO_ROOT.name,
        "repositories": repositories,
        "skillGroups": {name: sorted(repos) for name, repos in sorted(groups.items())},
        "missingFromCurrentRepository": missing_here,
    }


def render_table(inventory: dict) -> str:
    """Render the inventory as a fixed-width table."""
    repo_names = list(inventory["repositories"])
    lines = [
        f"Workspace root:      {inventory['workspaceRoot']}",
        f"Current repository:  {inventory['currentRepository']}",
        f"Repositories found:  {len(repo_names)} ({', '.join(repo_names)})",
        "",
    ]

    name_width = max((len(n) for n in inventory["skillGroups"]), default=5)
    name_width = max(name_width, 5)
    header = "skill".ljust(name_width) + "  " + "  ".join(
        n[:18].ljust(18) for n in repo_names
    )
    lines.append(header)
    lines.append("-" * len(header))

    for skill_name in inventory["skillGroups"]:
        cells = []
        for repo_name in repo_names:
            facts = inventory["repositories"][repo_name]["skills"].get(skill_name)
            if facts is None:
                cells.append("--".ljust(18))
                continue
            adapters = sum(
                (
                    facts["claudePointer"],
                    facts["copilotPrompt"],
                    facts["openaiMetadata"],
                )
            )
            resources = facts["references"] + facts["scripts"] + facts["assets"]
            cell = f"{facts['bodyLines']}L r{resources} a{adapters}/3"
            cells.append(cell.ljust(18))
        lines.append(skill_name.ljust(name_width) + "  " + "  ".join(cells))

    missing = inventory["missingFromCurrentRepository"]
    lines.append("")
    if missing:
        lines.append(
            "Absent from "
            f"{inventory['currentRepository']}: {', '.join(missing)}"
        )
    else:
        lines.append(
            f"{inventory['currentRepository']} has every skill present in the workspace."
        )
    lines.append("")
    lines.append(
        "Legend: <body lines>L r<bundled resources> a<adapters present>/3. "
        "These are inputs to a judgment, not a ranking -- read the bodies."
    )
    return "\n".join(lines)


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Inventory skills across sibling repositories (read-only)."
    )
    parser.add_argument("--json", action="store_true", help="emit JSON")
    parser.add_argument(
        "--skill", metavar="NAME", help="restrict the inventory to one skill group"
    )
    args = parser.parse_args(argv)

    inventory = build_inventory(args.skill)

    if args.json:
        print(json.dumps(inventory, indent=2, sort_keys=True))
    else:
        print(render_table(inventory))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
