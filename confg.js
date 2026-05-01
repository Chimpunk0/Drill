/**
 * Konfigurácia aktívneho setu otázok.
 *
 * Spustenie bez servera: v HTML musí byť načítaný quiz_sets/<id>.frag.embed.js
 * (vygenerujte z .frag.html: python3 embed_quiz_fragment.py [--id …]).
 *
 * Pre výmenu setu:
 * 1. QUIZ_SET_ID zodpovedá súborom quiz_sets/<id>.*
 * 2. Set sa vyberá cez URL parameter ?set=<id> alebo cez UI v sidebari.
 *
 * QUIZ_TRY_FETCH_FIRST = true: pri otvorení cez HTTP sa najprv stiahne .frag.html
 * (vhodné pri úpravách fragmentu bez okamžitej regenerácie embedu).
 */

// Available quiz sets – add new entries here to expose them in the UI
window.QUIZ_SETS = window.QUIZ_SETS || [
    {
        id: "bpc-vba-2026/default",
        label: "BPC-VBA 2026",
        fragEmbed: "quiz_sets/bpc-vba-2026/default.frag.embed.js",
        explanations: "quiz_sets/bpc-vba-2026/default.explanations.js",
    },
    {
        id: "bpc-sos-2026/polsemestralka",
        label: "BPC-SOS 2026 – Polsemestralka",
        fragEmbed: "quiz_sets/bpc-sos-2026/polsemestralka.frag.embed.js",
        explanations:
            "quiz_sets/bpc-sos-2026/bpc-sos-2026-polsemestralka.explanations.js",
    },
    {
        id: "sos-skuska/sos-skuska",
        label: "SOS-SKUSKA (Skúška)",
        fragEmbed: "quiz_sets/sos-skuska/sos-skuska.frag.embed.js",
        explanations: "quiz_sets/sos-skuska/sos-skuska.explanations.js",
    },
];

// Read active set from URL param ?set=<id>, fall back to first registered set
(function () {
    const params = new URLSearchParams(window.location.search);
    const setParam = params.get("set");
    if (setParam) window.QUIZ_SET_ID = setParam;
})();

window.QUIZ_SET_ID =
    window.QUIZ_SET_ID ||
    (window.QUIZ_SETS[0] && window.QUIZ_SETS[0].id) ||
    "bpc-vba-2026/default";
window.QUIZ_SET_FRAGMENT_URL = window.QUIZ_SET_FRAGMENT_URL || null;
window.QUIZ_STORAGE_KEY = window.QUIZ_STORAGE_KEY || null;
window.QUIZ_TRY_FETCH_FIRST = window.QUIZ_TRY_FETCH_FIRST || false;
