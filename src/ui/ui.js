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
    { id: "editor", label: "Upraviť kvízový set", action: () => openQuizEditor() },
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

Object.assign(window, {
    getDefaultSidebarShortcut,
    getSidebarShortcut,
    formatShortcut,
    shortcutMatches,
    updateSidebarShortcutLabel,
    openShortcutSettings,
    closeShortcutSettings,
    startShortcutCapture,
    saveSidebarShortcut,
    updateRightSidebarAvailability,
    toggleRightSidebar,
    isCommandPaletteOpen,
    renderCommandPalette,
    openCommandPalette,
    closeCommandPalette,
    runCommand,
    runFirstVisibleCommand,
    bindUiEvents,
    toggleSidebar,
    generateTreeNav,
    toggleFilter,
    toggleQuizSetSelector,
    selectAllSections,
    applySectionFilter,
    handleScroll,
});

export {
    getDefaultSidebarShortcut,
    getSidebarShortcut,
    formatShortcut,
    shortcutMatches,
    updateSidebarShortcutLabel,
    openShortcutSettings,
    closeShortcutSettings,
    startShortcutCapture,
    saveSidebarShortcut,
    updateRightSidebarAvailability,
    toggleRightSidebar,
    isCommandPaletteOpen,
    renderCommandPalette,
    openCommandPalette,
    closeCommandPalette,
    runCommand,
    runFirstVisibleCommand,
    bindUiEvents,
    toggleSidebar,
    generateTreeNav,
    toggleFilter,
    toggleQuizSetSelector,
    selectAllSections,
    applySectionFilter,
    handleScroll,
};
