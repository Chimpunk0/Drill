// ─── Centralized application state ───────────────────────────────────────
const state = {
    explanations: {},
    saveIndicatorTimer: null,
    practiceMode: false,
    incorrectQuestionIds: [],
    sidebarVisible: window.innerWidth > 768,
    rightSidebarVisible: false,
    capturingShortcut: false,
    flashcards: {
        queue: [],
        index: 0,
        correct: 0,
        wrong: 0,
        answered: false,
        sessionInitialLength: 0,
        sectionIds: [],
    },
};

Object.defineProperties(window, {
    EXPLANATIONS: {
        get: () => state.explanations,
        set: (value) => (state.explanations = value),
    },
    saveIndicatorTimer: {
        get: () => state.saveIndicatorTimer,
        set: (value) => (state.saveIndicatorTimer = value),
    },
    practiceMode: {
        get: () => state.practiceMode,
        set: (value) => (state.practiceMode = value),
    },
    incorrectQuestionIds: {
        get: () => state.incorrectQuestionIds,
        set: (value) => (state.incorrectQuestionIds = value),
    },
    sidebarVisible: {
        get: () => state.sidebarVisible,
        set: (value) => (state.sidebarVisible = value),
    },
    rightSidebarVisible: {
        get: () => state.rightSidebarVisible,
        set: (value) => (state.rightSidebarVisible = value),
    },
    capturingShortcut: {
        get: () => state.capturingShortcut,
        set: (value) => (state.capturingShortcut = value),
    },
    fcQueue: {
        get: () => state.flashcards.queue,
        set: (value) => (state.flashcards.queue = value),
    },
    fcIndex: {
        get: () => state.flashcards.index,
        set: (value) => (state.flashcards.index = value),
    },
    fcCorrect: {
        get: () => state.flashcards.correct,
        set: (value) => (state.flashcards.correct = value),
    },
    fcWrong: {
        get: () => state.flashcards.wrong,
        set: (value) => (state.flashcards.wrong = value),
    },
    fcAnswered: {
        get: () => state.flashcards.answered,
        set: (value) => (state.flashcards.answered = value),
    },
    fcSessionInitialLength: {
        get: () => state.flashcards.sessionInitialLength,
        set: (value) => (state.flashcards.sessionInitialLength = value),
    },
    fcSectionIds: {
        get: () => state.flashcards.sectionIds,
        set: (value) => (state.flashcards.sectionIds = value),
    },
});

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

function restoreFlashcardSession(session) {
    applyFlashcardSession(session);
    resetFlashcardFooter();
    setFlashcardsActive(true);
    if (window.innerWidth <= 768 && sidebarVisible) toggleSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderFcCard(session.currentCard || null);
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

// ─── Shuffle helpers ─────────────────────────────────────────────────────
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function shuffleQuestions() {
    document.querySelectorAll(".section").forEach((section) => {
        const questions = Array.from(
            section.querySelectorAll(":scope > .question"),
        );
        if (questions.length < 2) return;
        shuffleArray(questions);
        questions.forEach((q) => section.appendChild(q));
    });
    document.getElementById("tree-nav").innerHTML = "";
    generateTreeNav();
}

function shuffleOptions() {
    document.querySelectorAll(".question").forEach((q) => {
        const optionsDiv = q.querySelector(".options");
        if (!optionsDiv) return;
        const options = Array.from(
            optionsDiv.querySelectorAll(".option"),
        );
        if (options.length < 2) return;
        shuffleArray(options);
        options.forEach((opt) => optionsDiv.appendChild(opt));
    });
}

// ─── Practice mistakes mode ──────────────────────────────────────────────
function practiceWrongAnswers() {
    const ids = incorrectQuestionIds.length
        ? incorrectQuestionIds
        : loadWrongAnswerIds();
    if (ids.length === 0) {
        alert(
            "Žiadne nesprávne odpovede na precvičenie!\nNajprv klikni na Vyhodnotiť kvíz.",
        );
        return;
    }
    incorrectQuestionIds = ids;
    practiceMode = true;
    document.querySelectorAll(".question").forEach((q) => {
        if (ids.includes(q.id)) {
            q.style.display = "";
            q.style.outline = "2px solid rgba(239,68,68,0.45)";
            q.style.borderRadius = "8px";
        } else {
            q.style.display = "none";
        }
    });
    document.querySelectorAll(".section").forEach((section) => {
        const visible = Array.from(
            section.querySelectorAll(".question"),
        ).some((q) => q.style.display !== "none");
        section.style.display = visible ? "block" : "none";
    });
    incorrectQuestionIds.forEach((id) => {
        const fb = document.getElementById(`${id}-fb`);
        if (fb) {
            fb.style.display = "none";
            fb.textContent = "";
        }
        const q = document.getElementById(id);
        if (!q) return;
        q.querySelectorAll('input[type="radio"]').forEach(
            (r) => (r.checked = false),
        );
        q.querySelectorAll('input[type="checkbox"]').forEach(
            (c) => (c.checked = false),
        );
        q.querySelectorAll('input[type="text"]').forEach(
            (t) => (t.value = ""),
        );
    });
    document.getElementById("result-container").style.display =
        "none";
    const btn = document.getElementById("practice-btn");
    btn.textContent = "Ukončiť precvičovanie";
    btn.onclick = exitPracticeMode;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function reviewWrongAnswers() {
    const ids = incorrectQuestionIds.length
        ? incorrectQuestionIds
        : loadWrongAnswerIds();
    if (ids.length === 0) {
        alert("Nie sú uložené žiadne nesprávne odpovede.");
        return;
    }
    document.querySelectorAll(".question").forEach((q) => {
        q.style.display = ids.includes(q.id) ? "" : "none";
        q.style.outline = ids.includes(q.id)
            ? "2px solid rgba(239,68,68,0.45)"
            : "";
        q.style.borderRadius = ids.includes(q.id) ? "8px" : "";
    });
    document.querySelectorAll(".section").forEach((section) => {
        const visible = Array.from(
            section.querySelectorAll(".question"),
        ).some((q) => q.style.display !== "none");
        section.style.display = visible ? "block" : "none";
    });
    document.getElementById("result-container").style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitPracticeMode() {
    practiceMode = false;
    document.querySelectorAll(".question").forEach((q) => {
        q.style.display = "";
        q.style.outline = "";
        q.style.borderRadius = "";
    });
    applySectionFilter();
    const btn = document.getElementById("practice-btn");
    btn.textContent = "Precvičiť chyby";
    btn.onclick = practiceWrongAnswers;
    updateWrongAnswerControls();
}

// ─── Global state ────────────────────────────────────────────────────────
const SIDEBAR_SHORTCUT_STORAGE_KEY = "quiz_sidebar_shortcut";

// Check if mobile on load
if (window.innerWidth <= 768) {
    sidebarVisible = false;
    document.getElementById("sidebar").classList.add("hidden");
    document
        .getElementById("main-content")
        .classList.add("full-width");
}

function getDefaultSidebarShortcut() {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    return isMac
        ? { key: "s", ctrl: true, meta: true, alt: false, shift: false }
        : { key: "s", ctrl: true, meta: false, alt: true, shift: false };
}

function getSidebarShortcut() {
    try {
        const stored = localStorage.getItem(SIDEBAR_SHORTCUT_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return getDefaultSidebarShortcut();
}

function formatShortcut(shortcut) {
    const parts = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.meta) parts.push("Cmd");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
}

function shortcutMatches(e, shortcut) {
    return (
        e.key.toLowerCase() === shortcut.key &&
        e.ctrlKey === shortcut.ctrl &&
        e.metaKey === shortcut.meta &&
        e.altKey === shortcut.alt &&
        e.shiftKey === shortcut.shift
    );
}

function updateSidebarShortcutLabel() {
    const label = document.getElementById("sidebar-shortcut-label");
    if (label) label.textContent = formatShortcut(getSidebarShortcut());
}

function openShortcutSettings() {
    const overlay = document.getElementById("shortcut-settings-overlay");
    if (overlay) overlay.classList.add("visible");
    capturingShortcut = false;
    updateSidebarShortcutLabel();
    const hint = document.getElementById("shortcut-capture-hint");
    if (hint) hint.textContent = "";
}

function closeShortcutSettings() {
    const overlay = document.getElementById("shortcut-settings-overlay");
    if (overlay) overlay.classList.remove("visible");
    capturingShortcut = false;
}

function startShortcutCapture() {
    capturingShortcut = true;
    const hint = document.getElementById("shortcut-capture-hint");
    if (hint) hint.textContent = "Stlačte novú klávesovú skratku.";
}

function saveSidebarShortcut(e) {
    const key = e.key.toLowerCase();
    const ignored = ["control", "meta", "alt", "shift", "escape"];
    if (ignored.includes(key)) return false;
    if (!e.ctrlKey && !e.metaKey && !e.altKey) return false;
    const shortcut = {
        key,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey,
    };
    try {
        localStorage.setItem(
            SIDEBAR_SHORTCUT_STORAGE_KEY,
            JSON.stringify(shortcut),
        );
    } catch (err) {}
    capturingShortcut = false;
    updateSidebarShortcutLabel();
    const hint = document.getElementById("shortcut-capture-hint");
    if (hint) hint.textContent = "Skratka uložená.";
    return true;
}

function updateRightSidebarAvailability() {
    const btn = document.getElementById("right-sidebar-toggle");
    const rightSidebar = document.getElementById("right-sidebar");
    const mainContent = document.getElementById("main-content");
    if (!btn || !rightSidebar || !mainContent) return;
    btn.classList.remove("hidden");
    if (!rightSidebarVisible) {
        rightSidebar.classList.add("hidden");
        mainContent.classList.remove("with-right-sidebar");
    }
}

function toggleRightSidebar() {
    const rightSidebar = document.getElementById("right-sidebar");
    const mainContent = document.getElementById("main-content");
    if (!rightSidebar || !mainContent) return;
    rightSidebarVisible = !rightSidebarVisible;
    rightSidebar.classList.toggle("hidden", !rightSidebarVisible);
    if (window.innerWidth > 768) {
        mainContent.classList.toggle("with-right-sidebar", rightSidebarVisible);
    }
}

const COMMANDS = [
    { id: "toggle-sidebar", label: "Prepnúť ľavý sidebar", action: () => toggleSidebar() },
    { id: "toggle-structure", label: "Prepnúť štruktúru kvízu", action: () => toggleRightSidebar() },
    { id: "toggle-theme", label: "Prepnúť svetlý / tmavý režim", action: () => toggleTheme() },
    { id: "evaluate", label: "Vyhodnotiť kvíz", action: () => evaluateQuiz() },
    { id: "clear", label: "Vymazať odpovede", action: () => clearQuiz() },
    { id: "flashcards", label: "Spustiť flashcard režim", action: () => openFlashcards() },
    { id: "practice-wrong", label: "Precvičiť chyby", action: () => practiceWrongAnswers() },
    { id: "review-wrong", label: "Zobraziť chyby", action: () => reviewWrongAnswers() },
    { id: "shortcuts", label: "Nastavenia skratiek", action: () => openShortcutSettings() },
];

function isCommandPaletteOpen() {
    const overlay = document.getElementById("command-palette-overlay");
    return !!overlay && overlay.classList.contains("visible");
}

function renderCommandPalette(query = "") {
    const list = document.getElementById("command-palette-list");
    if (!list) return;
    const normalized = query.trim().toLowerCase();
    const matches = COMMANDS.filter((command) =>
        command.label.toLowerCase().includes(normalized),
    );
    list.innerHTML = matches
        .map(
            (command, index) =>
                `<button class="command-palette-item${index === 0 ? " active" : ""}" data-command-id="${command.id}">${command.label}</button>`,
        )
        .join("");
}

function openCommandPalette() {
    const overlay = document.getElementById("command-palette-overlay");
    const input = document.getElementById("command-palette-input");
    if (!overlay || !input) return;
    overlay.classList.add("visible");
    input.value = "";
    renderCommandPalette();
    setTimeout(() => input.focus(), 0);
}

function closeCommandPalette() {
    const overlay = document.getElementById("command-palette-overlay");
    if (overlay) overlay.classList.remove("visible");
}

function runCommand(commandId) {
    const command = COMMANDS.find((item) => item.id === commandId);
    if (!command) return;
    closeCommandPalette();
    command.action();
}

function runFirstVisibleCommand() {
    const first = document.querySelector(".command-palette-item");
    if (first) runCommand(first.dataset.commandId);
}

function bindUiEvents() {
    const bind = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    };

    // Sidebar / header controls
    bind("theme-toggle",             "click", toggleTheme);
    bind("shortcut-settings-btn",    "click", openShortcutSettings);
    bind("close-sidebar-btn",        "click", toggleSidebar);
    bind("quiz-set-selector-header", "click", toggleQuizSetSelector);
    bind("filter-header",            "click", toggleFilter);
    bind("select-all-sections-btn",  "click", () => selectAllSections(true));
    bind("select-no-sections-btn",   "click", () => selectAllSections(false));
    bind("apply-filter-btn",         "click", applySectionFilter);
    bind("open-flashcards-btn",      "click", () => openFlashcards());
    bind("sidebar-overlay",          "click", toggleSidebar);

    // Right sidebar
    bind("right-sidebar-toggle",     "click", toggleRightSidebar);
    bind("close-right-sidebar-btn",  "click", toggleRightSidebar);

    // Shortcut settings
    bind("close-shortcut-settings-btn", "click", closeShortcutSettings);
    bind("start-shortcut-capture-btn",  "click", startShortcutCapture);

    // Main content controls
    bind("menu-toggle",   "click", toggleSidebar);
    bind("shuffle-btn",   "click", () => { shuffleQuestions(); shuffleOptions(); clearQuiz(); });
    bind("practice-btn",  "click", practiceWrongAnswers);
    bind("review-wrong-btn",   "click", reviewWrongAnswers);
    bind("clear-wrong-btn",    "click", clearWrongAnswerHistory);
    bind("eval-btn",      "click", evaluateQuiz);
    bind("clear-btn",     "click", clearQuiz);

    // Flashcard footer
    bind("fc-close-btn", "click", closeFlashcards);
    bind("fc-end-btn",   "click", closeFlashcards);
    bind("fc-next-btn",  "click", fcNext);
    bind("fc-reset-btn", "click", resetFlashcardsProgress);

    // Quiz set selector – event delegation on container
    const quizSetList = document.getElementById("quiz-set-list");
    if (quizSetList) {
        quizSetList.addEventListener("click", (e) => {
            const btn = e.target.closest(".quiz-set-btn");
            if (btn && btn.dataset.quizSetId) selectQuizSet(btn.dataset.quizSetId);
        });
    }

    // Flashcard body – event delegation for options + submit + final actions
    const flashcardView = document.getElementById("flashcard-view");
    if (flashcardView) {
        flashcardView.addEventListener("click", (e) => {
            const opt = e.target.closest(".fc-option[data-fc-value]");
            if (opt) {
                if (opt.dataset.fcKind === "checkbox") {
                    fcToggleMultiOption(opt);
                } else {
                    fcSelectOption(opt, opt.dataset.fcValue, opt.dataset.fcCorrect, opt.dataset.fcQid);
                }
                return;
            }
            const submitBtn = e.target.closest("[data-fc-submit]");
            if (submitBtn) {
                submitCurrentFlashcardText();
                return;
            }
            const submitMultiBtn = e.target.closest("[data-fc-submit-multi]");
            if (submitMultiBtn) {
                const current = fcQueue[fcIndex];
                if (current) fcSubmitMulti(current.qId, current.correctVal);
                return;
            }
            const action = e.target.closest("[data-fc-action]");
            if (action) {
                if (action.dataset.fcAction === "restart")
                    resetFlashcardsProgress();
                else if (action.dataset.fcAction === "close") closeFlashcards();
            }
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const mainContent = document.getElementById("main-content");

    sidebarVisible = !sidebarVisible;

    if (sidebarVisible) {
        sidebar.classList.remove("hidden");
        if (window.innerWidth <= 768) {
            overlay.classList.add("visible");
        } else {
            mainContent.classList.remove("full-width");
        }
    } else {
        sidebar.classList.add("hidden");
        overlay.classList.remove("visible");
        if (window.innerWidth > 768) {
            mainContent.classList.add("full-width");
        }
    }
    updateRightSidebarAvailability();
}

// Generate Tree Navigation
function generateTreeNav() {
    const treeNav = document.getElementById("tree-nav");
    const filterList = document.getElementById("filter-list");
    const sections = document.querySelectorAll(".section");

    if (treeNav) treeNav.innerHTML = "";
    if (filterList) filterList.innerHTML = "";

    sections.forEach((section, index) => {
        const sectionId = section.id;
        const titleEl = section.querySelector(".section-title");
        const sectionTitle = titleEl
            ? titleEl.textContent
            : `Sekcia ${index + 1}`;

        // 1. Pridaj do filter listu
        const filterItem = document.createElement("div");
        filterItem.className = "filter-item";
        filterItem.innerHTML = `
            <input type="checkbox" id="filter-${sectionId}" value="${sectionId}" checked>
            <label for="filter-${sectionId}" title="${sectionTitle}">${sectionTitle}</label>
        `;
        filterList.appendChild(filterItem);

        // 2. Pridaj do tree navigácie (existujúci kód)
        const treeSection = document.createElement("div");
        treeSection.className = "tree-section";
        treeSection.id = `tree-${sectionId}`;
        treeSection.dataset.sectionId = sectionId; // dôležité pre filter

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "tree-toggle";
        toggleBtn.innerHTML = `
            <span class="tree-icon">▼</span>
            <span>${sectionTitle}</span>
        `;
        toggleBtn.onclick = (e) => {
            if (!e.target.closest("a")) {
                treeSection.classList.toggle("collapsed");
            }
        };

        const questionsList = document.createElement("ul");
        questionsList.className = "tree-questions";

        const questions = section.querySelectorAll(".question");
        questions.forEach((question, qIndex) => {
            const questionId = question.id;
            const questionLabel =
                question.querySelector(".question-label");
            let questionText = "";
            if (questionLabel) {
                const text = questionLabel.textContent.trim();
                const match = text.match(
                    /^(\d+)\.?\s*(.+?)(?:\?|$)/,
                );
                if (match) {
                    questionText = `${match[1]}. ${match[2].substring(0, 30)}${match[2].length > 30 ? "..." : ""}`;
                } else {
                    questionText = `Otázka ${qIndex + 1}`;
                }
            } else {
                questionText = `Otázka ${qIndex + 1}`;
            }

            const li = document.createElement("li");
            li.className = "tree-question";

            const link = document.createElement("a");
            link.href = `#${questionId}`;
            link.textContent = questionText;
            link.onclick = (e) => {
                e.preventDefault();
                if (window.innerWidth <= 768) {
                    toggleSidebar();
                }
                document.getElementById(questionId).scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                document
                    .querySelectorAll(".tree-question a")
                    .forEach((a) => a.classList.remove("active"));
                link.classList.add("active");
            };

            li.appendChild(link);
            questionsList.appendChild(li);
        });

        treeSection.appendChild(toggleBtn);
        treeSection.appendChild(questionsList);
        treeNav.appendChild(treeSection);
    });
}

// Nové funkcie pre filter
function toggleFilter() {
    document
        .querySelector(".filter-section")
        .classList.toggle("collapsed");
    const icon = document.getElementById("filter-icon");
    if (icon) icon.classList.toggle("collapsed");
}

function toggleQuizSetSelector() {
    document
        .querySelector(".quiz-set-selector")
        .classList.toggle("collapsed");
    const icon = document.getElementById("quiz-set-icon");
    if (icon) icon.classList.toggle("collapsed");
}

function selectAllSections(select) {
    document
        .querySelectorAll('#filter-list input[type="checkbox"]')
        .forEach((cb) => {
            cb.checked = select;
        });
}

function applySectionFilter() {
    const checkedSections = Array.from(
        document.querySelectorAll(
            '#filter-list input[type="checkbox"]:checked',
        ),
    ).map((cb) => cb.value);

    // Skryj/zobraz sekcie v hlavnom obsahu
    document.querySelectorAll(".section").forEach((section) => {
        if (checkedSections.includes(section.id)) {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    });

    // Skryj/zobraz položky v tree navigácii
    document
        .querySelectorAll(".tree-section")
        .forEach((treeSec) => {
            const secId = treeSec.dataset.sectionId;
            if (checkedSections.includes(secId)) {
                treeSec.style.display = "block";
            } else {
                treeSec.style.display = "none";
            }
        });

    // Zobraz info o filtri
    const totalSections =
        document.querySelectorAll(".section").length;
    const msg =
        checkedSections.length === totalSections
            ? "Zobrazené všetky sekcie"
            : `Filtrované: ${checkedSections.length} z ${totalSections} sekcii`;

    // Optional: zobraz alert alebo toast
    console.log(msg);

    // Ak nie je nič vybraté, varuj
    if (checkedSections.length === 0) {
        alert("Musíte vybrať aspoň jednu sekciu!");
        // Obnov všetky
        selectAllSections(true);
        applySectionFilter();
    }

    // Skry filter na mobile po aplikovaní
    if (window.innerWidth <= 768) {
        document
            .querySelector(".filter-section")
            .classList.add("collapsed");
    }

    // Scroll hore
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Uprav evaluateQuiz aby bral len viditeľné sekcie
// Nájdi v kóde: const sections = document.querySelectorAll('.section');
// Nahraď za: const sections = document.querySelectorAll('.section:not([style*="display: none"])');

// Highlight current section on scroll
function handleScroll() {
    const sections = document.querySelectorAll(".section");
    const scrollPos = window.scrollY + 100;

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.id;
        const treeSection = document.getElementById(
            `tree-${sectionId}`,
        );

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
            // Remove active from all
            document
                .querySelectorAll(".tree-toggle")
                .forEach((t) => t.classList.remove("active"));
            // Add active to current
            if (treeSection) {
                const toggle =
                    treeSection.querySelector(".tree-toggle");
                if (toggle) toggle.classList.add("active");
            }
        }
    });
}

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
            matchedKeywords.length === keywordList.length,
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

// ── FLASHCARD MODE ────────────────────────────────────────────────────────
function getActiveSectionIds() {
    return normalizeSectionIds(
        Array.from(
        document.querySelectorAll(
            '#filter-list input[type="checkbox"]:checked',
        ),
        ).map((cb) => cb.value),
    );
}

function buildFcQueue(sectionIds = getActiveSectionIds()) {
    const activeSections = normalizeSectionIds(sectionIds);
    const allQuestions = [];
    activeSections.forEach((secId) => {
        const sec = document.getElementById(secId);
        if (!sec) return;
        sec.querySelectorAll(".question").forEach((q) => {
            const qId = q.id;
            const correctVal = q.getAttribute("data-answer");
            const keywords = q.getAttribute("data-keywords");
            const kind = q.querySelector('input[type="text"]')
                ? "text"
                : q.querySelector('input[type="checkbox"]')
                  ? "checkbox"
                  : "radio";
            const labelEl = q.querySelector(".question-label");
            const labelHTML = labelEl ? labelEl.innerHTML : "";
            const imageEl = q.querySelector("img");
            const imageHTML = imageEl ? imageEl.outerHTML : "";

            let options = [];
            if (kind !== "text") {
                q.querySelectorAll(".option").forEach((opt) => {
                    const inp = opt.querySelector(
                        'input[type="radio"], input[type="checkbox"]',
                    );
                    const span = opt.querySelector("span");
                    if (inp && span)
                        options.push({
                            value: inp.value,
                            html: span.innerHTML,
                        });
                });
            }
            allQuestions.push({
                qId,
                correctVal,
                keywords,
                kind,
                labelHTML,
                imageHTML,
                options,
            });
        });
    });
    // Fisher-Yates shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [
            allQuestions[j],
            allQuestions[i],
        ];
    }
    return allQuestions;
}

function startNewFlashcardsSession(sectionIds = getActiveSectionIds()) {
    fcSectionIds = normalizeSectionIds(sectionIds);
    fcQueue = buildFcQueue(fcSectionIds);
    fcIndex = 0;
    fcCorrect = 0;
    fcWrong = 0;
    fcSessionInitialLength = fcQueue.length;
    fcAnswered = false;
}

function buildMergedFlashcardSession(savedSession, targetSectionIds) {
    if (!isFlashcardSessionValid(savedSession)) return null;
    const normalizedTarget = normalizeSectionIds(targetSectionIds);
    const targetQueue = buildFcQueue(normalizedTarget);
    const targetIds = new Set(targetQueue.map((card) => card.qId));
    const savedIds = new Set(savedSession.queue.map((card) => card.qId));
    const canReuseSavedQueue = savedSession.queue.every((card) =>
        targetIds.has(card.qId),
    );
    if (!canReuseSavedQueue) return null;

    const addedCards = targetQueue.filter((card) => !savedIds.has(card.qId));
    return {
        ...savedSession,
        sectionIds: normalizedTarget,
        queue: [...savedSession.queue, ...addedCards],
        sessionInitialLength:
            (savedSession.sessionInitialLength || savedSession.queue.length) +
            addedCards.length,
        updatedAt: Date.now(),
    };
}

function resolveFlashcardSession(sectionIds, forceNew = false) {
    const normalizedSectionIds = normalizeSectionIds(sectionIds);
    if (forceNew) {
        startNewFlashcardsSession(normalizedSectionIds);
        return null;
    }

    const exactSession = loadFlashcardProgress(normalizedSectionIds);
    if (exactSession) {
        if (isFlashcardSessionValid(exactSession)) {
            applyFlashcardSession(exactSession);
            return exactSession;
        }
        clearFlashcardProgress(normalizedSectionIds);
    }

    const allProgress = loadAllFlashcardProgress();
    const mergeCandidate = Object.values(allProgress)
        .filter((session) => {
            if (!isFlashcardSessionValid(session)) return false;
            if (getFlashcardSectionKey(session.sectionIds) === getFlashcardSectionKey(normalizedSectionIds)) {
                return false;
            }
            return normalizeSectionIds(session.sectionIds).every((id) =>
                normalizedSectionIds.includes(id),
            );
        })
        .sort((a, b) => {
            const sectionDiff = b.sectionIds.length - a.sectionIds.length;
            if (sectionDiff !== 0) return sectionDiff;
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        })[0];

    if (mergeCandidate) {
        const mergedSession = buildMergedFlashcardSession(
            mergeCandidate,
            normalizedSectionIds,
        );
        if (mergedSession) {
            applyFlashcardSession(mergedSession);
            saveFlashcardProgress();
            return mergedSession;
        }
    }

    startNewFlashcardsSession(normalizedSectionIds);
    return null;
}

function openFlashcards(forceNew = false) {
    const selectedSectionIds = getActiveSectionIds();
    const restorableSession = resolveFlashcardSession(
        selectedSectionIds,
        forceNew,
    );
    if (fcQueue.length === 0) {
        clearFlashcardProgress(fcSectionIds);
        alert("Nie sú vybraté žiadne sekcie!");
        return;
    }
    resetFlashcardFooter();
    setFlashcardsActive(true);
    if (window.innerWidth <= 768 && sidebarVisible) toggleSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderFcCard(restorableSession?.currentCard || null);
}

function resetFlashcardsProgress() {
    clearFlashcardProgress(fcSectionIds);
    openFlashcards(true);
}

function closeFlashcards() {
    saveFlashcardProgress();
    setFlashcardsActive(false);
    saveFlashcardProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function maybeResumeFlashcardsSession() {
    const resumable = Object.values(loadAllFlashcardProgress())
        .filter(
            (session) => session.isOpen && isFlashcardSessionValid(session),
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
    if (resumable) restoreFlashcardSession(resumable);
}

function submitCurrentFlashcardText() {
    const input = document.getElementById("fc-text-input");
    if (!input) return;
    fcSubmitText(
        input.dataset.fcQid,
        input.dataset.fcKeywords || "",
        input.dataset.fcCorrect,
    );
}

function updateFcProgress() {
    const total = fcQueue.length;
    const done = fcIndex; // cards already answered (0-based before current)
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const left = total - done;
    document.getElementById("fc-progress-text").textContent =
        `Otázka ${Math.min(done + 1, total)} z ${total}`;
    document.getElementById("fc-progress-pct").textContent =
        pct + "%";
    document.getElementById("fc-progress-fill").style.width =
        pct + "%";
    document.getElementById("fc-correct-count").textContent =
        `${fcCorrect} správnych`;
    document.getElementById("fc-wrong-count").textContent =
        `${fcWrong} nesprávnych`;
    document.getElementById("fc-left-count").textContent =
        `${Math.max(left, 0)} zostáva`;
}

function renderFcCard(snapshot = null) {
    fcAnswered = snapshot ? !!snapshot.answered : false;
    resetFlashcardFooter();
    updateFcProgress();

    if (fcIndex >= fcQueue.length) {
        renderFcFinal();
        return;
    }

    const q = fcQueue[fcIndex];
    const body = document.getElementById("fc-body");

    // Shuffle options for radio questions
    let opts = [...q.options];
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    const letters = ["A", "B", "C", "D", "E"];
    let optionsHTML = "";
    if (q.kind === "radio") {
        optionsHTML =
            `<div class="fc-options">` +
            opts
                .map(
                    (o, i) => `
                <button class="fc-option" data-fc-value="${o.value}" data-fc-correct="${q.correctVal}" data-fc-qid="${q.qId}">
                    <span class="fc-option-letter">${letters[i]}</span>
                    <span>${o.html}</span>
                </button>`,
                )
                .join("") +
            `</div>`;
    } else if (q.kind === "checkbox") {
        optionsHTML = `
            <div class="fc-options fc-options-multi">
                ${opts
                    .map(
                        (o, i) => `
                    <button class="fc-option fc-option-multi" data-fc-value="${o.value}" data-fc-correct="${q.correctVal}" data-fc-qid="${q.qId}" data-fc-kind="checkbox">
                        <span class="fc-option-letter">${letters[i]}</span>
                        <span>${o.html}</span>
                    </button>`,
                    )
                    .join("")}
            </div>
            <button class="fc-submit-text" data-fc-submit-multi="true">Potvrdiť výber</button>
        `;
        document.getElementById("fc-hint").textContent =
            "Vyber všetky správne možnosti a potvrď Enterom";
    } else {
        const hint = document
            .getElementById(q.qId)
            ?.querySelector(".text-answer-hint");
        const hintHTML = hint
            ? `<div class="fc-text-hint">${hint.innerHTML}</div>`
            : "";
        optionsHTML = `<div class="fc-text-wrap">
            <input class="fc-text-input" id="fc-text-input" type="text" placeholder="Napíšte odpoveď..." autocomplete="off" spellcheck="false"
                data-fc-qid="${q.qId}" data-fc-keywords="${(q.keywords || "").replace(/"/g, "&quot;")}" data-fc-correct="${q.correctVal}">
            ${hintHTML}
            <button class="fc-submit-text" data-fc-submit="true">Overiť</button>
        </div>`;
    }

    const explanation = getExplanation(
        q.qId,
        getAutoExplanationFromFcQuestion(q),
    );
    body.innerHTML = `
        <div class="fc-question-text">${q.labelHTML}</div>
        ${q.imageHTML ? `<div class="fc-question-image">${q.imageHTML}</div>` : ""}
        ${optionsHTML}
        <div class="fc-feedback" id="fc-feedback"></div>
    `;

    if (snapshot) {
        restoreFlashcardSnapshot(snapshot);
    }

    saveFlashcardProgress();

    // focus text input
    if (q.kind === "text" && !fcAnswered) {
        setTimeout(() => {
            const inp = document.getElementById("fc-text-input");
            if (inp) inp.focus();
        }, 50);
    }
}

function fcShowFeedback(isCorrect, correctText, qId, extraText = null) {
    if (fcAnswered) return;
    fcAnswered = true;
    if (isCorrect) fcCorrect++;
    else fcWrong++;
    updateFcProgress();

    const fb = document.getElementById("fc-feedback");
    const exp = getExplanation(qId, getAutoExplanationFromFcQuestion(fcQueue[fcIndex]));
    const correctBlock =
        !isCorrect && correctText
            ? `<div class="fc-correct-answer">Správna odpoveď: ${escapeHtml(correctText)}</div>`
            : "";
    const extraBlock = extraText
        ? `<div class="fc-feedback-partial">${escapeHtml(extraText)}</div>`
        : "";
    const expBlock = exp
        ? `<div class="fc-explanation">${escapeHtml(exp)}</div>`
        : "";

    fb.className =
        "fc-feedback active " + (isCorrect ? "correct" : "wrong");
    fb.innerHTML =
        (isCorrect ? "Správne!" : "Nesprávne.") +
        extraBlock +
        correctBlock +
        expBlock;

    document.getElementById("fc-next-btn").disabled = false;
    document.getElementById("fc-hint").textContent =
        "Stlač Enter alebo →";

    // keyboard shortcut for next
    document.getElementById("fc-next-btn").focus();
    saveFlashcardProgress();
}

function fcSelectOption(btn, selectedVal, correctVal, qId) {
    if (fcAnswered) return;
    syncFlashcardRadioAnswer(qId, selectedVal);
    // Disable all options
    document
        .querySelectorAll(".fc-option")
        .forEach((b) => (b.disabled = true));
    const isCorrect = selectedVal === correctVal;
    btn.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
        document.querySelectorAll(".fc-option").forEach((b) => {
            if (b.dataset.fcValue === correctVal) b.classList.add("correct");
        });
        fcQueue.push({ ...fcQueue[fcIndex] });
    }
    const correctText = fcGetCorrectText(qId, correctVal);
    fcShowFeedback(isCorrect, isCorrect ? null : correctText, qId);
}

function fcToggleMultiOption(btn) {
    if (fcAnswered) return;
    btn.classList.toggle("selected");
    saveFlashcardProgress();
}

function fcSubmitMulti(qId, correctVal) {
    if (fcAnswered) return;
    const buttons = Array.from(document.querySelectorAll(".fc-option"));
    const selectedValues = buttons
        .filter((btn) => btn.classList.contains("selected"))
        .map((btn) => btn.dataset.fcValue);
    if (selectedValues.length === 0) return;

    const correctValues = parseMultiAnswerValues(correctVal);
    const isCorrect =
        selectedValues.length === correctValues.length &&
        selectedValues.every((value) => correctValues.includes(value));
    const partialText = getPartialMultiAnswerText(selectedValues, correctValues);

    syncFlashcardCheckboxAnswer(qId, selectedValues);
    buttons.forEach((btn) => {
        btn.disabled = true;
        const value = btn.dataset.fcValue;
        const shouldBeSelected = correctValues.includes(value);
        const isSelected = selectedValues.includes(value);
        if (shouldBeSelected) btn.classList.add("correct");
        if (shouldBeSelected && !isSelected) btn.classList.add("partial-correct");
        if (isSelected && !shouldBeSelected) btn.classList.add("wrong");
    });
    if (!isCorrect) {
        fcQueue.push({ ...fcQueue[fcIndex] });
    }
    const correctText = fcGetCorrectText(qId, correctVal);
    fcShowFeedback(
        isCorrect,
        isCorrect ? null : correctText,
        qId,
        partialText,
    );
}

function fcGetCorrectText(qId, correctVal) {
    const q = fcQueue[fcIndex];
    if (!q) return correctVal;
    const values = parseMultiAnswerValues(correctVal);
    const matches = q.options.filter((o) => values.includes(o.value));
    if (matches.length > 0) {
        return matches
            .map((opt) => {
                const tmp = document.createElement("div");
                tmp.innerHTML = opt.html;
                return tmp.textContent.trim().substring(0, 120);
            })
            .join(" / ");
    }
    return correctVal;
}

function fcSubmitText(qId, keywords, correctVal) {
    if (fcAnswered) return;
    const inp = document.getElementById("fc-text-input");
    if (!inp) return;
    const userVal = inp.value.trim().toLowerCase();
    if (!userVal) {
        inp.focus();
        return;
    }

    let isCorrect = false;
    let partialText = null;
    if (keywords) {
        const evaluation = evaluateTextKeywordAnswer(userVal, keywords);
        isCorrect = evaluation.isCorrect;
        partialText = getPartialTextKeywordAnswerText(
            evaluation.matchedCount,
            evaluation.totalCount,
        );
    } else if (correctVal !== "text") {
        isCorrect = userVal === correctVal.toLowerCase();
    }

    syncFlashcardTextAnswer(qId, inp.value);
    inp.classList.add(isCorrect ? "correct" : "wrong");
    inp.disabled = true;

    // Show accepted answers
    const accepted = keywords
        ? keywords.split(",").map((k) => k.trim())
        : correctVal !== "text"
          ? [correctVal]
          : [];
    const correctText = accepted.length ? accepted.join(" / ") : null;
    if (!isCorrect) {
        fcQueue.push({ ...fcQueue[fcIndex] });
    }
    fcShowFeedback(
        isCorrect,
        isCorrect ? null : correctText,
        qId,
        partialText,
    );
}

function fcNext() {
    fcIndex++;
    if (fcIndex >= fcQueue.length) {
        renderFcFinal();
        return;
    }
    renderFcCard();
}

function fcPrev() {
    if (fcIndex <= 0) return;
    fcIndex--;
    renderFcCard();
}

document.addEventListener("keydown", (e) => {
    const target = e.target;
    const isTyping =
        target &&
        (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isCommandPaletteOpen()) closeCommandPalette();
        else openCommandPalette();
        return;
    }
    if (isCommandPaletteOpen()) {
        if (e.key === "Escape") {
            closeCommandPalette();
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            runFirstVisibleCommand();
            return;
        }
    }
    if (capturingShortcut) {
        if (e.key === "Escape") {
            capturingShortcut = false;
            const hint = document.getElementById("shortcut-capture-hint");
            if (hint) hint.textContent = "";
            return;
        }
        if (saveSidebarShortcut(e)) e.preventDefault();
        return;
    }
    const overlay = document.getElementById("shortcut-settings-overlay");
    if (
        e.key === "Escape" &&
        overlay &&
        overlay.classList.contains("visible")
    ) {
        closeShortcutSettings();
        return;
    }
    const flashcardOverlay = document.getElementById("flashcard-view");
    const flashcardsOpen =
        flashcardOverlay && flashcardOverlay.classList.contains("active");
    if (flashcardsOpen) {
        const currentFlashcard = fcQueue[fcIndex];
        if (e.key === "Escape") {
            closeFlashcards();
            return;
        }
        if (isTyping && e.key === "Enter" && !fcAnswered) {
            e.preventDefault();
            submitCurrentFlashcardText();
            return;
        }
        if (
            !isTyping &&
            e.key === "Enter" &&
            !fcAnswered &&
            currentFlashcard &&
            currentFlashcard.kind === "checkbox"
        ) {
            e.preventDefault();
            fcSubmitMulti(currentFlashcard.qId, currentFlashcard.correctVal);
            return;
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            fcPrev();
            return;
        }
        if ((e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") && fcAnswered) {
            e.preventDefault();
            fcNext();
            return;
        }
        if (!isTyping && /^[1-9]$/.test(e.key) && !fcAnswered) {
            const index = Number(e.key) - 1;
            const option = document.querySelectorAll(".fc-option")[index];
            if (option) {
                e.preventDefault();
                option.click();
            }
        }
        return;
    }
    if (shortcutMatches(e, getSidebarShortcut())) {
        e.preventDefault();
        toggleSidebar();
    }
});

function renderFcFinal() {
    const total = fcQueue.length;
    const pct =
        total > 0 ? Math.round((fcCorrect / total) * 100) : 0;
    const extraRetries = Math.max(total - fcSessionInitialLength, 0);
    let emoji = "";
    let msg = "Nevzdávaj to!";
    if (pct >= 90) {
        emoji = "";
        msg = "Výborné!";
    } else if (pct >= 70) {
        emoji = "";
        msg = "Dobré!";
    } else if (pct >= 50) {
        emoji = "";
        msg = "Treba precvičiť";
    }

    document.getElementById("fc-body").innerHTML = `
        <div class="fc-final">
            <div class="fc-final-emoji">${emoji}</div>
            <div class="fc-final-score">${msg}</div>
            <div class="fc-final-score fc-final-score-large">${fcCorrect} / ${total} (${pct}%)</div>
            <div class="fc-final-detail">
                ${fcCorrect} správnych &nbsp;|&nbsp; ${fcWrong} nesprávnych
            </div>
            <div class="fc-final-detail">
                ${extraRetries > 0 ? `Vrátané otázky navyše: ${extraRetries}` : "Bez vrátených otázok navyše"}
            </div>
            <div class="fc-final-actions">
                <button class="fc-btn fc-btn-next" data-fc-action="restart">Znovu (zamiešaj)</button>
                <button class="fc-btn fc-btn-end" data-fc-action="close">Zavrieť</button>
            </div>
        </div>`;
    document.getElementById("fc-footer").style.display = "none";
    document.getElementById("fc-progress-fill").style.width =
        "100%";
    document.getElementById("fc-progress-text").textContent =
        `Hotovo! ${total} z ${total}`;
    document.getElementById("fc-progress-pct").textContent = "100%";
    document.getElementById("fc-left-count").textContent =
        "0 zostáva";
    clearFlashcardProgress();
}

// ─── Dynamic quiz-set script loader ─────────────────────────────────────────
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = src;
        el.onload = resolve;
        el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(el);
    });
}

function showAppError(title, detail) {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return;
    mount.innerHTML = `
        <div class="app-error">
            <strong>${title}</strong>
            <p>${detail}</p>
        </div>
    `;
}

async function loadQuizSetScripts() {
    const id = window.QUIZ_SET_ID;
    const sets = window.QUIZ_SETS || [];
    const set = sets.find((s) => s.id === id);
    if (!set) {
        showAppError(
            "Neznámy kvízový set.",
            `Set "${id}" nie je zaregistrovaný v confg.js.`,
        );
        return false;
    }
    window.QUIZ_FRAGMENT_HTML = undefined;
    window.QUIZ_EXPLANATIONS = undefined;
    try {
        await loadScript(set.fragEmbed);
        await loadScript(set.explanations);
        return true;
    } catch (err) {
        console.error("loadQuizSetScripts", err);
        showAppError(
            "Nepodarilo sa načítať kvízový set.",
            err.message || "Skontrolujte cesty ku quiz set súborom.",
        );
        return false;
    }
}

function renderQuizSetSelector() {
    const sets = window.QUIZ_SETS || [];
    const current = window.QUIZ_SET_ID;
    const container = document.getElementById("quiz-set-list");
    if (!container) return;
    container.innerHTML = sets
        .map(
            (s) =>
                `<button class="quiz-set-btn${s.id === current ? " active" : ""}" data-quiz-set-id="${s.id}">${s.label}</button>`,
        )
        .join("");
}

function selectQuizSet(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("set", id);
    window.location.href = url.toString();
}

/* ─── Theme Toggle ─────────────────────────────────────────────────── */
const THEME_STORAGE_KEY = "quiz_theme_preference";

function applyTheme(theme) {
    const html = document.documentElement;
    const icon = document.getElementById("theme-toggle-icon");
    if (theme === "dark") {
        html.setAttribute("data-theme", "dark");
        if (icon) {
            icon.src = "sun-svgrepo-com.svg";
            icon.alt = "Svetlý režim";
            icon.dataset.themeIcon = "sun";
        }
    } else {
        html.removeAttribute("data-theme");
        if (icon) {
            icon.src = "moon-stars-svgrepo-com.svg";
            icon.alt = "Tmavý režim";
            icon.dataset.themeIcon = "moon";
        }
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {}
}

function loadTheme() {
    let theme = "light";
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) theme = stored;
    } catch (e) {}
    applyTheme(theme);
}

function getHtmlFragmentUrl() {
    if (window.QUIZ_SET_FRAGMENT_URL)
        return window.QUIZ_SET_FRAGMENT_URL;
    const id = window.QUIZ_SET_ID || "default";
    return `quiz_sets/${id}.frag.html`;
}

function applyQuizFragmentHtml(html) {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return;
    mount.innerHTML = html;
    const h1 = mount.querySelector("h1");
    if (h1 && h1.textContent.trim()) document.title = h1.textContent.trim();
}

async function loadQuizContent() {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return false;

    const embedded =
        typeof window.QUIZ_FRAGMENT_HTML === "string"
            ? window.QUIZ_FRAGMENT_HTML
            : "";

    if (window.QUIZ_TRY_FETCH_FIRST === true) {
        try {
            const url = getHtmlFragmentUrl();
            const res = await fetch(url, { cache: "no-cache" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            applyQuizFragmentHtml(await res.text());
            return true;
        } catch (err) {
            console.warn("fetch fragment; pokus o embed", err);
            if (embedded) {
                applyQuizFragmentHtml(embedded);
                return true;
            }
        }
    } else if (embedded) {
        applyQuizFragmentHtml(embedded);
        return true;
    }

    const url = getHtmlFragmentUrl();
    try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        applyQuizFragmentHtml(await res.text());
        return true;
    } catch (err) {
        console.error("loadQuizContent", err);
        mount.innerHTML =
            `<p class="quiz-load-error">` +
            `Nepodarilo sa načítať otázky. Bez HTTP servera musí byť načítaný súbor ` +
            `<code>quiz_sets/&lt;id&gt;.frag.embed.js</code> ` +
            `(vygenerujte ho príkazom ` +
            `<code>python3 embed_quiz_fragment.py</code>). ` +
            `Alternatíva: spustite server v koreňovom priečinku ` +
            `(napr. <code>python3 -m http.server</code>) ` +
            `a otvorte stránku cez HTTP; fetch sa pokúsi stiahnuť ` +
            `<code>${url}</code>.` +
            `</p>`;
        return false;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    loadTheme();
    renderQuizSetSelector();
    updateSidebarShortcutLabel();
    updateRightSidebarAvailability();
    bindUiEvents();

    // Command palette input
    const commandInput = document.getElementById("command-palette-input");
    const commandList = document.getElementById("command-palette-list");
    if (commandInput) {
        commandInput.addEventListener("input", (e) =>
            renderCommandPalette(e.target.value),
        );
    }
    if (commandList) {
        commandList.addEventListener("click", (e) => {
            const item = e.target.closest(".command-palette-item");
            if (item) runCommand(item.dataset.commandId);
        });
    }

    const scriptsOk = await loadQuizSetScripts();
    if (!scriptsOk) return;
    EXPLANATIONS = window.QUIZ_EXPLANATIONS || {};

    const ok = await loadQuizContent();
    if (!ok) return;

    generateTreeNav();
    loadAnswers();
    updateWrongAnswerControls();

    // Auto-save on any input change
    document.addEventListener("change", (e) => {
        if (e.target.matches('input[type="radio"], input[type="checkbox"], input[type="text"]')) {
            saveAnswers();
        }
    });
    document.addEventListener("input", (e) => {
        if (e.target.matches('input[type="text"]')) {
            saveAnswers();
            if (e.target.id === "fc-text-input") saveFlashcardProgress();
        }
    });
    window.addEventListener("beforeunload", saveFlashcardProgress);

    window.addEventListener("scroll", handleScroll);

    // Handle window resize
    window.addEventListener("resize", () => {
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        const mainContent = document.getElementById("main-content");

        if (window.innerWidth > 768) {
            overlay.classList.remove("visible");
            if (sidebarVisible) {
                mainContent.classList.remove("full-width");
            } else {
                mainContent.classList.add("full-width");
            }
            mainContent.classList.toggle("with-right-sidebar", rightSidebarVisible);
        } else {
            if (sidebarVisible) {
                overlay.classList.add("visible");
            }
            mainContent.classList.remove("with-right-sidebar");
        }
        updateRightSidebarAvailability();
    });

    maybeResumeFlashcardsSession();
});
