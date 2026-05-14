#!/usr/bin/env python3
"""Copy static runtime assets that are intentionally not bundled by Vite."""

from __future__ import annotations

import shutil
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def load_dotenv_value(name: str) -> str | None:
    value = os.environ.get(name)
    if value:
        return value
    env_path = ROOT / ".env"
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, raw_value = stripped.split("=", 1)
        if key.strip() == name:
            return raw_value.strip().strip('"').strip("'")
    return None


def get_quiz_sets_dir() -> Path:
    value = load_dotenv_value("QUIZ_SETS_DIR")
    if not value:
        raise SystemExit(
            "QUIZ_SETS_DIR is not set. Create .env from .env.example or run with "
            "QUIZ_SETS_DIR=/path/to/quiz_sets."
        )
    return Path(value).expanduser()


EXTERNAL_QUIZ_SETS = get_quiz_sets_dir()

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
