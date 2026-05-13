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
            allQuestions.push(refreshFlashcardCardFromDom({ qId: q.id }));
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
            if (
                getFlashcardSectionKey(session.sectionIds) ===
                getFlashcardSectionKey(normalizedSectionIds)
            ) {
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

function restoreFlashcardSession(session) {
    applyFlashcardSession(session);
    resetFlashcardFooter();
    setFlashcardsActive(true);
    if (window.innerWidth <= 768 && sidebarVisible) toggleSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderFcCard(session.currentCard || null);
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
        input.dataset.fcAnswerMode || "",
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
                data-fc-qid="${q.qId}" data-fc-keywords="${(q.keywords || "").replace(/"/g, "&quot;")}" data-fc-correct="${q.correctVal}" data-fc-answer-mode="${(q.answerMode || "").replace(/"/g, "&quot;")}">
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

function fcSubmitText(qId, keywords, correctVal, answerMode = null) {
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
        const evaluation = evaluateTextKeywordAnswer(userVal, keywords, answerMode);
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
        ? parseTextKeywords(keywords)
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
    clearFlashcardProgress(fcSectionIds);
}

Object.assign(window, {
    getActiveSectionIds,
    buildFcQueue,
    startNewFlashcardsSession,
    buildMergedFlashcardSession,
    resolveFlashcardSession,
    openFlashcards,
    resetFlashcardsProgress,
    closeFlashcards,
    restoreFlashcardSession,
    maybeResumeFlashcardsSession,
    submitCurrentFlashcardText,
    updateFcProgress,
    renderFcCard,
    fcShowFeedback,
    fcSelectOption,
    fcToggleMultiOption,
    fcSubmitMulti,
    fcGetCorrectText,
    fcSubmitText,
    fcNext,
    fcPrev,
    renderFcFinal,
});

export {
    getActiveSectionIds,
    buildFcQueue,
    startNewFlashcardsSession,
    buildMergedFlashcardSession,
    resolveFlashcardSession,
    openFlashcards,
    resetFlashcardsProgress,
    closeFlashcards,
    restoreFlashcardSession,
    maybeResumeFlashcardsSession,
    submitCurrentFlashcardText,
    updateFcProgress,
    renderFcCard,
    fcShowFeedback,
    fcSelectOption,
    fcToggleMultiOption,
    fcSubmitMulti,
    fcGetCorrectText,
    fcSubmitText,
    fcNext,
    fcPrev,
    renderFcFinal,
};
