#!/usr/bin/env python3
"""Convert legacy generated quiz fragments to the JSON quiz data format."""

from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


def attrs_to_dict(attrs: list[tuple[str, str | None]]) -> dict[str, str]:
    return {key: value or "" for key, value in attrs}


def clean_text(value: str) -> str:
    return " ".join(value.split())


class FragmentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.sections: list[dict[str, Any]] = []
        self.current_section: dict[str, Any] | None = None
        self.current_question: dict[str, Any] | None = None
        self.current_option: dict[str, str] | None = None
        self.capture: str | None = None
        self.capture_parts: list[str] = []
        self.in_question_image = False
        self.in_hint = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = attrs_to_dict(attrs)
        classes = set(attr.get("class", "").split())

        if tag == "h1":
            self.capture = "title"
            self.capture_parts = []
            return

        if tag == "div" and "section" in classes:
            self.current_section = {
                "id": attr.get("id", f"sec_{len(self.sections) + 1}"),
                "title": "",
                "questions": [],
            }
            self.sections.append(self.current_section)
            return

        if tag == "div" and "section-title" in classes:
            self.capture = "section-title"
            self.capture_parts = []
            return

        if tag == "div" and "question" in classes:
            self.current_question = {
                "id": attr.get("id", ""),
                "type": "text" if attr.get("data-answer") == "text" else "mcq",
                "label": "",
                "answer": attr.get("data-answer", ""),
            }
            keywords = attr.get("data-keywords", "")
            if keywords:
                self.current_question["keywords"] = [
                    part.strip() for part in keywords.split(",") if part.strip()
                ]
            if self.current_section is not None:
                self.current_section["questions"].append(self.current_question)
            return

        if tag == "div" and "question-label" in classes:
            self.capture = "question-label"
            self.capture_parts = []
            return

        if tag == "div" and "question-image" in classes:
            self.in_question_image = True
            return

        if tag == "div" and "text-answer-hint" in classes:
            self.in_hint = True
            self.capture = "hint"
            self.capture_parts = []
            return

        if tag == "input" and self.current_question is not None:
            input_type = attr.get("type", "")
            if input_type in {"radio", "checkbox"}:
                self.current_question["type"] = (
                    "mcq_multi" if input_type == "checkbox" else "mcq"
                )
                self.current_question.setdefault("options", [])
                self.current_option = {"value": attr.get("value", ""), "text": ""}
            elif input_type == "text":
                self.current_question["type"] = "text"
                if attr.get("placeholder"):
                    self.current_question["placeholder"] = attr["placeholder"]
            return

        if tag == "span" and self.current_option is not None:
            self.capture = "option"
            self.capture_parts = []
            return

        if tag == "img" and self.current_question is not None and self.in_question_image:
            if attr.get("src"):
                self.current_question["image"] = attr["src"]
            if attr.get("alt"):
                self.current_question["imageAlt"] = attr["alt"]

    def handle_endtag(self, tag: str) -> None:
        if tag == "h1" and self.capture == "title":
            self.title = clean_text("".join(self.capture_parts))
            self.capture = None
            return

        if tag == "div" and self.capture == "section-title":
            if self.current_section is not None:
                self.current_section["title"] = clean_text("".join(self.capture_parts))
            self.capture = None
            return

        if tag == "div" and self.capture == "question-label":
            if self.current_question is not None:
                self.current_question["label"] = clean_text("".join(self.capture_parts))
            self.capture = None
            return

        if tag == "span" and self.capture == "option":
            if self.current_question is not None and self.current_option is not None:
                self.current_option["text"] = clean_text("".join(self.capture_parts))
                self.current_question.setdefault("options", []).append(self.current_option)
            self.current_option = None
            self.capture = None
            return

        if tag == "div" and self.capture == "hint":
            if self.current_question is not None:
                self.current_question["hint"] = clean_text("".join(self.capture_parts))
            self.in_hint = False
            self.capture = None
            return

        if tag == "div" and self.in_question_image:
            self.in_question_image = False

    def handle_data(self, data: str) -> None:
        if self.capture:
            self.capture_parts.append(data)


def load_explanations(path: Path | None) -> dict[str, str]:
    if path is None or not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    explanations: dict[str, str] = {}
    decoder = json.JSONDecoder()
    for match in re.finditer(r'"([^"]+)"\s*:', text):
        qid = match.group(1)
        index = match.end()
        while index < len(text) and text[index].isspace():
            index += 1
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, str):
            explanations[qid] = value
    return explanations


def normalize_answers(sections: list[dict[str, Any]]) -> None:
    for section in sections:
        for question in section.get("questions", []):
            if question.get("type") == "mcq_multi":
                answer = question.get("answer", "")
                question["answer"] = [
                    part.strip() for part in answer.split(",") if part.strip()
                ]
            elif question.get("type") == "text":
                question.pop("answer", None)


def convert_fragment(
    fragment_path: Path,
    output_path: Path,
    set_id: str,
    label: str,
    explanation_path: Path | None,
) -> None:
    parser = FragmentParser()
    parser.feed(fragment_path.read_text(encoding="utf-8"))
    explanations = load_explanations(explanation_path)
    for section in parser.sections:
        for question in section.get("questions", []):
            explanation = explanations.get(question.get("id", ""))
            if explanation:
                question["explanation"] = explanation
    normalize_answers(parser.sections)
    data = {
        "schemaVersion": 1,
        "setId": set_id,
        "label": label,
        "title": parser.title or label,
        "sections": parser.sections,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fragment")
    parser.add_argument("--set-id", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--explanations")
    parser.add_argument("--output")
    args = parser.parse_args()

    fragment_path = Path(args.fragment)
    output_path = Path(args.output) if args.output else fragment_path.with_suffix("").with_suffix(".json")
    explanation_path = Path(args.explanations) if args.explanations else None
    convert_fragment(fragment_path, output_path, args.set_id, args.label, explanation_path)
    print(f"OK: generated {output_path}")


if __name__ == "__main__":
    main()
