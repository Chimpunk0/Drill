// Evaluation Functions
function buildFeedbackHTML(
    qId,
    statusText,
    cssClass,
    explanation,
    correctAnswerText,
    extraText = null,
) {
    let html = `<div class="feedback ${cssClass} feedback-visible">`;
    html += `<span>${statusText}</span>`;
    if (extraText) {
        html += `<div class="feedback-partial">${escapeHtml(extraText)}</div>`;
    }
    if (correctAnswerText) {
        html += `<div class="feedback-correct-answer">Správna odpoveď: <strong>${escapeHtml(correctAnswerText)}</strong></div>`;
    }
    if (explanation) {
        html += `<div class="feedback-explanation">${escapeHtml(explanation)}</div>`;
    }
    html += `</div>`;
    return html;
}

function evaluateQuiz() {
    let score = 0;
    let total = 0;
    let answered = 0;
    incorrectQuestionIds = [];

    const visibleSections = document.querySelectorAll(
        '.section:not([style*="display: none"])',
    );
    visibleSections.forEach((sec) => {
        const questions = practiceMode
            ? sec.querySelectorAll(".question")
            : sec.querySelectorAll(
                  ".question:not([style*='display: none'])",
              );
        questions.forEach((q) => {
            total++;
            const qId = q.id;
            const feedbackEl = document.getElementById(`${qId}-fb`);
            const correctVal = q.getAttribute("data-answer");
            const keywords = q.getAttribute("data-keywords");
            const explanation = getExplanation(
                qId,
                getAutoExplanationFromQuestionEl(q),
            );
            if (!feedbackEl) return;

            if (q.querySelector('input[type="radio"]')) {
                const selected = document.querySelector(
                    `input[name="${qId}"]:checked`,
                );
                const correctText = getOptionText(q, correctVal);
                if (!selected) {
                    incorrectQuestionIds.push(qId);
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Nezodpovedané.",
                            "incorrect",
                            explanation,
                            correctText,
                        );
                } else if (selected.value === correctVal) {
                    score++;
                    answered++;
                    feedbackEl.outerHTML = buildFeedbackHTML(
                        qId,
                        "Správne!",
                        "correct",
                        explanation,
                        null,
                    );
                } else {
                    answered++;
                    incorrectQuestionIds.push(qId);
                    feedbackEl.outerHTML = buildFeedbackHTML(
                        qId,
                        "Nesprávne.",
                        "incorrect",
                        explanation,
                        correctText,
                    );
                }
            } else if (q.querySelector('input[type="checkbox"]')) {
                const selected = Array.from(
                    q.querySelectorAll(`input[type="checkbox"][name="${qId}"]:checked`),
                ).map((cb) => cb.value);
                const correctValues = parseMultiAnswerValues(correctVal);
                const correctText = getOptionTextList(q, correctValues);
                const partialText = getPartialMultiAnswerText(
                    selected,
                    correctValues,
                );
                setQuestionMultiOptionStates(q, selected, correctValues);
                const isCorrect =
                    selected.length === correctValues.length &&
                    selected.every((value) => correctValues.includes(value));
                if (selected.length === 0) {
                    incorrectQuestionIds.push(qId);
                    feedbackEl.outerHTML = buildFeedbackHTML(
                        qId,
                        "Nezodpovedané.",
                        "incorrect",
                        explanation,
                        correctText,
                    );
                } else {
                    answered++;
                    if (isCorrect) {
                        score++;
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Správne!",
                            "correct",
                            explanation,
                            null,
                        );
                    } else {
                        incorrectQuestionIds.push(qId);
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Nesprávne.",
                            "incorrect",
                            explanation,
                            correctText,
                            partialText,
                        );
                    }
                }
            } else if (q.querySelector('input[type="text"]')) {
                const input = document.getElementById(
                    `${qId}-input`,
                );
                const userVal = input
                    ? input.value.trim().toLowerCase()
                    : "";
                // Build accepted answers list for display
                const acceptedAnswers = keywords
                    ? keywords.split(",").map((k) => k.trim())
                    : correctVal !== "text"
                      ? [correctVal]
                      : [];

                if (!userVal) {
                    incorrectQuestionIds.push(qId);
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Nezodpovedané.",
                            "incorrect",
                            explanation,
                            acceptedAnswers.length
                                ? acceptedAnswers[0]
                                : null,
                        );
                } else {
                    let isCorrect = false;
                    let partialText = null;
                    if (keywords) {
                        const evaluation = evaluateTextKeywordAnswer(
                            userVal,
                            keywords,
                        );
                        isCorrect = evaluation.isCorrect;
                        partialText = getPartialTextKeywordAnswerText(
                            evaluation.matchedCount,
                            evaluation.totalCount,
                        );
                    } else if (correctVal !== "text") {
                        isCorrect =
                            userVal === correctVal.toLowerCase();
                    }
                    answered++;
                    if (isCorrect) {
                        score++;
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Správne!",
                            "correct",
                            explanation,
                            null,
                        );
                    } else {
                        incorrectQuestionIds.push(qId);
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "Nesprávne.",
                            "incorrect",
                            explanation,
                            acceptedAnswers.length
                                ? acceptedAnswers.join(" / ")
                                : null,
                            partialText,
                            partialText,
                        );
                    }
                }
            }
        });
    });

    const resContainer =
        document.getElementById("result-container");
    const resText = document.getElementById("result-text");
    const progressFill = document.getElementById("progress-fill");

    if (total === 0) {
        resText.innerHTML = `Žiadne otázky na vyhodnotenie.`;
        progressFill.style.width = "0%";
    } else {
        const percent = Math.round((score / total) * 100);
        let message = "";
        if (percent >= 90) message = "Výborné!";
        else if (percent >= 70) message = "Dobré!";
        else if (percent >= 50) message = "Treba precvičiť";
        else message = "Nevzdávaj to!";

        const wrongCount = incorrectQuestionIds.length;
        resText.innerHTML = `
            ${message}<br>
            Výsledok: <strong>${score} / ${total}</strong> (${percent}%)<br>
            <small>Zodpovedané: ${answered}/${total} | Nesprávne: ${wrongCount}</small>
        `;
        progressFill.style.width = `${percent}%`;
    }
    saveWrongAnswerIds(incorrectQuestionIds);
    resContainer.style.display = "block";
    resContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
    });
}

function clearQuiz() {
    document
        .querySelectorAll('input[type="radio"]')
        .forEach((r) => (r.checked = false));
    document
        .querySelectorAll('input[type="checkbox"]')
        .forEach((c) => (c.checked = false));
    document
        .querySelectorAll('input[type="text"]')
        .forEach((i) => (i.value = ""));
    document
        .querySelectorAll(".option, .fc-option")
        .forEach((el) =>
            el.classList.remove("partial-correct", "correct", "wrong"),
        );
    // Restore feedback divs (they may have been replaced by outerHTML)
    document.querySelectorAll(".question").forEach((q) => {
        const existing = document.getElementById(`${q.id}-fb`);
        if (!existing) {
            const fb = document.createElement("div");
            fb.className = "feedback";
            fb.id = `${q.id}-fb`;
            q.appendChild(fb);
        } else {
            existing.style.display = "none";
            existing.innerHTML = "";
        }
    });
    document.querySelectorAll(".feedback").forEach((fb) => {
        fb.style.display = "none";
        fb.innerHTML = "";
    });
    document.getElementById("result-container").style.display =
        "none";
    document.getElementById("progress-fill").style.width = "0%";
    incorrectQuestionIds = [];
    updateWrongAnswerControls();
    clearStorage();
}

function getOptionText(questionEl, val) {
    const input = questionEl.querySelector(`input[value="${val}"]`);
    if (input && input.nextElementSibling) {
        const text = input.nextElementSibling.textContent;
        return text.length > 100
            ? text.substring(0, 100) + "..."
            : text;
    }
    return val;
}

function parseMultiAnswerValues(answer) {
    return answer
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

function getOptionTextList(questionEl, values) {
    return values.map((val) => getOptionText(questionEl, val)).join(" / ");
}

function getPartialMultiAnswerText(selectedValues, correctValues) {
    const matchedCount = selectedValues.filter((value) =>
        correctValues.includes(value),
    ).length;
    if (matchedCount <= 0 || matchedCount >= correctValues.length) {
        return null;
    }
    return `Označené správne odpovede: ${matchedCount}/${correctValues.length}`;
}

function parseTextKeywords(keywords) {
    return (keywords || "")
        .split(",")
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean);
}

function normalizeTextAnswer(value) {
    return String(value || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

function evaluateTextKeywordAnswer(userVal, keywords) {
    const keywordList = parseTextKeywords(keywords);
    const normalizedUser = normalizeTextAnswer(userVal);
    const matchedKeywords = keywordList.filter((keyword) =>
        normalizedUser.includes(normalizeTextAnswer(keyword)),
    );
    return {
        isCorrect:
            keywordList.length > 0 &&
            matchedKeywords.length > 0,
        matchedCount: matchedKeywords.length,
        totalCount: keywordList.length,
    };
}

function getPartialTextKeywordAnswerText(matchedCount, totalCount) {
    if (
        totalCount <= 1 ||
        matchedCount <= 0 ||
        matchedCount >= totalCount
    ) {
        return null;
    }
    return `Zadané správne časti odpovede: ${matchedCount}/${totalCount}`;
}

function setQuestionMultiOptionStates(questionEl, selectedValues, correctValues) {
    if (!questionEl) return;
    questionEl.querySelectorAll(".option").forEach((optionEl) => {
        optionEl.classList.remove("partial-correct", "correct", "wrong");
        const input = optionEl.querySelector(
            'input[type="radio"], input[type="checkbox"]',
        );
        if (!input) return;
        const value = input.value;
        const isCorrect = correctValues.includes(value);
        const isSelected = selectedValues.includes(value);
        if (isCorrect && !isSelected) {
            optionEl.classList.add("partial-correct");
        } else if (isCorrect && isSelected) {
            optionEl.classList.add("correct");
        } else if (isSelected && !isCorrect) {
            optionEl.classList.add("wrong");
        }
    });
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getAutoExplanationFromQuestionEl(questionEl) {
    if (!questionEl) return null;
    const correctVal = questionEl.getAttribute("data-answer") || "";
    const keywords = questionEl.getAttribute("data-keywords") || "";
    if (questionEl.querySelector('input[type="radio"]')) {
        const correctText = getOptionText(questionEl, correctVal);
        return `Správná odpověď je ${correctText}.`;
    }
    if (questionEl.querySelector('input[type="checkbox"]')) {
        const parts = parseMultiAnswerValues(correctVal);
        const correctText = getOptionTextList(questionEl, parts);
        return `Správné odpovědi jsou ${correctText}.`;
    }
    if (keywords) {
        const accepted = keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        if (accepted.length > 0) {
            return `Akceptuje se odpověď: ${accepted.join(" / ")}.`;
        }
    }
    if (correctVal && correctVal !== "text") {
        return `Správná odpověď je ${correctVal}.`;
    }
    return null;
}

function getAutoExplanationFromFcQuestion(q) {
    if (!q) return null;
    const correctVal = q.correctVal || "";
    if (q.kind === "radio") {
        const match = q.options.find((o) => o.value === correctVal);
        if (match) {
            const tmp = document.createElement("div");
            tmp.innerHTML = match.html;
            return `Správná odpověď je ${tmp.textContent.trim()}.`;
        }
    } else if (q.kind === "checkbox") {
        const values = parseMultiAnswerValues(correctVal);
        const tmp = document.createElement("div");
        const texts = q.options
            .filter((o) => values.includes(o.value))
            .map((o) => {
                tmp.innerHTML = o.html;
                return tmp.textContent.trim();
            });
        if (texts.length > 0) {
            return `Správné odpovědi jsou ${texts.join(" / ")}.`;
        }
    }
    if (q.keywords) {
        const accepted = q.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
        if (accepted.length > 0) {
            return `Akceptuje se odpověď: ${accepted.join(" / ")}.`;
        }
    }
    if (correctVal && correctVal !== "text") {
        return `Správná odpověď je ${correctVal}.`;
    }
    return null;
}

function getExplanation(qId, fallback) {
    return EXPLANATIONS[qId] || fallback || null;
}

Object.assign(window, {
    buildFeedbackHTML,
    evaluateQuiz,
    clearQuiz,
    getOptionText,
    parseMultiAnswerValues,
    getOptionTextList,
    getPartialMultiAnswerText,
    parseTextKeywords,
    normalizeTextAnswer,
    evaluateTextKeywordAnswer,
    getPartialTextKeywordAnswerText,
    setQuestionMultiOptionStates,
    escapeHtml,
    getAutoExplanationFromQuestionEl,
    getAutoExplanationFromFcQuestion,
    getExplanation,
});

export {
    buildFeedbackHTML,
    evaluateQuiz,
    clearQuiz,
    getOptionText,
    parseMultiAnswerValues,
    getOptionTextList,
    getPartialMultiAnswerText,
    parseTextKeywords,
    normalizeTextAnswer,
    evaluateTextKeywordAnswer,
    getPartialTextKeywordAnswerText,
    setQuestionMultiOptionStates,
    escapeHtml,
    getAutoExplanationFromQuestionEl,
    getAutoExplanationFromFcQuestion,
    getExplanation,
};
