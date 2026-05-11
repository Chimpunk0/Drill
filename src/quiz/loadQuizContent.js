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
            `Set "${id}" nie je zaregistrovaný v src/config/quizSets.js.`,
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

function getHtmlFragmentUrl() {
    if (window.QUIZ_SET_FRAGMENT_URL)
        return window.QUIZ_SET_FRAGMENT_URL;
    const id = window.QUIZ_SET_ID || "default";
    return `quiz_sets/${id}.frag.html`;
}

function getCurrentQuizSetAssetBase() {
    const id = window.QUIZ_SET_ID || "default";
    const slashIndex = id.lastIndexOf("/");
    if (slashIndex === -1) return "quiz_sets/";
    return `quiz_sets/${id.slice(0, slashIndex + 1)}`;
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

function applyQuizFragmentHtml(html) {
    const mount = document.getElementById("quiz-sections-mount");
    if (!mount) return;
    mount.innerHTML = html;
    normalizeQuizMediaUrls(mount);
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

Object.assign(window, {
    loadScript,
    showAppError,
    loadQuizSetScripts,
    renderQuizSetSelector,
    selectQuizSet,
    applyTheme,
    toggleTheme,
    loadTheme,
    getHtmlFragmentUrl,
    getCurrentQuizSetAssetBase,
    normalizeQuizMediaUrls,
    applyQuizFragmentHtml,
    loadQuizContent,
});

export {
    loadScript,
    showAppError,
    loadQuizSetScripts,
    renderQuizSetSelector,
    selectQuizSet,
    applyTheme,
    toggleTheme,
    loadTheme,
    getHtmlFragmentUrl,
    getCurrentQuizSetAssetBase,
    normalizeQuizMediaUrls,
    applyQuizFragmentHtml,
    loadQuizContent,
};
