#!/usr/bin/env python3
"""Z quiz_sets/<id>.frag.html vytvorí quiz_sets/<id>.frag.embed.js pre spustenie bez HTTP servera."""

import argparse
import json
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--id",
        default="default",
        help='Identifikátor setu (súbory quiz_sets/<id>.frag.html → .frag.embed.js)',
    )
    args = p.parse_args()
    quiz_id: str = args.id

    root = Path(__file__).resolve().parent
    src = root / "quiz_sets" / f"{quiz_id}.frag.html"
    dst = root / "quiz_sets" / f"{quiz_id}.frag.embed.js"

    if not src.is_file():
        raise SystemExit(f"Chýba {src}")

    html = src.read_text(encoding="utf-8")
    header = (
        f"// Vygenerované z quiz_sets/{quiz_id}.frag.html\n"
        "// Nepíšte ručne – spustite: python3 embed_quiz_fragment.py"
        + ("" if quiz_id == "default" else f" --id {quiz_id}")
        + "\n"
    )
    js = header + "window.QUIZ_FRAGMENT_HTML = " + json.dumps(html, ensure_ascii=False) + ";\n"
    dst.write_text(js, encoding="utf-8")
    print(f"OK → {dst} ({dst.stat().st_size} B)")


if __name__ == "__main__":
    main()
