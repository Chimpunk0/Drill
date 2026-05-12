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

Object.assign(window, {
    shuffleArray,
    shuffleQuestions,
    shuffleOptions,
    practiceWrongAnswers,
    reviewWrongAnswers,
    exitPracticeMode,
});

export {
    shuffleArray,
    shuffleQuestions,
    shuffleOptions,
    practiceWrongAnswers,
    reviewWrongAnswers,
    exitPracticeMode,
};
