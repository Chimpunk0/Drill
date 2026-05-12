function showAppError(title, detail) {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return;
    mount.innerHTML = `
        <div class="app-error">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(detail)}</p>
        </div>
    `;
}

function getCurrentQuizSet() {
    const id = window.QUIZ_SET_ID;
    const sets = window.QUIZ_SETS || [];
    return sets.find((set) => set.id === id) || null;
}

function getCurrentQuizSetAssetBase() {
    const set = getCurrentQuizSet();
    const dataUrl = set?.dataUrl || `quiz_sets/${window.QUIZ_SET_ID}.json`;
    const slashIndex = dataUrl.lastIndexOf("/");
    return slashIndex === -1 ? "" : dataUrl.slice(0, slashIndex + 1);
}

function getQuizDataUrl() {
    const set = getCurrentQuizSet();
    return set?.dataUrl || `quiz_sets/${window.QUIZ_SET_ID}.json`;
}

async function loadQuizSetData() {
    const set = getCurrentQuizSet();
    if (!set) {
        showAppError(
            "Neznámy kvízový set.",
            `Set "${window.QUIZ_SET_ID}" nie je zaregistrovaný v src/config/quizSets.js.`,
        );
        return null;
    }

    try {
        const res = await fetch(getQuizDataUrl(), { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("loadQuizSetData", err);
        showAppError(
            "Nepodarilo sa načítať kvízový set.",
            err.message || "Skontrolujte cestu k JSON súboru quiz setu.",
        );
        return null;
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
                `<button class="quiz-set-btn${s.id === current ? " active" : ""}" data-quiz-set-id="${escapeHtml(s.id)}">${escapeHtml(s.label)}</button>`,
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
            icon.src = "src/assets/sun-svgrepo-com.svg";
            icon.alt = "Svetlý režim";
            icon.dataset.themeIcon = "sun";
        }
    } else {
        html.removeAttribute("data-theme");
        if (icon) {
            icon.src = "src/assets/moon-stars-svgrepo-com.svg";
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

function normalizeQuizMediaUrls(root) {
    if (!root) return;
    const base = getCurrentQuizSetAssetBase();
    root.querySelectorAll("img[src]").forEach((img) => {
        const src = img.getAttribute("src");
        if (
            !src ||
            /^(?:[a-z]+:|\/|#)/i.test(src) ||
            src.startsWith(base)
        ) {
            return;
        }
        img.setAttribute("src", base + src);
    });
}

function htmlText(item, plainKey, htmlKey) {
    const snakeKey = htmlKey.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
    if (typeof item?.[htmlKey] === "string") return item[htmlKey];
    if (typeof item?.[snakeKey] === "string") return item[snakeKey];
    return escapeHtml(item?.[plainKey] || "");
}

function renderQuestionImage(question) {
    const imageHtml = question.imageHtml || question.image_html;
    if (typeof imageHtml === "string") {
        return `<div class="question-image">${imageHtml}</div>`;
    }
    if (typeof question.image === "string" && question.image.trim()) {
        return `
            <div class="question-image">
                <img class="question-image" src="${escapeHtml(question.image)}" alt="${escapeHtml(question.imageAlt || question.image_alt || "")}" loading="lazy" />
            </div>
        `;
    }
    return "";
}

function renderOptions(question, inputType) {
    return (question.options || [])
        .map((option) => {
            const value = escapeHtml(option.value);
            const label = typeof option.html === "string"
                ? option.html
                : escapeHtml(option.text || "");
            return `
                <label class="option">
                    <input type="${inputType}" name="${escapeHtml(question.id)}" value="${value}" /><span>${label}</span>
                </label>
            `;
        })
        .join("");
}

function renderQuestion(question) {
    const labelHtml = htmlText(question, "label", "labelHtml");
    const imageHtml = renderQuestionImage(question);
    const feedback = `<div class="feedback" id="${escapeHtml(question.id)}-fb"></div>`;

    if (question.type === "mcq" || question.type === "mcq_multi") {
        const answer = Array.isArray(question.answer)
            ? question.answer.join(",")
            : question.answer || "";
        const inputType = question.type === "mcq_multi" ? "checkbox" : "radio";
        return `
            <div class="question" id="${escapeHtml(question.id)}" data-answer="${escapeHtml(answer)}">
                <div class="question-label">${labelHtml}</div>
                ${imageHtml}
                <div class="options">${renderOptions(question, inputType)}</div>
                ${feedback}
            </div>
        `;
    }

    const keywords = Array.isArray(question.keywords)
        ? question.keywords.join(",")
        : "";
    const hintHtmlValue = question.hintHtml || question.hint_html;
    const hintHtml = typeof hintHtmlValue === "string"
        ? hintHtmlValue
        : question.hint
          ? escapeHtml(question.hint)
          : "";

    return `
        <div class="question" id="${escapeHtml(question.id)}" data-answer="text" data-keywords="${escapeHtml(keywords)}">
            <div class="question-label">${labelHtml}</div>
            ${imageHtml}
            <div class="text-input-wrap">
                <input type="text" id="${escapeHtml(question.id)}-input" placeholder="${escapeHtml(question.placeholder || "Napíšte odpoveď...")}" autocomplete="off" spellcheck="false" />
            </div>
            ${hintHtml ? `<div class="text-answer-hint">${hintHtml}</div>` : ""}
            ${feedback}
        </div>
    `;
}

function renderQuizData(data) {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return false;
    if (!data || !Array.isArray(data.sections)) {
        showAppError(
            "Neplatný kvízový set.",
            "JSON súbor musí obsahovať pole sections.",
        );
        return false;
    }

    const explanations = {};
    const sections = data.sections
        .map((section, index) => {
            const sectionId = section.id || `sec_${index + 1}`;
            const questions = Array.isArray(section.questions)
                ? section.questions
                : [];
            questions.forEach((question) => {
                if (question.id && typeof question.explanation === "string") {
                    explanations[question.id] = question.explanation;
                }
            });
            return `
                <div class="section" id="${escapeHtml(sectionId)}" data-section="${index + 1}">
                    <div class="section-title">${htmlText(section, "title", "titleHtml")}</div>
                    ${questions.map(renderQuestion).join("")}
                </div>
            `;
        })
        .join("");

    mount.innerHTML = `
        <h1>${escapeHtml(data.title || getCurrentQuizSet()?.label || "Kvíz")}</h1>
        ${sections}
    `;
    normalizeQuizMediaUrls(mount);
    document.title = data.title || getCurrentQuizSet()?.label || document.title;
    EXPLANATIONS = explanations;
    window.QUIZ_DATA = data;
    return true;
}

async function loadQuizContent() {
    const data = await loadQuizSetData();
    if (!data) return false;
    return renderQuizData(data);
}

Object.assign(window, {
    showAppError,
    getCurrentQuizSet,
    getCurrentQuizSetAssetBase,
    getQuizDataUrl,
    loadQuizSetData,
    renderQuizSetSelector,
    selectQuizSet,
    applyTheme,
    toggleTheme,
    loadTheme,
    normalizeQuizMediaUrls,
    renderQuizData,
    loadQuizContent,
});

export {
    showAppError,
    getCurrentQuizSet,
    getCurrentQuizSetAssetBase,
    getQuizDataUrl,
    loadQuizSetData,
    renderQuizSetSelector,
    selectQuizSet,
    applyTheme,
    toggleTheme,
    loadTheme,
    normalizeQuizMediaUrls,
    renderQuizData,
    loadQuizContent,
};
