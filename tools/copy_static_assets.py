#!/usr/bin/env python3
"""Copy static runtime assets that are intentionally not bundled by Vite."""

from __future__ import annotations

import shutil
import os
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
EXTERNAL_QUIZ_SETS = Path(
    os.environ.get(
        "QUIZ_SETS_DIR",
        "/Users/simonpollak/Documents/Projects/drill_content/quiz_sets",
    )
).expanduser()
LOCAL_QUIZ_SETS = ROOT / "quiz_sets"
EDGE_CASES_ENTRY = {
    "id": "testing/edge-cases",
    "label": "Testing – Edge Cases",
    "dataUrl": "testing/edge-cases.json",
}

DIRS = [
    "src/assets",
    "src/config",
    "src/styles",
]


def copy_file(relative_path: str) -> None:
    source = ROOT / relative_path
    if not source.exists():
        return
    target = DIST / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def copy_dir(relative_path: str) -> None:
    source = ROOT / relative_path
    if not source.exists():
        return
    target = DIST / relative_path
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)


def copy_dir_from(source: Path, target: Path) -> None:
    if not source.exists():
        return
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target, ignore=shutil.ignore_patterns(".DS_Store"))


def copy_edge_cases(target_quiz_sets: Path) -> None:
    source = LOCAL_QUIZ_SETS / "testing" / "edge-cases.json"
    if not source.exists():
        return
    target = target_quiz_sets / "testing" / "edge-cases.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def write_merged_manifest(target_quiz_sets: Path) -> None:
    source_manifest = (
        EXTERNAL_QUIZ_SETS / "index.json"
        if (EXTERNAL_QUIZ_SETS / "index.json").exists()
        else LOCAL_QUIZ_SETS / "index.json"
    )
    manifest = json.loads(source_manifest.read_text(encoding="utf-8"))
    sets = list(manifest.get("sets") or [])
    if not any(item.get("id") == EDGE_CASES_ENTRY["id"] for item in sets):
        sets.append(EDGE_CASES_ENTRY)
    manifest["sets"] = sets
    target_quiz_sets.mkdir(parents=True, exist_ok=True)
    (target_quiz_sets / "index.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def copy_quiz_sets() -> None:
    source = EXTERNAL_QUIZ_SETS if EXTERNAL_QUIZ_SETS.exists() else LOCAL_QUIZ_SETS
    target = DIST / "quiz_sets"
    copy_dir_from(source, target)
    copy_edge_cases(target)
    write_merged_manifest(target)


def main() -> None:
    if not DIST.exists():
        raise SystemExit("dist/ does not exist. Run vite build first.")

    copy_quiz_sets()

    for dir_path in DIRS:
        copy_dir(dir_path)

    print("Copied static quiz assets into dist/.")


if __name__ == "__main__":
    main()
