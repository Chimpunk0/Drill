const EDITOR_REPO = "Chimpunk0/Drill";
const EDITOR_BASE_BRANCH = "main";

const editorState = {
    draft: null,
    selectedSection: 0,
    selectedQuestion: 0,
    dirty: false,
};

function editorStorageKey() {
    return `quiz_editor_draft_${window.QUIZ_SET_ID || "default"}`;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function toPrettyJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function editorStatus(message, type = "info") {
    const el = document.getElementById("quiz-editor-status");
    if (!el) return;
    el.textContent = message;
    el.dataset.type = type;
}

function getQuizSetFilePath() {
    const set = window.getCurrentQuizSet?.();
    const dataUrl = set?.dataUrl || window.getQuizDataUrl?.() || `quiz_sets/${window.QUIZ_SET_ID}.json`;
    try {
        const url = new URL(dataUrl, window.location.href);
        const path = url.pathname.replace(/^\/+/, "");
        const marker = "quiz_sets/";
        const markerIndex = path.indexOf(marker);
        return markerIndex === -1 ? path : path.slice(markerIndex);
    } catch (e) {
        return dataUrl.replace(/^\.?\//, "");
    }
}

function normalizeDraftData(data) {
    const next = data && typeof data === "object" ? clone(data) : {};
    next.schemaVersion = next.schemaVersion || 1;
    next.setId = next.setId || window.QUIZ_SET_ID || "draft";
    next.label = next.label || window.getCurrentQuizSet?.()?.label || next.setId;
    next.title = next.title || next.label || "Kvíz";
    if (!Array.isArray(next.sections)) next.sections = [];
    next.sections.forEach((section, sectionIndex) => {
        section.id = section.id || `sec_${sectionIndex + 1}`;
        section.title = section.title || `Section ${sectionIndex + 1}`;
        if (!Array.isArray(section.questions)) section.questions = [];
        section.questions.forEach((question, questionIndex) => {
            question.id = question.id || `${section.id}_q${questionIndex + 1}`;
            question.type = ["mcq", "mcq_multi", "text"].includes(question.type)
                ? question.type
                : "mcq";
            question.label = question.label || `Question ${questionIndex + 1}`;
            if (question.type === "mcq" || question.type === "mcq_multi") {
                if (!Array.isArray(question.options) || question.options.length === 0) {
                    question.options = [
                        { value: "a", text: "Option A" },
                        { value: "b", text: "Option B" },
                    ];
                }
                if (question.type === "mcq_multi") {
                    question.answer = Array.isArray(question.answer)
                        ? question.answer
                        : String(question.answer || question.options[0].value).split(",").map((item) => item.trim()).filter(Boolean);
                } else {
                    question.answer = Array.isArray(question.answer)
                        ? question.answer[0] || question.options[0].value
                        : question.answer || question.options[0].value;
                }
            } else {
                question.keywords = Array.isArray(question.keywords)
                    ? question.keywords
                    : String(question.keywords || "").split(",").map((item) => item.trim()).filter(Boolean);
            }
        });
    });
    return next;
}

function loadStoredDraft() {
    try {
        const raw = localStorage.getItem(editorStorageKey());
        return raw ? normalizeDraftData(JSON.parse(raw)) : null;
    } catch (e) {
        return null;
    }
}

function saveStoredDraft(data = editorState.draft) {
    if (!data) return;
    localStorage.setItem(editorStorageKey(), toPrettyJson(normalizeDraftData(data)));
    editorState.dirty = false;
    editorStatus("Draft saved in this browser. Preview or export it when ready.", "success");
}

function clearStoredDraft() {
    localStorage.removeItem(editorStorageKey());
}

function getOriginalData() {
    return clone(window.QUIZ_ORIGINAL_DATA || window.QUIZ_DATA || {
        schemaVersion: 1,
        setId: window.QUIZ_SET_ID || "draft",
        label: window.getCurrentQuizSet?.()?.label || "Draft quiz",
        title: "Draft quiz",
        sections: [],
    });
}

function ensureDraft() {
    if (!editorState.draft) {
        editorState.draft = loadStoredDraft() || normalizeDraftData(window.QUIZ_DATA || getOriginalData());
    }
    return editorState.draft;
}

function currentSection() {
    const draft = ensureDraft();
    return draft.sections[editorState.selectedSection] || null;
}

function currentQuestion() {
    const section = currentSection();
    return section?.questions?.[editorState.selectedQuestion] || null;
}

function makeQuestion(type = "mcq") {
    const section = currentSection();
    const sectionId = section?.id || "sec";
    const index = (section?.questions?.length || 0) + 1;
    const question = {
        id: `${sectionId}_q${index}`,
        type,
        label: `Question ${index}`,
        explanation: "",
    };
    if (type === "text") {
        question.keywords = [];
        question.hint = "";
    } else {
        question.answer = type === "mcq_multi" ? ["a"] : "a";
        question.options = [
            { value: "a", text: "Option A" },
            { value: "b", text: "Option B" },
            { value: "c", text: "Option C" },
            { value: "d", text: "Option D" },
        ];
    }
    return question;
}

function makeSection() {
    const draft = ensureDraft();
    const index = draft.sections.length + 1;
    return {
        id: `sec_${index}`,
        title: `Section ${index}`,
        questions: [
            {
                id: `sec_${index}_q1`,
                type: "mcq",
                label: "Question 1",
                answer: "a",
                options: [
                    { value: "a", text: "Option A" },
                    { value: "b", text: "Option B" },
                    { value: "c", text: "Option C" },
                    { value: "d", text: "Option D" },
                ],
                explanation: "",
            },
        ],
    };
}

function escapeAttr(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function renderEditor() {
    const draft = ensureDraft();
    const title = document.getElementById("quiz-editor-set-title");
    const label = document.getElementById("quiz-editor-set-label");
    if (title) title.value = draft.title || "";
    if (label) label.value = draft.label || "";
    renderSectionList();
    renderQuestionList();
    renderQuestionForm();
}

function renderSectionList() {
    const draft = ensureDraft();
    const list = document.getElementById("quiz-editor-section-list");
    if (!list) return;
    list.innerHTML = draft.sections.map((section, index) => `
        <button class="quiz-editor-list-item${index === editorState.selectedSection ? " active" : ""}" data-editor-section="${index}">
            <span>${escapeAttr(section.title || section.id)}</span>
            <small>${section.questions?.length || 0} questions</small>
        </button>
    `).join("");
}

function renderQuestionList() {
    const section = currentSection();
    const list = document.getElementById("quiz-editor-question-list");
    if (!list) return;
    if (!section) {
        list.innerHTML = `<p class="quiz-editor-empty">Add a section first.</p>`;
        return;
    }
    list.innerHTML = section.questions.map((question, index) => `
        <button class="quiz-editor-list-item${index === editorState.selectedQuestion ? " active" : ""}" data-editor-question="${index}">
            <span>${escapeAttr(question.label || question.id)}</span>
            <small>${escapeAttr(question.type || "mcq")} · ${escapeAttr(question.id)}</small>
        </button>
    `).join("");
}

function field(label, id, value, attrs = "") {
    return `
        <div class="quiz-editor-field">
            <label for="${id}">${label}</label>
            <input id="${id}" ${attrs} value="${escapeAttr(value)}" />
        </div>
    `;
}

function textarea(label, id, value, attrs = "") {
    return `
        <div class="quiz-editor-field">
            <label for="${id}">${label}</label>
            <textarea id="${id}" ${attrs}>${escapeAttr(value)}</textarea>
        </div>
    `;
}

function optionRows(question) {
    const options = Array.isArray(question.options) ? question.options : [];
    return options.map((option, index) => `
        <div class="quiz-editor-option-row" data-option-index="${index}">
            <input data-editor-option-field="value" value="${escapeAttr(option.value)}" aria-label="Option value" />
            <textarea data-editor-option-field="text" aria-label="Option text">${escapeAttr(option.text || "")}</textarea>
            <button class="quiz-editor-mini-btn" data-editor-option-move="up" title="Move option up">↑</button>
            <button class="quiz-editor-mini-btn" data-editor-option-move="down" title="Move option down">↓</button>
            <button class="quiz-editor-mini-btn danger" data-editor-option-delete title="Delete option">×</button>
        </div>
    `).join("");
}

function answerEditor(question) {
    if (question.type === "text") {
        return textarea(
            "Accepted keywords (comma separated)",
            "quiz-editor-question-keywords",
            Array.isArray(question.keywords) ? question.keywords.join(", ") : "",
        );
    }
    const values = (question.options || []).map((option) => String(option.value || ""));
    if (question.type === "mcq_multi") {
        const selected = Array.isArray(question.answer)
            ? question.answer.map(String)
            : String(question.answer || "").split(",").map((item) => item.trim());
        return `
            <div class="quiz-editor-field">
                <label>Correct answers</label>
                <div class="quiz-editor-check-list">
                    ${values.map((value) => `
                        <label>
                            <input type="checkbox" data-editor-answer-multi value="${escapeAttr(value)}" ${selected.includes(value) ? "checked" : ""} />
                            ${escapeAttr(value)}
                        </label>
                    `).join("")}
                </div>
            </div>
        `;
    }
    return `
        <div class="quiz-editor-field">
            <label for="quiz-editor-question-answer">Correct answer</label>
            <select id="quiz-editor-question-answer">
                ${values.map((value) => `<option value="${escapeAttr(value)}" ${String(question.answer || "") === value ? "selected" : ""}>${escapeAttr(value)}</option>`).join("")}
            </select>
        </div>
    `;
}

function renderQuestionForm() {
    const section = currentSection();
    const question = currentQuestion();
    const form = document.getElementById("quiz-editor-form");
    if (!form) return;
    if (!section) {
        form.innerHTML = `<p class="quiz-editor-empty">No section selected.</p>`;
        return;
    }
    if (!question) {
        form.innerHTML = `
            <div class="quiz-editor-subhead">
                <h3>Edit section</h3>
                <div class="quiz-editor-inline-actions">
                    <button class="quiz-editor-mini-btn" data-editor-section-move="up">↑</button>
                    <button class="quiz-editor-mini-btn" data-editor-section-move="down">↓</button>
                    <button class="quiz-editor-mini-btn danger" data-editor-section-delete>Delete</button>
                </div>
            </div>
            ${field("Section id", "quiz-editor-section-id", section.id)}
            ${field("Section title", "quiz-editor-section-title", section.title)}
            <p class="quiz-editor-empty">Add a question to this section.</p>
        `;
        return;
    }
    form.innerHTML = `
        <div class="quiz-editor-subhead">
            <h3>Edit question</h3>
            <div class="quiz-editor-inline-actions">
                <button class="quiz-editor-mini-btn" data-editor-question-move="up">↑</button>
                <button class="quiz-editor-mini-btn" data-editor-question-move="down">↓</button>
                <button class="quiz-editor-mini-btn" data-editor-question-duplicate>Duplicate</button>
                <button class="quiz-editor-mini-btn danger" data-editor-question-delete>Delete</button>
            </div>
        </div>
        <div class="quiz-editor-grid-2">
            ${field("Section id", "quiz-editor-section-id", section.id)}
            ${field("Section title", "quiz-editor-section-title", section.title)}
        </div>
        <div class="quiz-editor-grid-2">
            ${field("Question id", "quiz-editor-question-id", question.id)}
            <div class="quiz-editor-field">
                <label for="quiz-editor-question-type">Question type</label>
                <select id="quiz-editor-question-type">
                    <option value="mcq" ${question.type === "mcq" ? "selected" : ""}>single choice</option>
                    <option value="mcq_multi" ${question.type === "mcq_multi" ? "selected" : ""}>multiple choice</option>
                    <option value="text" ${question.type === "text" ? "selected" : ""}>text answer</option>
                </select>
            </div>
        </div>
        ${textarea("Question text", "quiz-editor-question-label", question.label || "")}
        <div class="quiz-editor-grid-2">
            ${field("Image path", "quiz-editor-question-image", question.image || "")}
            ${field("Image alt", "quiz-editor-question-image-alt", question.imageAlt || question.image_alt || "")}
        </div>
        ${answerEditor(question)}
        ${(question.type === "mcq" || question.type === "mcq_multi") ? `
            <div class="quiz-editor-field">
                <div class="quiz-editor-column-head compact">
                    <label>Options</label>
                    <button class="quiz-editor-mini-btn" data-editor-option-add>+</button>
                </div>
                <div class="quiz-editor-options">${optionRows(question)}</div>
            </div>
        ` : textarea("Hint", "quiz-editor-question-hint", question.hint || "")}
        ${textarea("Explanation", "quiz-editor-question-explanation", question.explanation || "")}
    `;
}

function markDirty() {
    editorState.dirty = true;
    editorStatus("Unsaved local changes.", "info");
}

function updateFromForm() {
    const draft = ensureDraft();
    const section = currentSection();
    const question = currentQuestion();
    const title = document.getElementById("quiz-editor-set-title");
    const label = document.getElementById("quiz-editor-set-label");
    if (title) draft.title = title.value.trim();
    if (label) draft.label = label.value.trim();
    if (!section) return;
    section.id = document.getElementById("quiz-editor-section-id")?.value.trim() || section.id;
    section.title = document.getElementById("quiz-editor-section-title")?.value.trim() || section.title;
    if (!question) return;
    question.id = document.getElementById("quiz-editor-question-id")?.value.trim() || question.id;
    const nextType = document.getElementById("quiz-editor-question-type")?.value || question.type;
    if (nextType !== question.type) {
        question.type = nextType;
        if (nextType === "text") {
            delete question.options;
            delete question.answer;
            question.keywords = [];
            question.hint = question.hint || "";
        } else {
            delete question.keywords;
            delete question.hint;
            question.options = question.options || [
                { value: "a", text: "Option A" },
                { value: "b", text: "Option B" },
            ];
            question.answer = nextType === "mcq_multi" ? [question.options[0].value] : question.options[0].value;
        }
    }
    question.label = document.getElementById("quiz-editor-question-label")?.value.trim() || "";
    question.image = document.getElementById("quiz-editor-question-image")?.value.trim() || undefined;
    question.imageAlt = document.getElementById("quiz-editor-question-image-alt")?.value.trim() || undefined;
    question.explanation = document.getElementById("quiz-editor-question-explanation")?.value.trim() || "";
    if (question.type === "text") {
        question.keywords = (document.getElementById("quiz-editor-question-keywords")?.value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        question.hint = document.getElementById("quiz-editor-question-hint")?.value.trim() || "";
    } else {
        question.options = Array.from(document.querySelectorAll(".quiz-editor-option-row")).map((row) => ({
            value: row.querySelector('[data-editor-option-field="value"]')?.value.trim() || "",
            text: row.querySelector('[data-editor-option-field="text"]')?.value.trim() || "",
        })).filter((option) => option.value || option.text);
        if (question.type === "mcq_multi") {
            question.answer = Array.from(document.querySelectorAll("[data-editor-answer-multi]:checked")).map((input) => input.value);
        } else {
            question.answer = document.getElementById("quiz-editor-question-answer")?.value || question.options[0]?.value || "";
        }
    }
}

function selectSection(index) {
    updateFromForm();
    editorState.selectedSection = Math.max(0, Math.min(index, ensureDraft().sections.length - 1));
    editorState.selectedQuestion = 0;
    renderEditor();
}

function selectQuestion(index) {
    updateFromForm();
    const section = currentSection();
    editorState.selectedQuestion = Math.max(0, Math.min(index, (section?.questions?.length || 1) - 1));
    renderEditor();
}

function moveItem(items, index, direction) {
    const nextIndex = index + direction;
    if (!items || nextIndex < 0 || nextIndex >= items.length) return index;
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    return nextIndex;
}

function addSection() {
    updateFromForm();
    const draft = ensureDraft();
    draft.sections.push(makeSection());
    editorState.selectedSection = draft.sections.length - 1;
    editorState.selectedQuestion = 0;
    markDirty();
    renderEditor();
}

function addQuestion() {
    updateFromForm();
    const section = currentSection();
    if (!section) return;
    section.questions.push(makeQuestion("mcq"));
    editorState.selectedQuestion = section.questions.length - 1;
    markDirty();
    renderEditor();
}

function validateQuizData(data = ensureDraft()) {
    const issues = [];
    const sectionIds = new Set();
    const questionIds = new Set();
    if (!data.title) issues.push("Quiz title is empty.");
    if (!Array.isArray(data.sections) || data.sections.length === 0) {
        issues.push("Quiz must contain at least one section.");
    }
    (data.sections || []).forEach((section, sectionIndex) => {
        if (!section.id) issues.push(`Section ${sectionIndex + 1} has no id.`);
        if (sectionIds.has(section.id)) issues.push(`Duplicate section id: ${section.id}`);
        sectionIds.add(section.id);
        if (!section.title) issues.push(`Section ${section.id || sectionIndex + 1} has no title.`);
        if (!Array.isArray(section.questions) || section.questions.length === 0) {
            issues.push(`Section ${section.id || sectionIndex + 1} has no questions.`);
        }
        (section.questions || []).forEach((question, questionIndex) => {
            const label = `${section.id || sectionIndex + 1}/${question.id || questionIndex + 1}`;
            if (!question.id) issues.push(`Question ${label} has no id.`);
            if (questionIds.has(question.id)) issues.push(`Duplicate question id: ${question.id}`);
            questionIds.add(question.id);
            if (!question.label) issues.push(`Question ${label} has no text.`);
            if (!["mcq", "mcq_multi", "text"].includes(question.type)) issues.push(`Question ${label} has unsupported type.`);
            if (question.type === "mcq" || question.type === "mcq_multi") {
                const values = (question.options || []).map((option) => option.value).filter(Boolean);
                if (values.length < 2) issues.push(`Question ${label} needs at least two options.`);
                const answers = question.type === "mcq_multi" ? question.answer || [] : [question.answer];
                if (!answers.length || answers.some((answer) => !values.includes(answer))) {
                    issues.push(`Question ${label} has answer values that do not match options.`);
                }
            }
            if (question.type === "text" && (!Array.isArray(question.keywords) || question.keywords.length === 0)) {
                issues.push(`Text question ${label} needs accepted keywords.`);
            }
        });
    });
    return issues;
}

function previewDraft() {
    updateFromForm();
    const draft = normalizeDraftData(editorState.draft);
    const issues = validateQuizData(draft);
    if (issues.length) {
        editorStatus(`Preview blocked: ${issues[0]}`, "error");
        return;
    }
    window.renderQuizData?.(clone(draft));
    window.generateTreeNav?.();
    window.loadAnswers?.();
    window.updateWrongAnswerControls?.();
    editorStatus("Preview updated from local draft.", "success");
}

function downloadText(filename, text, type = "application/json") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function createReplacementPatch(filePath, originalText, updatedText) {
    const oldLines = originalText.replace(/\n$/, "").split("\n");
    const newLines = updatedText.replace(/\n$/, "").split("\n");
    return [
        `diff --git a/${filePath} b/${filePath}`,
        `--- a/${filePath}`,
        `+++ b/${filePath}`,
        `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
        ...oldLines.map((line) => `-${line}`),
        ...newLines.map((line) => `+${line}`),
        "",
    ].join("\n");
}

function exportJson() {
    updateFromForm();
    const data = normalizeDraftData(editorState.draft);
    downloadText(`${data.setId.replace(/[^\w.-]+/g, "_")}.json`, toPrettyJson(data));
}

function exportPrBundle() {
    updateFromForm();
    const data = normalizeDraftData(editorState.draft);
    const filePath = getQuizSetFilePath();
    const updatedText = toPrettyJson(data);
    const originalText = toPrettyJson(getOriginalData());
    const patch = createReplacementPatch(filePath, originalText, updatedText);
    const safeSetId = data.setId.replace(/[^\w.-]+/g, "_");
    const instructions = [
        `Quiz editor PR bundle`,
        ``,
        `Target file: ${filePath}`,
        `Repository: ${EDITOR_REPO}`,
        `Base branch: ${EDITOR_BASE_BRANCH}`,
        ``,
        `Option A: apply the patch locally:`,
        `git checkout -b quiz-content-edit`,
        `git apply quiz-editor-${data.setId.replace(/[^\w.-]+/g, "_")}.patch`,
        `npm run validate`,
        `npm run build`,
        `git commit -am "Update ${data.label || data.setId} quiz content"`,
        `git push -u origin quiz-content-edit`,
        ``,
        `Option B: open GitHub's file editor and replace ${filePath} with the exported JSON.`,
        `https://github.com/${EDITOR_REPO}/edit/${EDITOR_BASE_BRANCH}/${filePath}`,
        ``,
    ].join("\n");
    downloadText(
        `quiz-editor-${safeSetId}.patch`,
        patch,
        "text/x-diff",
    );
    downloadText(
        `quiz-editor-${safeSetId}-pr-instructions.txt`,
        instructions,
        "text/plain",
    );
    window.open(`https://github.com/${EDITOR_REPO}/edit/${EDITOR_BASE_BRANCH}/${filePath}`, "_blank", "noopener");
}

function resetDraft() {
    if (!confirm("Reset local quiz editor draft for this set?")) return;
    clearStoredDraft();
    editorState.draft = normalizeDraftData(getOriginalData());
    editorState.selectedSection = 0;
    editorState.selectedQuestion = 0;
    editorState.dirty = false;
    renderEditor();
    editorStatus("Draft reset to loaded quiz data.", "success");
}

async function importJsonFile(file) {
    if (!file) return;
    try {
        const parsed = JSON.parse(await file.text());
        editorState.draft = normalizeDraftData(parsed);
        editorState.selectedSection = 0;
        editorState.selectedQuestion = 0;
        markDirty();
        renderEditor();
        editorStatus("Imported JSON into the local editor draft.", "success");
    } catch (e) {
        editorStatus(`Import failed: ${e.message}`, "error");
    }
}

function openQuizEditor() {
    editorState.draft = loadStoredDraft() || normalizeDraftData(window.QUIZ_DATA || getOriginalData());
    const overlay = document.getElementById("quiz-editor-overlay");
    if (!overlay) return;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    renderEditor();
    const issues = validateQuizData(editorState.draft);
    editorStatus(issues.length ? `${issues.length} validation issue(s). First: ${issues[0]}` : "Draft is ready.", issues.length ? "error" : "success");
}

function closeQuizEditor() {
    const overlay = document.getElementById("quiz-editor-overlay");
    if (!overlay) return;
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
}

function bindQuizEditorEvents() {
    const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };
    bind("open-quiz-editor-btn", "click", openQuizEditor);
    bind("quiz-editor-close-btn", "click", closeQuizEditor);
    bind("quiz-editor-add-section-btn", "click", addSection);
    bind("quiz-editor-add-question-btn", "click", addQuestion);
    bind("quiz-editor-save-btn", "click", () => {
        updateFromForm();
        saveStoredDraft(normalizeDraftData(editorState.draft));
    });
    bind("quiz-editor-preview-btn", "click", previewDraft);
    bind("quiz-editor-validate-btn", "click", () => {
        updateFromForm();
        const issues = validateQuizData(normalizeDraftData(editorState.draft));
        editorStatus(issues.length ? `${issues.length} issue(s): ${issues.slice(0, 3).join(" · ")}` : "No validation issues found.", issues.length ? "error" : "success");
    });
    bind("quiz-editor-export-btn", "click", exportJson);
    bind("quiz-editor-pr-btn", "click", exportPrBundle);
    bind("quiz-editor-reset-btn", "click", resetDraft);
    bind("quiz-editor-import-btn", "click", () => document.getElementById("quiz-editor-import-file")?.click());
    bind("quiz-editor-import-file", "change", (event) => importJsonFile(event.target.files?.[0]));

    document.getElementById("quiz-editor-overlay")?.addEventListener("click", (event) => {
        if (event.target.id === "quiz-editor-overlay") closeQuizEditor();
    });
    document.getElementById("quiz-editor-section-list")?.addEventListener("click", (event) => {
        const item = event.target.closest("[data-editor-section]");
        if (item) selectSection(Number(item.dataset.editorSection));
    });
    document.getElementById("quiz-editor-question-list")?.addEventListener("click", (event) => {
        const item = event.target.closest("[data-editor-question]");
        if (item) selectQuestion(Number(item.dataset.editorQuestion));
    });
    document.getElementById("quiz-editor-form")?.addEventListener("input", () => {
        updateFromForm();
        markDirty();
    });
    document.getElementById("quiz-editor-form")?.addEventListener("change", () => {
        updateFromForm();
        markDirty();
        renderEditor();
    });
    document.getElementById("quiz-editor-form")?.addEventListener("click", (event) => {
        const section = currentSection();
        const question = currentQuestion();
        if (event.target.matches("[data-editor-section-delete]") && confirm("Delete this section?")) {
            ensureDraft().sections.splice(editorState.selectedSection, 1);
            editorState.selectedSection = Math.max(0, editorState.selectedSection - 1);
            editorState.selectedQuestion = 0;
        } else if (event.target.matches("[data-editor-section-move]")) {
            editorState.selectedSection = moveItem(ensureDraft().sections, editorState.selectedSection, event.target.dataset.editorSectionMove === "up" ? -1 : 1);
        } else if (event.target.matches("[data-editor-question-delete]") && section && confirm("Delete this question?")) {
            section.questions.splice(editorState.selectedQuestion, 1);
            editorState.selectedQuestion = Math.max(0, editorState.selectedQuestion - 1);
        } else if (event.target.matches("[data-editor-question-duplicate]") && section && question) {
            const copy = clone(question);
            copy.id = `${question.id}_copy`;
            section.questions.splice(editorState.selectedQuestion + 1, 0, copy);
            editorState.selectedQuestion += 1;
        } else if (event.target.matches("[data-editor-question-move]") && section) {
            editorState.selectedQuestion = moveItem(section.questions, editorState.selectedQuestion, event.target.dataset.editorQuestionMove === "up" ? -1 : 1);
        } else if (event.target.matches("[data-editor-option-add]") && question) {
            question.options = question.options || [];
            question.options.push({ value: String.fromCharCode(97 + question.options.length), text: "New option" });
        } else if (event.target.matches("[data-editor-option-delete]") && question) {
            const index = Number(event.target.closest("[data-option-index]")?.dataset.optionIndex);
            question.options.splice(index, 1);
        } else if (event.target.matches("[data-editor-option-move]") && question) {
            const index = Number(event.target.closest("[data-option-index]")?.dataset.optionIndex);
            moveItem(question.options, index, event.target.dataset.editorOptionMove === "up" ? -1 : 1);
        } else {
            return;
        }
        markDirty();
        renderEditor();
    });
    ["quiz-editor-set-title", "quiz-editor-set-label"].forEach((id) => {
        document.getElementById(id)?.addEventListener("input", () => {
            updateFromForm();
            markDirty();
        });
    });
}

function getQuizEditorDraftForCurrentSet() {
    return loadStoredDraft();
}

Object.assign(window, {
    openQuizEditor,
    closeQuizEditor,
    bindQuizEditorEvents,
    getQuizEditorDraftForCurrentSet,
    validateQuizData,
});

export {
    openQuizEditor,
    closeQuizEditor,
    bindQuizEditorEvents,
    getQuizEditorDraftForCurrentSet,
    validateQuizData,
};
