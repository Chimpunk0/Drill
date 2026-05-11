#!/usr/bin/env python3
"""Generate quiz fragment, explanations, and embed files from a simple YAML spec.

The parser intentionally supports a small YAML subset tailored for quiz specs:
- mappings via `key: value`
- nested mappings/lists by indentation
- lists via `- item`
- quoted or plain scalar strings

If the input is valid JSON, it is accepted as well because JSON is a YAML subset.
"""

from __future__ import annotations

import argparse
import ast
import json
import re
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Any

from validate_quiz import validate_fragment


class SpecError(ValueError):
    """Raised when the quiz spec is invalid."""


@dataclass
class Line:
    number: int
    indent: int
    content: str


class SimpleYamlParser:
    """Small YAML subset parser good enough for the bundled example format."""

    def __init__(self, text: str):
        self.lines = self._prepare_lines(text)

    @staticmethod
    def _prepare_lines(text: str) -> list[Line]:
        prepared: list[Line] = []
        for number, raw_line in enumerate(text.splitlines(), start=1):
            if not raw_line.strip():
                continue
            stripped = raw_line.lstrip(" ")
            if stripped.startswith("#"):
                continue
            indent = len(raw_line) - len(stripped)
            if "\t" in raw_line[:indent]:
                raise SpecError(
                    f"Line {number}: tabs are not supported for indentation."
                )
            prepared.append(Line(number=number, indent=indent, content=stripped))
        return prepared

    def parse(self) -> Any:
        if not self.lines:
            raise SpecError("Spec is empty.")
        value, index = self._parse_block(0, self.lines[0].indent)
        if index != len(self.lines):
            line = self.lines[index]
            raise SpecError(f"Line {line.number}: unexpected content '{line.content}'.")
        return value

    def _parse_block(self, index: int, indent: int) -> tuple[Any, int]:
        line = self.lines[index]
        if line.indent != indent:
            raise SpecError(
                f"Line {line.number}: expected indentation {indent}, got {line.indent}."
            )
        if line.content.startswith("- "):
            return self._parse_list(index, indent)
        return self._parse_map(index, indent)

    def _parse_map(self, index: int, indent: int) -> tuple[dict[str, Any], int]:
        result: dict[str, Any] = {}
        while index < len(self.lines):
            line = self.lines[index]
            if line.indent < indent:
                break
            if line.indent > indent:
                raise SpecError(
                    f"Line {line.number}: unexpected indentation inside mapping."
                )
            if line.content.startswith("- "):
                raise SpecError(
                    f"Line {line.number}: list item found where mapping key was expected."
                )

            key, has_nested, raw_value = self._split_mapping(line)
            index += 1
            if has_nested:
                if index < len(self.lines) and self.lines[index].indent > indent:
                    value, index = self._parse_block(index, self.lines[index].indent)
                else:
                    value = ""
            else:
                value = self._parse_scalar(raw_value, line.number)
            result[key] = value
        return result, index

    def _parse_list(self, index: int, indent: int) -> tuple[list[Any], int]:
        result: list[Any] = []
        while index < len(self.lines):
            line = self.lines[index]
            if line.indent < indent:
                break
            if line.indent > indent:
                raise SpecError(
                    f"Line {line.number}: unexpected indentation inside list."
                )
            if not line.content.startswith("- "):
                break

            item_rest = line.content[2:].lstrip()
            index += 1
            if not item_rest:
                if index < len(self.lines) and self.lines[index].indent > indent:
                    value, index = self._parse_block(index, self.lines[index].indent)
                else:
                    value = {}
                result.append(value)
                continue

            if self._looks_like_mapping(item_rest):
                key, has_nested, raw_value = self._split_mapping_content(
                    item_rest, line.number
                )
                value: dict[str, Any] = {}
                if has_nested:
                    if index < len(self.lines) and self.lines[index].indent > indent:
                        nested, index = self._parse_block(
                            index, self.lines[index].indent
                        )
                    else:
                        nested = ""
                    value[key] = nested
                else:
                    value[key] = self._parse_scalar(raw_value, line.number)

                if index < len(self.lines) and self.lines[index].indent > indent:
                    extra, index = self._parse_map(index, self.lines[index].indent)
                    value.update(extra)
                result.append(value)
            else:
                result.append(self._parse_scalar(item_rest, line.number))
                if index < len(self.lines) and self.lines[index].indent > indent:
                    next_line = self.lines[index]
                    raise SpecError(
                        f"Line {next_line.number}: unexpected nested block after scalar list item."
                    )
        return result, index

    @staticmethod
    def _looks_like_mapping(content: str) -> bool:
        return bool(re.match(r"^[A-Za-z0-9_.\/-]+\s*:", content))

    def _split_mapping(self, line: Line) -> tuple[str, bool, str]:
        return self._split_mapping_content(line.content, line.number)

    @staticmethod
    def _split_mapping_content(content: str, number: int) -> tuple[str, bool, str]:
        if ":" not in content:
            raise SpecError(f"Line {number}: expected 'key: value'.")
        key, raw_value = content.split(":", 1)
        key = key.strip()
        if not key:
            raise SpecError(f"Line {number}: empty mapping key.")
        if raw_value == "":
            return key, True, ""
        return key, False, raw_value.lstrip()

    @staticmethod
    def _parse_scalar(raw_value: str, number: int) -> Any:
        value = raw_value.strip()
        if not value:
            return ""
        if value[0] in {'"', "'"}:
            try:
                return ast.literal_eval(value)
            except (SyntaxError, ValueError) as exc:
                raise SpecError(
                    f"Line {number}: invalid quoted string {value!r}."
                ) from exc
        if value == "true":
            return True
        if value == "false":
            return False
        if value == "null":
            return None
        return value


def load_spec(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = SimpleYamlParser(text).parse()
    if not isinstance(data, dict):
        raise SpecError("Top-level spec must be an object / mapping.")
    return data


def normalized_html_text(item: dict[str, Any], plain_key: str, html_key: str) -> str:
    if html_key in item:
        html_value = item[html_key]
        if not isinstance(html_value, str):
            raise SpecError(f"'{html_key}' must be a string.")
        return html_value
    plain_value = item.get(plain_key, "")
    if not isinstance(plain_value, str):
        raise SpecError(f"'{plain_key}' must be a string.")
    return escape(plain_value)


def indent_block(text: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else "" for line in text.splitlines())


def ensure_list(value: Any, field_name: str) -> list[Any]:
    if not isinstance(value, list):
        raise SpecError(f"'{field_name}' must be a list.")
    return value


def ensure_dict(value: Any, field_name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise SpecError(f"'{field_name}' must be an object / mapping.")
    return value


def normalize_mcq_options(raw_options: Any) -> list[tuple[str, str]]:
    if isinstance(raw_options, dict):
        options: list[tuple[str, str]] = []
        for key, value in raw_options.items():
            if not isinstance(key, str) or not isinstance(value, str):
                raise SpecError("MCQ options mapping must use string keys and values.")
            options.append((key, value))
        return options

    if isinstance(raw_options, list):
        options = []
        for item in raw_options:
            option = ensure_dict(item, "mcq option")
            value = option.get("value")
            text = option.get("text")
            if not isinstance(value, str) or not isinstance(text, str):
                raise SpecError("Each MCQ option needs string 'value' and 'text'.")
            options.append((value, text))
        return options

    raise SpecError("'options' must be a mapping or list.")


def normalize_multi_answers(
    raw_answer: Any, qid: str, valid_values: list[str]
) -> list[str]:
    if isinstance(raw_answer, str):
        answers = [part.strip() for part in raw_answer.split(",") if part.strip()]
    elif isinstance(raw_answer, list):
        answers = []
        for item in raw_answer:
            if not isinstance(item, str) or not item.strip():
                raise SpecError(
                    f"Question {qid}: every multi-answer value must be a string."
                )
            answers.append(item.strip())
    else:
        raise SpecError(
            f"Question {qid}: multi-answer question needs 'answer' as a string or list."
        )

    if not answers:
        raise SpecError(
            f"Question {qid}: multi-answer question needs at least one correct option."
        )

    unknown = sorted(set(answers) - set(valid_values))
    if unknown:
        raise SpecError(
            f"Question {qid}: answer values {unknown!r} are not present in options."
        )
    return answers


def build_fragment(spec: dict[str, Any]) -> tuple[str, dict[str, str]]:
    title = spec.get("title")
    if not isinstance(title, str) or not title.strip():
        raise SpecError("'title' is required and must be a non-empty string.")

    sections = ensure_list(spec.get("sections"), "sections")
    if not sections:
        raise SpecError("At least one section is required.")

    explanations: dict[str, str] = {}
    html_parts = [f"                    <h1>{escape(title)}</h1>", ""]

    for section_index, raw_section in enumerate(sections, start=1):
        section = ensure_dict(raw_section, f"sections[{section_index - 1}]")
        section_id = section.get("id") or f"sec_{section_index}"
        if not isinstance(section_id, str) or not section_id.strip():
            raise SpecError(f"Section {section_index}: invalid 'id'.")
        section_title_html = normalized_html_text(section, "title", "title_html")
        questions = ensure_list(
            section.get("questions"), f"sections[{section_index - 1}].questions"
        )
        if not questions:
            raise SpecError(
                f"Section {section_index}: at least one question is required."
            )

        html_parts.append(
            "\n".join(
                [
                    f'                    <div class="section" id="{escape(section_id, quote=True)}" data-section="{section_index}">',
                    '                        <div class="section-title">',
                    indent_block(section_title_html, 28),
                    "                        </div>",
                    "",
                ]
            )
        )

        for question_index, raw_question in enumerate(questions, start=1):
            question = ensure_dict(
                raw_question,
                f"sections[{section_index - 1}].questions[{question_index - 1}]",
            )
            qid = question.get("id") or f"q{section_index}_{question_index}"
            if not isinstance(qid, str) or not qid.strip():
                raise SpecError(
                    f"Question {section_index}.{question_index}: invalid 'id'."
                )
            qtype = question.get("type")
            if qtype not in {"mcq", "mcq_multi", "text"}:
                raise SpecError(
                    f"Question {qid}: 'type' must be 'mcq', 'mcq_multi', or 'text'."
                )

            label_html = normalized_html_text(question, "label", "label_html")
            image_html = None
            if "image_html" in question:
                if not isinstance(question["image_html"], str):
                    raise SpecError(f"Question {qid}: 'image_html' must be a string.")
                image_html = question["image_html"]
            elif "image" in question:
                image = question["image"]
                if not isinstance(image, str) or not image.strip():
                    raise SpecError(
                        f"Question {qid}: 'image' must be a non-empty string."
                    )
                image_alt = question.get("image_alt", "")
                if not isinstance(image_alt, str):
                    raise SpecError(f"Question {qid}: 'image_alt' must be a string.")
                image_html = (
                    f'<img class="question-image" src="{escape(image, quote=True)}" '
                    f'alt="{escape(image_alt, quote=True)}" loading="lazy" />'
                )
            explanation = question.get("explanation", "")
            if explanation is None:
                explanation = ""
            if not isinstance(explanation, str):
                raise SpecError(f"Question {qid}: 'explanation' must be a string.")
            explanations[qid] = explanation

            if qtype in {"mcq", "mcq_multi"}:
                answer = question.get("answer")
                options = normalize_mcq_options(question.get("options"))
                values = [value for value, _ in options]
                input_type = "radio"
                data_answer = ""
                if qtype == "mcq":
                    if not isinstance(answer, str) or not answer:
                        raise SpecError(f"Question {qid}: MCQ needs string 'answer'.")
                    if answer not in values:
                        raise SpecError(
                            f"Question {qid}: answer '{answer}' is not present in options."
                        )
                    data_answer = answer
                else:
                    input_type = "checkbox"
                    answers = normalize_multi_answers(answer, qid, values)
                    data_answer = ",".join(answers)

                option_lines = []
                for value, text in options:
                    option_lines.extend(
                        [
                            '                            <label class="option">',
                            f'                                <input type="{input_type}" name="{escape(qid, quote=True)}" value="{escape(value, quote=True)}" /><span>{escape(text)}</span>',
                            "                            </label>",
                        ]
                    )

                html_parts.append(
                    "\n".join(
                        [
                            f'                        <div class="question" id="{escape(qid, quote=True)}" data-answer="{escape(data_answer, quote=True)}">',
                            '                            <div class="question-label">',
                            indent_block(label_html, 32),
                            "                            </div>",
                            *(
                                [
                                    '                            <div class="question-image">',
                                    indent_block(image_html, 32),
                                    "                            </div>",
                                ]
                                if image_html
                                else []
                            ),
                            '                            <div class="options">',
                            *option_lines,
                            "                            </div>",
                            f'                            <div class="feedback" id="{escape(qid, quote=True)}-fb"></div>',
                            "                        </div>",
                            "",
                        ]
                    )
                )
                continue

            keywords = ensure_list(question.get("keywords"), f"{qid}.keywords")
            keyword_values: list[str] = []
            for keyword in keywords:
                if not isinstance(keyword, str) or not keyword.strip():
                    raise SpecError(
                        f"Question {qid}: every keyword must be a non-empty string."
                    )
                keyword_values.append(keyword.strip())
            if not keyword_values:
                raise SpecError(
                    f"Question {qid}: text question needs at least one keyword."
                )

            placeholder = question.get("placeholder", "Napíšte odpoveď...")
            if not isinstance(placeholder, str):
                raise SpecError(f"Question {qid}: 'placeholder' must be a string.")

            hint_html = None
            if "hint_html" in question:
                if not isinstance(question["hint_html"], str):
                    raise SpecError(f"Question {qid}: 'hint_html' must be a string.")
                hint_html = question["hint_html"]
            elif "hint" in question:
                if not isinstance(question["hint"], str):
                    raise SpecError(f"Question {qid}: 'hint' must be a string.")
                hint_html = escape(question["hint"])

            question_lines = [
                f'                        <div class="question" id="{escape(qid, quote=True)}" data-answer="text" data-keywords="{escape(",".join(keyword_values), quote=True)}">',
                '                            <div class="question-label">',
                indent_block(label_html, 32),
                "                            </div>",
            ]
            if image_html:
                question_lines.extend(
                    [
                        '                            <div class="question-image">',
                        indent_block(image_html, 32),
                        "                            </div>",
                    ]
                )
            question_lines.extend(
                [
                    '                            <div class="text-input-wrap">',
                    f'                                <input type="text" id="{escape(qid, quote=True)}-input" placeholder="{escape(placeholder, quote=True)}" autocomplete="off" spellcheck="false" />',
                    "                            </div>",
                ]
            )
            if hint_html:
                question_lines.extend(
                    [
                        '                            <div class="text-answer-hint">',
                        indent_block(hint_html, 32),
                        "                            </div>",
                    ]
                )
            question_lines.extend(
                [
                    f'                            <div class="feedback" id="{escape(qid, quote=True)}-fb"></div>',
                    "                        </div>",
                    "",
                ]
            )
            html_parts.append("\n".join(question_lines))

        html_parts.append("                    </div>")
        html_parts.append("")

    return "\n".join(html_parts).rstrip() + "\n", explanations


def build_explanations_js(set_id: str, explanations: dict[str, str]) -> str:
    header = [
        f"// Generated from quiz spec for {set_id}",
        "// Do not edit by hand; regenerate via python3 generate_quiz_set.py <spec>",
        "",
        "window.QUIZ_EXPLANATIONS = {",
    ]
    entries = [
        f"    {qid}: {json.dumps(text, ensure_ascii=False)},"
        for qid, text in explanations.items()
    ]
    footer = ["};", ""]
    return "\n".join(header + entries + footer)


def build_embed_js(set_id: str, fragment_html: str) -> str:
    return (
        f"// Generated from quiz_sets/{set_id}.frag.html\n"
        "// Do not edit by hand; regenerate via python3 generate_quiz_set.py <spec>\n"
        "window.QUIZ_FRAGMENT_HTML = "
        + json.dumps(fragment_html, ensure_ascii=False)
        + ";\n"
    )


def build_config_snippet(set_id: str, label: str) -> str:
    return (
        "{\n"
        f'    id: "{set_id}",\n'
        f'    label: "{label}",\n'
        f'    fragEmbed: "quiz_sets/{set_id}.frag.embed.js",\n'
        f'    explanations: "quiz_sets/{set_id}.explanations.js",\n'
        "},"
    )


def register_in_config(config_path: Path, set_id: str, label: str) -> bool:
    if not config_path.is_file():
        raise SpecError(f"Config file not found: {config_path}")

    config_text = config_path.read_text(encoding="utf-8")
    if f'id: "{set_id}"' in config_text:
        return False

    marker = "window.QUIZ_SETS = window.QUIZ_SETS || ["
    start = config_text.find(marker)
    if start == -1:
        raise SpecError(f"Could not find QUIZ_SETS array in {config_path.name}.")

    array_start = start + len(marker)
    array_end = config_text.find("];", array_start)
    if array_end == -1:
        raise SpecError(
            f"Could not find the end of QUIZ_SETS array in {config_path.name}."
        )

    entry = "\n    " + build_config_snippet(set_id, label).replace("\n", "\n    ")
    existing_body = config_text[array_start:array_end]
    if existing_body.strip():
        new_body = existing_body.rstrip() + entry + "\n"
    else:
        new_body = entry + "\n"

    updated = config_text[:array_start] + new_body + config_text[array_end:]
    config_path.write_text(updated, encoding="utf-8")
    return True


def write_outputs(
    root: Path, set_id: str, fragment_html: str, explanations_js: str
) -> tuple[Path, Path, Path]:
    frag_path = root / "quiz_sets" / f"{set_id}.frag.html"
    expl_path = root / "quiz_sets" / f"{set_id}.explanations.js"
    embed_path = root / "quiz_sets" / f"{set_id}.frag.embed.js"
    frag_path.parent.mkdir(parents=True, exist_ok=True)
    frag_path.write_text(fragment_html, encoding="utf-8")
    expl_path.write_text(explanations_js, encoding="utf-8")
    embed_path.write_text(build_embed_js(set_id, fragment_html), encoding="utf-8")
    return frag_path, expl_path, embed_path


def validate_generated(frag_path: Path, expl_path: Path) -> None:
    _, errors, warnings = validate_fragment(frag_path, expl_path)
    for warning in warnings:
        print(f"WARNING: {warning}")
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate quiz set files from a simple YAML spec."
    )
    parser.add_argument("spec", help="Path to .yaml/.yml/.json quiz spec")
    parser.add_argument(
        "--output-root",
        help="Root directory containing quiz_sets/ (defaults to this repo root).",
    )
    parser.add_argument(
        "--no-register-config",
        action="store_true",
        help="Do not add the generated quiz set to confg.js.",
    )
    args = parser.parse_args()

    script_root = Path(__file__).resolve().parent
    output_root = Path(args.output_root).resolve() if args.output_root else script_root
    spec_path = Path(args.spec).resolve()

    spec = load_spec(spec_path)
    set_id = spec.get("set_id")
    if not isinstance(set_id, str) or not set_id.strip():
        raise SpecError("'set_id' is required and must be a non-empty string.")

    fragment_html, explanations = build_fragment(spec)
    explanations_js = build_explanations_js(set_id, explanations)
    frag_path, expl_path, embed_path = write_outputs(
        output_root, set_id, fragment_html, explanations_js
    )
    validate_generated(frag_path, expl_path)

    print(f"OK: generated {frag_path}")
    print(f"OK: generated {expl_path}")
    print(f"OK: generated {embed_path}")

    label = spec.get("label")
    if isinstance(label, str) and label.strip():
        if args.no_register_config:
            print("\nSuggested confg.js entry:")
            print(build_config_snippet(set_id, label))
        else:
            config_path = output_root / "confg.js"
            added = register_in_config(config_path, set_id, label)
            if added:
                print(f"OK: registered {set_id} in {config_path}")
            else:
                print(f"INFO: {set_id} is already registered in {config_path}")


if __name__ == "__main__":
    try:
        main()
    except SpecError as exc:
        raise SystemExit(f"Spec error: {exc}") from exc
