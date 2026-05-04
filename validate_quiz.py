#!/usr/bin/env python3
import argparse
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


class QuizParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.questions = []
        self.current = None
        self.question_div_depth = 0
        self.in_label = False
        self.label_div_depth = 0
        self.label_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = set(attrs.get("class", "").split())
        if tag == "div" and "question" in classes:
            self.current = {
                "id": attrs.get("id", ""),
                "answer": attrs.get("data-answer", ""),
                "keywords": attrs.get("data-keywords", ""),
                "radio_names": [],
                "radio_values": [],
                "checkbox_names": [],
                "checkbox_values": [],
                "text_inputs": 0,
                "line": self.getpos()[0],
            }
            self.questions.append(self.current)
            self.question_div_depth = 1
        elif self.current and tag == "div":
            self.question_div_depth += 1
            if "question-label" in classes:
                self.in_label = True
                self.label_div_depth = 1
                self.label_parts = []
        elif self.current and tag == "div" and "question-label" in classes:
            self.in_label = True
            self.label_parts = []
        elif self.current and tag == "input":
            input_type = attrs.get("type", "")
            if input_type == "radio":
                self.current["radio_names"].append(attrs.get("name", ""))
                self.current["radio_values"].append(attrs.get("value", ""))
            elif input_type == "checkbox":
                self.current["checkbox_names"].append(attrs.get("name", ""))
                self.current["checkbox_values"].append(attrs.get("value", ""))
            elif input_type == "text":
                self.current["text_inputs"] += 1

    def handle_endtag(self, tag):
        if tag == "div" and self.in_label:
            self.label_div_depth -= 1
            if self.current is not None:
                self.current["label"] = " ".join("".join(self.label_parts).split())
            if self.label_div_depth <= 0:
                self.in_label = False
        if tag == "div" and self.current is not None:
            self.question_div_depth -= 1
            if self.question_div_depth <= 0:
                self.current = None

    def handle_data(self, data):
        if self.in_label:
            self.label_parts.append(data)


def parse_explanation_ids(path):
    if not path or not path.exists():
        return set()
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r"[\"']([^\"']+)[\"']\s*:", text))


def validate_fragment(path, explanation_path=None):
    parser = QuizParser()
    parser.feed(path.read_text(encoding="utf-8"))
    errors = []
    warnings = []
    seen = set()

    for question in parser.questions:
        qid = question["id"]
        prefix = f"{path}:{question['line']}"
        if not qid:
            errors.append(f"{prefix}: question is missing id")
            continue
        if qid in seen:
            errors.append(f"{prefix}: duplicate question id '{qid}'")
        seen.add(qid)
        if not question["answer"]:
            errors.append(f"{prefix}: question '{qid}' is missing data-answer")
        if question["radio_values"]:
            names = set(question["radio_names"])
            if names != {qid}:
                errors.append(f"{prefix}: radio name should equal question id '{qid}'")
            if question["answer"] not in question["radio_values"]:
                errors.append(f"{prefix}: data-answer '{question['answer']}' does not match any radio value")
        elif question["checkbox_values"]:
            names = set(question["checkbox_names"])
            if names != {qid}:
                errors.append(f"{prefix}: checkbox name should equal question id '{qid}'")
            answer_parts = [part.strip() for part in question["answer"].split(",") if part.strip()]
            if not answer_parts:
                errors.append(f"{prefix}: checkbox question '{qid}' must list at least one correct answer")
            unknown = sorted(set(answer_parts) - set(question["checkbox_values"]))
            if unknown:
                errors.append(
                    f"{prefix}: data-answer values {unknown!r} do not match checkbox values"
                )
        elif question["text_inputs"]:
            if question["answer"] == "text" and not question["keywords"]:
                warnings.append(f"{prefix}: text question '{qid}' has data-answer='text' but no data-keywords")
        else:
            warnings.append(f"{prefix}: question '{qid}' has no radio or text input")

    explanation_ids = parse_explanation_ids(explanation_path)
    if explanation_ids:
        missing_questions = sorted(explanation_ids - seen)
        missing_explanations = sorted(seen - explanation_ids)
        for qid in missing_questions:
            warnings.append(f"{explanation_path}: explanation id '{qid}' has no matching question")
        for qid in missing_explanations:
            warnings.append(f"{path}: question '{qid}' has no explanation")

    return parser.questions, errors, warnings


def main():
    argp = argparse.ArgumentParser(description="Validate quiz fragment HTML files.")
    argp.add_argument("paths", nargs="*", help="Specific .frag.html files to validate")
    argp.add_argument("--all", action="store_true", help="Validate all quiz_sets/**/*.frag.html files")
    args = argp.parse_args()

    root = Path(__file__).resolve().parent
    paths = [Path(p) for p in args.paths]
    if args.all or not paths:
        paths = sorted((root / "quiz_sets").glob("**/*.frag.html"))

    total_questions = 0
    all_errors = []
    all_warnings = []
    for path in paths:
        explanation_candidates = list(path.parent.glob(f"{path.stem.replace('.frag', '')}*.explanations.js"))
        explanation_path = explanation_candidates[0] if explanation_candidates else None
        questions, errors, warnings = validate_fragment(path, explanation_path)
        total_questions += len(questions)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    for warning in all_warnings:
        print(f"WARNING: {warning}")
    for error in all_errors:
        print(f"ERROR: {error}")

    print(f"Validated {len(paths)} fragment(s), {total_questions} question(s).")
    if all_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
