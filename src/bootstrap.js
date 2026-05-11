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
