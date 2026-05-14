#!/usr/bin/env python3
"""Copy static runtime assets that are intentionally not bundled by Vite."""

from __future__ import annotations

import shutil
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
EXTERNAL_QUIZ_SETS = Path(
    os.environ.get(
        "QUIZ_SETS_DIR",
        "/Users/simonpollak/Documents/Projects/drill_content/quiz_sets",
    )
).expanduser()

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
        raise SystemExit(f"Quiz set source directory does not exist: {source}")
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target, ignore=shutil.ignore_patterns(".DS_Store"))


def copy_quiz_sets() -> None:
    copy_dir_from(EXTERNAL_QUIZ_SETS, DIST / "quiz_sets")


def main() -> None:
    if not DIST.exists():
        raise SystemExit("dist/ does not exist. Run vite build first.")

    copy_quiz_sets()

    for dir_path in DIRS:
        copy_dir(dir_path)

    print("Copied static quiz assets into dist/.")


if __name__ == "__main__":
    main()
