#!/usr/bin/env python3
"""Import a structured Markdown quiz into YAML spec and optionally generate a quiz set."""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Any

from generate_quiz_set import (
    SpecError,
    build_explanations_js,
    build_fragment,
    register_in_config,
    validate_generated,
    write_outputs,
)


QUESTION_RE = re.compile(r"^##\s+(\d+)\.\s+(.*)$")
OPTION_RE = re.compile(r"^-\s*([a-z])\)\s+(.*)$", re.IGNORECASE)
ANSWER_RE = re.compile(r"^\*\*Správna odpoveď:\*\*\s*(.+?)\s*$")


def slugify(text: str) -> str:
    text = text.lower()
    replacements = {
        "á": "a",
        "ä": "a",
        "č": "c",
        "ď": "d",
        "é": "e",
        "ě": "e",
        "í": "i",
        "ľ": "l",
        "ĺ": "l",
        "ň": "n",
        "ó": "o",
        "ô": "o",
        "ö": "o",
        "ř": "r",
        "š": "s",
        "ť": "t",
        "ú": "u",
        "ů": "u",
        "ü": "u",
        "ý": "y",
        "ž": "z",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "quiz"


def yaml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def yaml_dump(value: Any, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.append(yaml_dump(item, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {yaml_scalar(item)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, dict):
                lines.append(f"{prefix}- {first_inline_map_entry(item)}")
                remaining = list(item.items())[1:]
                for key, child in remaining:
                    if isinstance(child, (dict, list)):
                        lines.append(f"{prefix}  {key}:")
                        lines.append(yaml_dump(child, indent + 4))
                    else:
                        lines.append(f"{prefix}  {key}: {yaml_scalar(child)}")
            elif isinstance(item, list):
                lines.append(f"{prefix}-")
                lines.append(yaml_dump(item, indent + 2))
            else:
                lines.append(f"{prefix}- {yaml_scalar(item)}")
        return "\n".join(lines)
    return prefix + yaml_scalar(value)


def first_inline_map_entry(item: dict[str, Any]) -> str:
    key, value = next(iter(item.items()))
    if isinstance(value, (dict, list)):
        raise SpecError("Nested object cannot be the first inline YAML mapping entry.")
    return f"{key}: {yaml_scalar(value)}"


def yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if not isinstance(value, str):
        value = str(value)
    return yaml_quote(value)


def parse_markdown_quiz(path: Path) -> tuple[str, list[dict[str, Any]]]:
    title = ""
    questions: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line == "---":
            continue
        if line.startswith("# ") and not title:
            title = line[2:].strip()
            continue

        question_match = QUESTION_RE.match(line)
        if question_match:
            if current:
                ensure_complete_question(current, path)
                questions.append(current)
            current = {
                "number": int(question_match.group(1)),
                "label": question_match.group(2).strip(),
                "options": [],
                "answer_values": [],
            }
            continue

        if current is None:
            continue

        option_match = OPTION_RE.match(line)
        if option_match:
            current["options"].append(
                {
                    "value": option_match.group(1).lower(),
                    "text": option_match.group(2).strip(),
                }
            )
            continue

        answer_match = ANSWER_RE.match(line)
        if answer_match:
            current["answer_values"] = [
                part.strip().lower()
                for part in answer_match.group(1).split(",")
                if part.strip()
            ]
            continue

    if current:
        ensure_complete_question(current, path)
        questions.append(current)

    if not title:
        raise SpecError(f"{path}: missing '# Title' heading.")
    if not questions:
        raise SpecError(f"{path}: no questions found.")
    return title, questions


def ensure_complete_question(question: dict[str, Any], path: Path) -> None:
    if not question["options"]:
        raise SpecError(
            f"{path}: question {question['number']} has no options."
        )
    if not question["answer_values"]:
        raise SpecError(
            f"{path}: question {question['number']} has no '**Správna odpoveď:**' line."
        )
    option_values = {option["value"] for option in question["options"]}
    unknown = sorted(set(question["answer_values"]) - option_values)
    if unknown:
        raise SpecError(
            f"{path}: question {question['number']} uses unknown answer value(s): {', '.join(unknown)}"
        )


def build_spec(
    title: str,
    questions: list[dict[str, Any]],
    set_id: str,
    label: str,
    section_size: int,
) -> dict[str, Any]:
    sections: list[dict[str, Any]] = []
    for start in range(0, len(questions), section_size):
        chunk = questions[start : start + section_size]
        section_index = len(sections) + 1
        chunk_start = chunk[0]["number"]
        chunk_end = chunk[-1]["number"]
        section_questions = []
        for question_index, question in enumerate(chunk, start=1):
            answers = question["answer_values"]
            question_type = "mcq" if len(answers) == 1 else "mcq_multi"
            question_entry: dict[str, Any] = {
                "id": f"q{section_index}_{question_index}",
                "type": question_type,
                "label": f"{question['number']}. {question['label']}",
                "options": {
                    option["value"]: option["text"] for option in question["options"]
                },
                "explanation": "",
            }
            question_entry["answer"] = (
                answers[0] if question_type == "mcq" else answers
            )
            section_questions.append(question_entry)

        sections.append(
            {
                "id": f"sec_{section_index}",
                "title": f"{section_index}. Otázky {chunk_start}–{chunk_end}",
                "questions": section_questions,
            }
        )

    return {
        "set_id": set_id,
        "label": label,
        "title": title,
        "sections": sections,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import a Markdown quiz file and generate a quiz set."
    )
    parser.add_argument("markdown", help="Path to the Markdown quiz file")
    parser.add_argument(
        "--set-id",
        help="Quiz set id, e.g. bpc-ic1-2026/skuska. Defaults to an id derived from the filename.",
    )
    parser.add_argument(
        "--label",
        help="Human-readable label for confg.js and sidebar. Defaults to the Markdown title.",
    )
    parser.add_argument(
        "--section-size",
        type=int,
        default=10,
        help="How many questions to place into one generated section (default: 10).",
    )
    parser.add_argument(
        "--spec-out",
        help="Where to write the generated YAML spec. Defaults to context/imported/<name>.yaml in the repo.",
    )
    parser.add_argument(
        "--output-root",
        help="Repo root containing quiz_sets/ and confg.js. Defaults to this repo.",
    )
    parser.add_argument(
        "--no-register-config",
        action="store_true",
        help="Do not register the generated set in confg.js.",
    )
    args = parser.parse_args()

    repo_root = (
        Path(args.output_root).resolve()
        if args.output_root
        else Path(__file__).resolve().parent
    )
    markdown_path = Path(args.markdown).resolve()
    title, questions = parse_markdown_quiz(markdown_path)

    inferred_name = slugify(markdown_path.stem.replace("_quiz", ""))
    set_id = args.set_id or f"imported/{inferred_name}"
    label = args.label or title
    spec = build_spec(title, questions, set_id, label, args.section_size)

    spec_out = (
        Path(args.spec_out).resolve()
        if args.spec_out
        else repo_root / "context" / "imported" / f"{inferred_name}.yaml"
    )
    spec_out.parent.mkdir(parents=True, exist_ok=True)
    spec_out.write_text(yaml_dump(spec) + "\n", encoding="utf-8")
    print(f"OK: wrote spec {spec_out}")

    fragment_html, explanations = build_fragment(spec)
    explanations_js = build_explanations_js(set_id, explanations)
    frag_path, expl_path, embed_path = write_outputs(
        repo_root, set_id, fragment_html, explanations_js
    )
    validate_generated(frag_path, expl_path)

    print(f"OK: generated {frag_path}")
    print(f"OK: generated {expl_path}")
    print(f"OK: generated {embed_path}")

    if not args.no_register_config:
        config_path = repo_root / "confg.js"
        added = register_in_config(config_path, set_id, label)
        if added:
            print(f"OK: registered {set_id} in {config_path}")
        else:
            print(f"INFO: {set_id} is already registered in {config_path}")


if __name__ == "__main__":
    try:
        main()
    except SpecError as exc:
        raise SystemExit(f"Import error: {exc}") from exc
