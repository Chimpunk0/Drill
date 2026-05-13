import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    evaluateTextKeywordAnswer,
    parseTextKeywords,
} from "../src/quiz/quiz.js";

describe("parseTextKeywords", () => {
    it("preserves JSON keyword arrays, including commas inside alternatives", () => {
        const keywords = JSON.stringify([
            "git checkout main; git merge devel",
            "git switch main; git merge devel",
            "git checkout main && git merge devel",
        ]);

        assert.deepEqual(parseTextKeywords(keywords), [
            "git checkout main; git merge devel",
            "git switch main; git merge devel",
            "git checkout main && git merge devel",
        ]);
    });

    it("still supports legacy comma-separated keyword strings", () => {
        assert.deepEqual(parseTextKeywords("checkout,switch"), [
            "checkout",
            "switch",
        ]);
    });
});

describe("evaluateTextKeywordAnswer", () => {
    it("requires ordered numeric sequence answers to match exactly", () => {
        const keywords = "1,3,4,2,1, 3, 4, 2";

        assert.equal(
            evaluateTextKeywordAnswer("1, 3, 4, 2", keywords).isCorrect,
            true,
        );
        assert.equal(
            evaluateTextKeywordAnswer("1 3 4 2", keywords).isCorrect,
            true,
        );
        assert.equal(
            evaluateTextKeywordAnswer("2, 3, 1, 4", keywords).isCorrect,
            false,
        );
        assert.equal(
            evaluateTextKeywordAnswer("1, 3, 4", keywords).isCorrect,
            false,
        );
    });

    it("accepts one complete alternative answer", () => {
        const keywords = JSON.stringify([
            "git branch hotfix dc36a17",
            "git checkout -b hotfix dc36a17",
            "git switch -c hotfix dc36a17",
        ]);

        assert.equal(
            evaluateTextKeywordAnswer(
                "git switch -c hotfix dc36a17",
                keywords,
            ).isCorrect,
            true,
        );
        assert.equal(
            evaluateTextKeywordAnswer("git switch hotfix", keywords).isCorrect,
            false,
        );
    });

    it("supports short synonym answers in contains-any mode", () => {
        const keywords = JSON.stringify(["checkout", "switch"]);

        assert.equal(evaluateTextKeywordAnswer("switch", keywords).isCorrect, true);
        assert.equal(evaluateTextKeywordAnswer("branch", keywords).isCorrect, false);
    });

    it("can require all listed answer parts when configured", () => {
        const keywords = JSON.stringify(["rozsah", "termín dodání"]);

        assert.deepEqual(
            evaluateTextKeywordAnswer(
                "rozsah, termín dodání",
                keywords,
                "contains_all",
            ),
            {
                isCorrect: true,
                matchedCount: 2,
                totalCount: 2,
                mode: "contains_all",
            },
        );
        assert.equal(
            evaluateTextKeywordAnswer("rozsah", keywords, "contains_all")
                .isCorrect,
            false,
        );
    });
});
