// ─── EXPLANATIONS (quiz_sets/<id>.explanations.js, cez window.QUIZ_EXPLANATIONS) ──
const EXPLANATIONS = window.QUIZ_EXPLANATIONS || {};

// ─── localStorage (oddelené per set, ak nepoužijete QUIZ_STORAGE_KEY) ────
const STORAGE_KEY =
    window.QUIZ_STORAGE_KEY ||
    `vba_kviz_answers_${window.QUIZ_SET_ID || "default"}`;

function saveAnswers() {
    const state = {};
    document
        .querySelectorAll('input[type="radio"]:checked')
        .forEach((r) => {
            state["r_" + r.name] = r.value;
        });
    document
        .querySelectorAll('input[type="text"]')
        .forEach((inp) => {
            if (inp.value) state["t_" + inp.id] = inp.value;
        });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
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
let practiceMode = false;
let incorrectQuestionIds = [];

function practiceWrongAnswers() {
    if (incorrectQuestionIds.length === 0) {
        alert(
            "Žiadne nesprávne odpovede na precvičenie!\nNajprv klikni na Vyhodnotiť kvíz.",
        );
        return;
    }
    practiceMode = true;
    document.querySelectorAll(".question").forEach((q) => {
        if (incorrectQuestionIds.includes(q.id)) {
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
        q.querySelectorAll('input[type="text"]').forEach(
            (t) => (t.value = ""),
        );
    });
    document.getElementById("result-container").style.display =
        "none";
    const btn = document.getElementById("practice-btn");
    btn.textContent = "✖ Ukončiť precvičovanie";
    btn.onclick = exitPracticeMode;
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
    btn.textContent = "🎯 Precvičiť chyby";
    btn.onclick = practiceWrongAnswers;
}

// ─── Global state ────────────────────────────────────────────────────────
let sidebarVisible = true;

// Check if mobile on load
if (window.innerWidth <= 768) {
    sidebarVisible = false;
    document.getElementById("sidebar").classList.add("hidden");
    document
        .getElementById("main-content")
        .classList.add("full-width");
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
}

// Generate Tree Navigation
function generateTreeNav() {
    const treeNav = document.getElementById("tree-nav");
    const filterList = document.getElementById("filter-list");
    const sections = document.querySelectorAll(".section");

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
) {
    let html = `<div class="feedback ${cssClass}" style="display:block">`;
    html += `<span>${statusText}</span>`;
    if (correctAnswerText) {
        html += `<div style="margin-top:0.4rem;font-size:0.92rem;opacity:0.9">✅ Správna odpoveď: <strong>${correctAnswerText}</strong></div>`;
    }
    if (explanation) {
        html += `<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.12);font-size:0.88rem;opacity:0.85;font-style:italic">💡 ${explanation}</div>`;
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
            const explanation = EXPLANATIONS[qId] || null;
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
                        "⚠️ Nezodpovedané.",
                        "incorrect",
                        explanation,
                        correctText,
                    );
                } else if (selected.value === correctVal) {
                    score++;
                    answered++;
                    feedbackEl.outerHTML = buildFeedbackHTML(
                        qId,
                        "✓ Správne!",
                        "correct",
                        explanation,
                        null,
                    );
                } else {
                    answered++;
                    incorrectQuestionIds.push(qId);
                    feedbackEl.outerHTML = buildFeedbackHTML(
                        qId,
                        "✗ Nesprávne.",
                        "incorrect",
                        explanation,
                        correctText,
                    );
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
                        "⚠️ Nezodpovedané.",
                        "incorrect",
                        explanation,
                        acceptedAnswers.length
                            ? acceptedAnswers[0]
                            : null,
                    );
                } else {
                    let isCorrect = false;
                    if (keywords) {
                        const keywordList = keywords
                            .split(",")
                            .map((k) => k.trim().toLowerCase());
                        const normalizedUser = userVal
                            .replace(/\s+/g, " ")
                            .trim();
                        isCorrect = keywordList.some((kw) =>
                            normalizedUser.includes(
                                kw.replace(/\s+/g, " ").trim(),
                            ),
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
                            "✓ Správne!",
                            "correct",
                            explanation,
                            null,
                        );
                    } else {
                        incorrectQuestionIds.push(qId);
                        feedbackEl.outerHTML = buildFeedbackHTML(
                            qId,
                            "✗ Nesprávne.",
                            "incorrect",
                            explanation,
                            acceptedAnswers.length
                                ? acceptedAnswers.join(" / ")
                                : null,
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
        if (percent >= 90) message = "🎉 Výborné!";
        else if (percent >= 70) message = "👍 Dobré!";
        else if (percent >= 50) message = "📚 Treba precvičiť";
        else message = "💪 Nevzdávaj to!";

        const wrongCount = incorrectQuestionIds.length;
        resText.innerHTML = `
            ${message}<br>
            Výsledok: <strong>${score} / ${total}</strong> (${percent}%)<br>
            <small>Zodpovedané: ${answered}/${total} | Nesprávne: ${wrongCount}</small>
        `;
        progressFill.style.width = `${percent}%`;
    }
    // Update practice button visibility
    const practiceBtn = document.getElementById("practice-btn");
    if (practiceBtn) {
        practiceBtn.style.display =
            incorrectQuestionIds.length > 0
                ? "inline-flex"
                : "none";
    }
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
        .querySelectorAll('input[type="text"]')
        .forEach((i) => (i.value = ""));
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
    const practiceBtn = document.getElementById("practice-btn");
    if (practiceBtn) practiceBtn.style.display = "none";
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

// ── FLASHCARD MODE ────────────────────────────────────────────────────────
let fcQueue = []; // shuffled question objects
let fcIndex = 0; // current position in queue
let fcCorrect = 0;
let fcWrong = 0;
let fcAnswered = false; // has user answered current card?

function getActiveSectionIds() {
    return Array.from(
        document.querySelectorAll(
            '#filter-list input[type="checkbox"]:checked',
        ),
    ).map((cb) => cb.value);
}

function buildFcQueue() {
    const activeSections = getActiveSectionIds();
    const allQuestions = [];
    activeSections.forEach((secId) => {
        const sec = document.getElementById(secId);
        if (!sec) return;
        sec.querySelectorAll(".question").forEach((q) => {
            const qId = q.id;
            const correctVal = q.getAttribute("data-answer");
            const keywords = q.getAttribute("data-keywords");
            const isText = !!q.querySelector('input[type="text"]');
            const labelEl = q.querySelector(".question-label");
            const labelHTML = labelEl ? labelEl.innerHTML : "";

            let options = [];
            if (!isText) {
                q.querySelectorAll(".option").forEach((opt) => {
                    const inp = opt.querySelector(
                        'input[type="radio"]',
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
                isText,
                labelHTML,
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

function openFlashcards() {
    fcQueue = buildFcQueue();
    fcIndex = 0;
    fcCorrect = 0;
    fcWrong = 0;
    if (fcQueue.length === 0) {
        alert("Nie sú vybraté žiadne sekcie!");
        return;
    }
    document
        .getElementById("flashcard-overlay")
        .classList.add("active");
    document.body.style.overflow = "hidden";
    // close sidebar on mobile
    if (window.innerWidth <= 768 && sidebarVisible) toggleSidebar();
    renderFcCard();
}

function closeFlashcards() {
    document
        .getElementById("flashcard-overlay")
        .classList.remove("active");
    document.body.style.overflow = "";
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
        `✓ ${fcCorrect} správnych`;
    document.getElementById("fc-wrong-count").textContent =
        `✗ ${fcWrong} nesprávnych`;
    document.getElementById("fc-left-count").textContent =
        `⬜ ${Math.max(left, 0)} zostáva`;
}

function renderFcCard() {
    fcAnswered = false;
    document.getElementById("fc-next-btn").disabled = true;
    document.getElementById("fc-hint").textContent = "";
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
    if (!q.isText) {
        optionsHTML =
            `<div class="fc-options">` +
            opts
                .map(
                    (o, i) => `
                <button class="fc-option" onclick="fcSelectOption(this, '${o.value}', '${q.correctVal}', '${q.qId}')">
                    <span class="fc-option-letter">${letters[i]}</span>
                    <span>${o.html}</span>
                </button>`,
                )
                .join("") +
            `</div>`;
    } else {
        const hint = document
            .getElementById(q.qId)
            ?.querySelector(".text-answer-hint");
        const hintHTML = hint
            ? `<div style="font-size:0.82rem;color:var(--text-secondary);font-style:italic">${hint.innerHTML}</div>`
            : "";
        optionsHTML = `<div class="fc-text-wrap">
            <input class="fc-text-input" id="fc-text-input" type="text" placeholder="Napíšte odpoveď..." autocomplete="off" spellcheck="false"
                onkeydown="if(event.key==='Enter')fcSubmitText('${q.qId}','${(q.keywords || "").replace(/'/g, "\\'")}','${q.correctVal}')">
            ${hintHTML}
            <button class="fc-submit-text" onclick="fcSubmitText('${q.qId}','${(q.keywords || "").replace(/'/g, "\\'")}','${q.correctVal}')">Overiť</button>
        </div>`;
    }

    const explanation = EXPLANATIONS[q.qId] || null;
    body.innerHTML = `
        <div class="fc-question-text">${q.labelHTML}</div>
        ${optionsHTML}
        <div class="fc-feedback" id="fc-feedback"></div>
    `;

    // focus text input
    if (q.isText) {
        setTimeout(() => {
            const inp = document.getElementById("fc-text-input");
            if (inp) inp.focus();
        }, 50);
    }
}

function fcShowFeedback(isCorrect, correctText, qId) {
    if (fcAnswered) return;
    fcAnswered = true;
    if (isCorrect) fcCorrect++;
    else fcWrong++;
    updateFcProgress();

    const fb = document.getElementById("fc-feedback");
    const exp = EXPLANATIONS[qId] || null;
    const correctBlock =
        !isCorrect && correctText
            ? `<div class="fc-correct-answer">✅ Správna odpoveď: ${correctText}</div>`
            : "";
    const expBlock = exp
        ? `<div class="fc-explanation">💡 ${exp}</div>`
        : "";

    fb.className =
        "fc-feedback active " + (isCorrect ? "correct" : "wrong");
    fb.innerHTML =
        (isCorrect ? "✓ Správne!" : "✗ Nesprávne.") +
        correctBlock +
        expBlock;

    document.getElementById("fc-next-btn").disabled = false;
    document.getElementById("fc-hint").textContent =
        "Stlač Enter alebo →";

    // keyboard shortcut for next
    document.getElementById("fc-next-btn").focus();
}

function fcSelectOption(btn, selectedVal, correctVal, qId) {
    if (fcAnswered) return;
    // Disable all options
    document
        .querySelectorAll(".fc-option")
        .forEach((b) => (b.disabled = true));
    const isCorrect = selectedVal === correctVal;
    btn.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
        // highlight correct
        document.querySelectorAll(".fc-option").forEach((b) => {
            const bVal = b.querySelector(".fc-option-letter")
                ? null
                : null;
            // find button whose onclick contains correctVal
            if (
                b.getAttribute("onclick") &&
                b
                    .getAttribute("onclick")
                    .includes(`'${correctVal}'`)
            ) {
                b.classList.add("correct");
            }
        });
    }
    const correctText = fcGetCorrectText(qId, correctVal);
    fcShowFeedback(isCorrect, isCorrect ? null : correctText, qId);
}

function fcGetCorrectText(qId, correctVal) {
    const q = fcQueue[fcIndex];
    if (!q) return correctVal;
    const opt = q.options.find((o) => o.value === correctVal);
    if (opt) {
        const tmp = document.createElement("div");
        tmp.innerHTML = opt.html;
        return tmp.textContent.trim().substring(0, 120);
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
    if (keywords) {
        const kwList = keywords
            .split(",")
            .map((k) => k.trim().toLowerCase());
        const normalizedUser = userVal.replace(/\s+/g, " ").trim();
        isCorrect = kwList.some((kw) =>
            normalizedUser.includes(kw.replace(/\s+/g, " ").trim()),
        );
    } else if (correctVal !== "text") {
        isCorrect = userVal === correctVal.toLowerCase();
    }

    inp.classList.add(isCorrect ? "correct" : "wrong");
    inp.disabled = true;

    // Show accepted answers
    const accepted = keywords
        ? keywords.split(",").map((k) => k.trim())
        : correctVal !== "text"
          ? [correctVal]
          : [];
    const correctText = accepted.length ? accepted[0] : null;
    fcShowFeedback(isCorrect, isCorrect ? null : correctText, qId);
}

function fcNext() {
    fcIndex++;
    if (fcIndex >= fcQueue.length) {
        renderFcFinal();
        return;
    }
    renderFcCard();
}

// Keyboard: Enter/ArrowRight = next when answered
document.addEventListener("keydown", (e) => {
    if (
        !document
            .getElementById("flashcard-overlay")
            .classList.contains("active")
    )
        return;
    if (e.key === "Escape") {
        closeFlashcards();
        return;
    }
    if (
        (e.key === "Enter" || e.key === "ArrowRight") &&
        fcAnswered
    ) {
        fcNext();
    }
});

function renderFcFinal() {
    const total = fcQueue.length;
    const pct =
        total > 0 ? Math.round((fcCorrect / total) * 100) : 0;
    let emoji = "💪";
    let msg = "Nevzdávaj to!";
    if (pct >= 90) {
        emoji = "🎉";
        msg = "Výborné!";
    } else if (pct >= 70) {
        emoji = "👍";
        msg = "Dobré!";
    } else if (pct >= 50) {
        emoji = "📚";
        msg = "Treba precvičiť";
    }

    document.getElementById("fc-body").innerHTML = `
        <div class="fc-final">
            <div class="fc-final-emoji">${emoji}</div>
            <div class="fc-final-score">${msg}</div>
            <div class="fc-final-score" style="font-size:2rem">${fcCorrect} / ${total} (${pct}%)</div>
            <div class="fc-final-detail">
                ✓ ${fcCorrect} správnych &nbsp;|&nbsp; ✗ ${fcWrong} nesprávnych
            </div>
            <div class="fc-final-actions">
                <button class="fc-btn fc-btn-next" onclick="openFlashcards()">🔄 Znovu (zamiešaj)</button>
                <button class="fc-btn fc-btn-end"  onclick="closeFlashcards()">✖ Zavrieť</button>
            </div>
        </div>`;
    document.getElementById("fc-footer").style.display = "none";
    document.getElementById("fc-progress-fill").style.width =
        "100%";
    document.getElementById("fc-progress-text").textContent =
        `Hotovo! ${total} z ${total}`;
    document.getElementById("fc-progress-pct").textContent = "100%";
    document.getElementById("fc-left-count").textContent =
        "⬜ 0 zostáva";
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
            `<p class="quiz-load-error" style="color:var(--error);padding:1rem;line-height:1.5;">` +
            `Nepodarilo sa načítať otázky. Bez HTTP servera musí byť načítaný súbor ` +
            `<code style="color:var(--accent-color);">quiz_sets/&lt;id&gt;.frag.embed.js</code> ` +
            `(vygenerujte ho príkazom ` +
            `<code style="color:var(--accent-color);">python3 embed_quiz_fragment.py</code>). ` +
            `Alternatíva: spustite server v koreňovom priečinku ` +
            `(napr. <code style="color:var(--accent-color);">python3 -m http.server</code>) ` +
            `a otvorte stránku cez HTTP; fetch sa pokúsi stiahnuť ` +
            `<code style="color:var(--accent-color);">${url}</code>.` +
            `</p>`;
        return false;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    const ok = await loadQuizContent();
    if (!ok) return;

    generateTreeNav();
    loadAnswers();

    // Auto-save on any input change
    document.addEventListener("change", (e) => {
        if (
            e.target.matches(
                'input[type="radio"], input[type="text"]',
            )
        ) {
            saveAnswers();
        }
    });
    document.addEventListener("input", (e) => {
        if (e.target.matches('input[type="text"]')) saveAnswers();
    });

    document
        .getElementById("eval-btn")
        .addEventListener("click", evaluateQuiz);
    document
        .getElementById("clear-btn")
        .addEventListener("click", clearQuiz);

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
        } else {
            if (sidebarVisible) {
                overlay.classList.add("visible");
            }
        }
    });
});
