// ─── localStorage (oddelené per set, ak nepoužijete QUIZ_STORAGE_KEY) ────
const STORAGE_KEY =
    window.QUIZ_STORAGE_KEY ||
    `vba_kviz_answers_${window.QUIZ_SET_ID || "default"}`;
const WRONG_STORAGE_KEY = `${STORAGE_KEY}_wrong_answers`;
const FLASHCARD_STORAGE_KEY = `${STORAGE_KEY}_flashcards`;

function saveAnswers() {
    const answersState = {};
    document
        .querySelectorAll('input[type="radio"]:checked')
        .forEach((r) => {
            answersState["r_" + r.name] = r.value;
        });
    document
        .querySelectorAll('input[type="checkbox"]')
        .forEach((cb) => {
            if (!answersState["c_" + cb.name]) answersState["c_" + cb.name] = [];
            if (cb.checked) answersState["c_" + cb.name].push(cb.value);
        });
    document
        .querySelectorAll('input[type="text"]')
        .forEach((inp) => {
            if (inp.value) answersState["t_" + inp.id] = inp.value;
        });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(answersState));
        updateSaveIndicator("Uložené");
    } catch (e) {}
}

function updateSaveIndicator(status) {
    const el = document.getElementById("storage-info");
    if (!el) return;
    const now = new Date();
    el.textContent = `${status} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    el.classList.add("storage-info-active");
    clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(() => {
        el.classList.remove("storage-info-active");
    }, 1200);
}

function loadWrongAnswerIds() {
    try {
        const raw = localStorage.getItem(WRONG_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveWrongAnswerIds(ids) {
    const unique = Array.from(new Set(ids)).filter(Boolean);
    try {
        localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(unique));
    } catch (e) {}
    incorrectQuestionIds = unique;
    updateWrongAnswerControls();
}

function clearWrongAnswerHistory() {
    try {
        localStorage.removeItem(WRONG_STORAGE_KEY);
    } catch (e) {}
    incorrectQuestionIds = [];
    updateWrongAnswerControls();
    exitPracticeMode();
}

function updateWrongAnswerControls() {
    const ids = incorrectQuestionIds.length
        ? incorrectQuestionIds
        : loadWrongAnswerIds();
    const hasWrong = ids.length > 0;
    const practiceBtn = document.getElementById("practice-btn");
    const reviewBtn = document.getElementById("review-wrong-btn");
    const clearBtn = document.getElementById("clear-wrong-btn");
    if (practiceBtn) practiceBtn.style.display = hasWrong ? "inline-flex" : "none";
    if (reviewBtn) reviewBtn.style.display = hasWrong ? "inline-flex" : "none";
    if (clearBtn) clearBtn.style.display = hasWrong ? "inline-flex" : "none";
}

function loadAnswers() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const state = JSON.parse(raw);
        Object.entries(state).forEach(([key, val]) => {
            if (key.startsWith("r_")) {
                const name = key.slice(2);
                const radio = document.querySelector(
                    `input[name="${name}"][value="${val}"]`,
                );
                if (radio) radio.checked = true;
            } else if (key.startsWith("c_")) {
                const name = key.slice(2);
                const values = Array.isArray(val) ? val : [];
                document
                    .querySelectorAll(`input[type="checkbox"][name="${name}"]`)
                    .forEach((cb) => {
                        cb.checked = values.includes(cb.value);
                    });
            } else if (key.startsWith("t_")) {
                const id = key.slice(2);
                const textInput = document.getElementById(id);
                if (textInput && textInput.type === "text")
                    textInput.value = val;
            }
        });
    } catch (e) {}
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
}

function normalizeSectionIds(sectionIds) {
    return Array.from(new Set(sectionIds || [])).sort();
}

function getFlashcardSectionKey(sectionIds = fcSectionIds) {
    return normalizeSectionIds(sectionIds).join("|");
}

function loadAllFlashcardProgress() {
    try {
        const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveAllFlashcardProgress(progressMap) {
    try {
        const keys = Object.keys(progressMap || {});
        if (keys.length === 0) {
            localStorage.removeItem(FLASHCARD_STORAGE_KEY);
            return;
        }
        localStorage.setItem(
            FLASHCARD_STORAGE_KEY,
            JSON.stringify(progressMap),
        );
    } catch (e) {}
}

function loadFlashcardProgress(sectionIds = fcSectionIds) {
    const allProgress = loadAllFlashcardProgress();
    return allProgress[getFlashcardSectionKey(sectionIds)] || null;
}

function clearFlashcardProgress(sectionIds = fcSectionIds) {
    const allProgress = loadAllFlashcardProgress();
    const key = getFlashcardSectionKey(sectionIds);
    if (!key) {
        saveAllFlashcardProgress({});
        return;
    }
    delete allProgress[key];
    saveAllFlashcardProgress(allProgress);
}

function buildFlashcardSnapshot() {
    const current = fcQueue[fcIndex];
    if (!current) return null;
    const snapshot = {
        qId: current.qId,
        kind: current.kind,
        answered: fcAnswered,
        nextEnabled: !document.getElementById("fc-next-btn")?.disabled,
        hintText: document.getElementById("fc-hint")?.textContent || "",
        feedbackClassName:
            document.getElementById("fc-feedback")?.className || "fc-feedback",
        feedbackHTML: document.getElementById("fc-feedback")?.innerHTML || "",
    };
    if (current.kind === "text") {
        const input = document.getElementById("fc-text-input");
        snapshot.inputValue = input ? input.value : "";
        snapshot.inputDisabled = !!input?.disabled;
        snapshot.inputIsCorrect = !!input?.classList.contains("correct");
        snapshot.inputIsWrong = !!input?.classList.contains("wrong");
        return snapshot;
    }
    snapshot.optionStates = Array.from(
        document.querySelectorAll(".fc-option"),
    ).map((btn) => ({
        value: btn.dataset.fcValue,
        disabled: btn.disabled,
        selected: btn.classList.contains("selected"),
        correct: btn.classList.contains("correct"),
        wrong: btn.classList.contains("wrong"),
        partialCorrect: btn.classList.contains("partial-correct"),
    }));
    return snapshot;
}

function saveFlashcardProgress() {
    if (
        !Array.isArray(fcSectionIds) ||
        fcSectionIds.length === 0 ||
        !Array.isArray(fcQueue) ||
        fcQueue.length === 0 ||
        fcIndex >= fcQueue.length
    ) {
        clearFlashcardProgress(fcSectionIds);
        return;
    }
    const allProgress = loadAllFlashcardProgress();
    const key = getFlashcardSectionKey(fcSectionIds);
    const payload = {
        sectionIds: normalizeSectionIds(fcSectionIds),
        queue: fcQueue,
        index: fcIndex,
        correct: fcCorrect,
        wrong: fcWrong,
        answered: fcAnswered,
        sessionInitialLength: fcSessionInitialLength,
        isOpen:
            !!document
                .getElementById("flashcard-view")
                ?.classList.contains("active"),
        currentCard: buildFlashcardSnapshot(),
        updatedAt: Date.now(),
    };
    allProgress[key] = payload;
    saveAllFlashcardProgress(allProgress);
}

function isFlashcardSessionValid(session) {
    if (!session || !Array.isArray(session.queue) || session.queue.length === 0) {
        return false;
    }
    if (
        !Array.isArray(session.sectionIds) ||
        session.sectionIds.length === 0
    ) {
        return false;
    }
    if (
        typeof session.index !== "number" ||
        session.index < 0 ||
        session.index > session.queue.length
    ) {
        return false;
    }
    return session.queue.every(
        (card) =>
            card &&
            typeof card.qId === "string" &&
            document.getElementById(card.qId),
    );
}

function applyFlashcardSession(session) {
    fcSectionIds = normalizeSectionIds(session.sectionIds);
    fcQueue = session.queue;
    fcIndex = session.index;
    fcCorrect = session.correct || 0;
    fcWrong = session.wrong || 0;
    fcAnswered = !!session.answered;
    fcSessionInitialLength =
        session.sessionInitialLength || session.queue.length;
}

function restoreFlashcardSnapshot(snapshot) {
    if (!snapshot || snapshot.qId !== fcQueue[fcIndex]?.qId) return;
    const nextBtn = document.getElementById("fc-next-btn");
    const hint = document.getElementById("fc-hint");
    const feedback = document.getElementById("fc-feedback");
    if (nextBtn) nextBtn.disabled = !snapshot.nextEnabled;
    if (hint) hint.textContent = snapshot.hintText || "";
    if (feedback) {
        feedback.className = snapshot.feedbackClassName || "fc-feedback";
        feedback.innerHTML = snapshot.feedbackHTML || "";
    }
    if (snapshot.kind === "text") {
        const input = document.getElementById("fc-text-input");
        if (!input) return;
        input.value = snapshot.inputValue || "";
        input.disabled = !!snapshot.inputDisabled;
        input.classList.toggle("correct", !!snapshot.inputIsCorrect);
        input.classList.toggle("wrong", !!snapshot.inputIsWrong);
        return;
    }
    (snapshot.optionStates || []).forEach((optionState) => {
        const btn = document.querySelector(
            `.fc-option[data-fc-value="${optionState.value}"]`,
        );
        if (!btn) return;
        btn.disabled = !!optionState.disabled;
        btn.classList.toggle("selected", !!optionState.selected);
        btn.classList.toggle("correct", !!optionState.correct);
        btn.classList.toggle("wrong", !!optionState.wrong);
        btn.classList.toggle(
            "partial-correct",
            !!optionState.partialCorrect,
        );
    });
}

function syncFlashcardRadioAnswer(qId, value) {
    const radio = document.querySelector(
        `input[name="${qId}"][value="${value}"]`,
    );
    if (!radio) return;
    radio.checked = true;
    saveAnswers();
}

function syncFlashcardTextAnswer(qId, value) {
    const input = document.getElementById(`${qId}-input`);
    if (!input || input.type !== "text") return;
    input.value = value;
    saveAnswers();
}

function syncFlashcardCheckboxAnswer(qId, values) {
    const selected = new Set(values);
    document
        .querySelectorAll(`input[type="checkbox"][name="${qId}"]`)
        .forEach((cb) => {
            cb.checked = selected.has(cb.value);
        });
    saveAnswers();
}

function resetFlashcardFooter() {
    const footer = document.getElementById("fc-footer");
    const nextBtn = document.getElementById("fc-next-btn");
    const hint = document.getElementById("fc-hint");
    if (footer) footer.style.display = "flex";
    if (nextBtn) nextBtn.disabled = true;
    if (hint) hint.textContent = "";
}

function setFlashcardsActive(active) {
    const normalView = document.getElementById("normal-mode-view");
    const flashcardView = document.getElementById("flashcard-view");
    if (!normalView || !flashcardView) return;
    normalView.classList.toggle("hidden", active);
    flashcardView.classList.toggle("active", active);
    flashcardView.setAttribute("aria-hidden", active ? "false" : "true");
}

Object.assign(window, {
    saveAnswers,
    updateSaveIndicator,
    loadWrongAnswerIds,
    saveWrongAnswerIds,
    clearWrongAnswerHistory,
    updateWrongAnswerControls,
    loadAnswers,
    clearStorage,
    normalizeSectionIds,
    getFlashcardSectionKey,
    loadAllFlashcardProgress,
    saveAllFlashcardProgress,
    loadFlashcardProgress,
    clearFlashcardProgress,
    buildFlashcardSnapshot,
    saveFlashcardProgress,
    isFlashcardSessionValid,
    applyFlashcardSession,
    restoreFlashcardSnapshot,
    syncFlashcardRadioAnswer,
    syncFlashcardTextAnswer,
    syncFlashcardCheckboxAnswer,
    resetFlashcardFooter,
    setFlashcardsActive,
});

export {
    saveAnswers,
    updateSaveIndicator,
    loadWrongAnswerIds,
    saveWrongAnswerIds,
    clearWrongAnswerHistory,
    updateWrongAnswerControls,
    loadAnswers,
    clearStorage,
    normalizeSectionIds,
    getFlashcardSectionKey,
    loadAllFlashcardProgress,
    saveAllFlashcardProgress,
    loadFlashcardProgress,
    clearFlashcardProgress,
    buildFlashcardSnapshot,
    saveFlashcardProgress,
    isFlashcardSessionValid,
    applyFlashcardSession,
    restoreFlashcardSnapshot,
    syncFlashcardRadioAnswer,
    syncFlashcardTextAnswer,
    syncFlashcardCheckboxAnswer,
    resetFlashcardFooter,
    setFlashcardsActive,
};
