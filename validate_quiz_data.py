#!/usr/bin/env python3
"""Validate structured quiz JSON files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def validate_file(path: Path) -> tuple[int, list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return 0, [f"{path}: invalid JSON: {exc}"], warnings

    if data.get("schemaVersion") != 1:
        errors.append(f"{path}: schemaVersion must be 1")
    if not isinstance(data.get("setId"), str) or not data["setId"].strip():
        errors.append(f"{path}: setId is required")
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        errors.append(f"{path}: title is required")

    sections = data.get("sections")
    if not isinstance(sections, list) or not sections:
        errors.append(f"{path}: sections must be a non-empty array")
        return 0, errors, warnings

    question_count = 0
    seen_question_ids: set[str] = set()
    for section_index, section in enumerate(sections, start=1):
        prefix = f"{path}: section {section_index}"
        if not isinstance(section, dict):
            errors.append(f"{prefix}: section must be an object")
            continue
        if not isinstance(section.get("id"), str) or not section["id"].strip():
            errors.append(f"{prefix}: id is required")
        if not (
            isinstance(section.get("title"), str)
            or isinstance(section.get("titleHtml"), str)
        ):
            errors.append(f"{prefix}: title or titleHtml is required")
        questions = section.get("questions")
        if not isinstance(questions, list) or not questions:
            errors.append(f"{prefix}: questions must be a non-empty array")
            continue

        for question_index, question in enumerate(questions, start=1):
            qprefix = f"{prefix}, question {question_index}"
            question_count += 1
            if not isinstance(question, dict):
                errors.append(f"{qprefix}: question must be an object")
                continue
            qid = question.get("id")
            if not isinstance(qid, str) or not qid.strip():
                errors.append(f"{qprefix}: id is required")
                continue
            if qid in seen_question_ids:
                errors.append(f"{qprefix}: duplicate id '{qid}'")
            seen_question_ids.add(qid)
            if not (
                isinstance(question.get("label"), str)
                or isinstance(question.get("labelHtml"), str)
            ):
                errors.append(f"{qprefix}: label or labelHtml is required")

            qtype = question.get("type")
            if qtype not in {"mcq", "mcq_multi", "text"}:
                errors.append(f"{qprefix}: invalid type '{qtype}'")
                continue

            if qtype in {"mcq", "mcq_multi"}:
                validate_options_question(question, qprefix, errors)
            else:
                keywords = question.get("keywords")
                if not isinstance(keywords, list) or not all(
                    isinstance(item, str) and item.strip() for item in keywords
                ):
                    errors.append(f"{qprefix}: text question needs keywords")
                answer_mode = question.get("answerMode")
                if answer_mode is not None and answer_mode not in {
                    "contains_any",
                    "contains_all",
                    "sequence",
                }:
                    errors.append(
                        f"{qprefix}: answerMode must be contains_any, contains_all, or sequence"
                    )

            explanation = question.get("explanation")
            if explanation is not None and not isinstance(explanation, str):
                errors.append(f"{qprefix}: explanation must be a string")

    return question_count, errors, warnings


def validate_manifest(path: Path) -> tuple[list[Path], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [], [f"{path}: invalid JSON: {exc}"], warnings

    if manifest.get("schemaVersion") != 1:
        errors.append(f"{path}: schemaVersion must be 1")
    sets = manifest.get("sets")
    if not isinstance(sets, list) or not sets:
        errors.append(f"{path}: sets must be a non-empty array")
        return [], errors, warnings

    data_paths: list[Path] = []
    seen_ids: set[str] = set()
    for index, entry in enumerate(sets, start=1):
        prefix = f"{path}: set {index}"
        if not isinstance(entry, dict):
            errors.append(f"{prefix}: set entry must be an object")
            continue
        set_id = entry.get("id")
        label = entry.get("label")
        data_url = entry.get("dataUrl")
        if not isinstance(set_id, str) or not set_id.strip():
            errors.append(f"{prefix}: id is required")
        elif set_id in seen_ids:
            errors.append(f"{prefix}: duplicate id '{set_id}'")
        else:
            seen_ids.add(set_id)
        if not isinstance(label, str) or not label.strip():
            errors.append(f"{prefix}: label is required")
        if not isinstance(data_url, str) or not data_url.strip():
            errors.append(f"{prefix}: dataUrl is required")
            continue
        if "://" in data_url or data_url.startswith(("/", "#")):
            warnings.append(f"{prefix}: external/absolute dataUrl not validated: {data_url}")
            continue
        data_path = (path.parent / data_url).resolve()
        if not data_path.exists():
            errors.append(f"{prefix}: dataUrl does not exist: {data_url}")
            continue
        data_paths.append(data_path)
    return data_paths, errors, warnings


def validate_options_question(
    question: dict[str, Any], prefix: str, errors: list[str]
) -> None:
    options = question.get("options")
    if not isinstance(options, list) or not options:
        errors.append(f"{prefix}: options must be a non-empty array")
        return
    values: set[str] = set()
    for option_index, option in enumerate(options, start=1):
        if not isinstance(option, dict):
            errors.append(f"{prefix}: option {option_index} must be an object")
            continue
        value = option.get("value")
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{prefix}: option {option_index} value is required")
            continue
        values.add(value)
        if not (
            isinstance(option.get("text"), str)
            or isinstance(option.get("html"), str)
        ):
            errors.append(f"{prefix}: option {option_index} needs text or html")

    answer = question.get("answer")
    if question.get("type") == "mcq":
        if not isinstance(answer, str) or answer not in values:
            errors.append(f"{prefix}: answer must match one option value")
    else:
        if not isinstance(answer, list) or not answer:
            errors.append(f"{prefix}: answer must be a non-empty array")
            return
        unknown = sorted(set(answer) - values)
        if unknown:
            errors.append(f"{prefix}: answer values not in options: {unknown!r}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    paths = [Path(path) for path in args.paths]
    if args.all or not paths:
        manifest_path = root / "quiz_sets" / "index.json"
        paths, manifest_errors, manifest_warnings = validate_manifest(manifest_path)
        all_errors = manifest_errors
        all_warnings = manifest_warnings
    else:
        all_errors = []
        all_warnings = []

    total_questions = 0
    for path in paths:
        count, errors, warnings = validate_file(path)
        total_questions += count
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    for warning in all_warnings:
        print(f"WARNING: {warning}")
    for error in all_errors:
        print(f"ERROR: {error}")
    print(f"Validated {len(paths)} JSON quiz set(s), {total_questions} question(s).")
    if all_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
