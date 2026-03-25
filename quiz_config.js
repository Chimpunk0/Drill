/**
 * Konfigurácia aktívneho setu otázok.
 *
 * Spustenie bez servera: v HTML musí byť načítaný quiz_sets/<id>.frag.embed.js
 * (vygenerujte z .frag.html: python3 embed_quiz_fragment.py [--id …]).
 *
 * Pre výmenu setu:
 * 1. QUIZ_SET_ID zodpovedá súborom quiz_sets/<id>.*
 * 2. V HTML zmeňte skripty default.frag.embed.js a default.explanations.js na váš <id>.
 *
 * QUIZ_TRY_FETCH_FIRST = true: pri otvorení cez HTTP sa najprv stiahne .frag.html
 * (vhodné pri úpravách fragmentu bez okamžitej regenerácie embedu).
 */
window.QUIZ_SET_ID = window.QUIZ_SET_ID || "default";
window.QUIZ_SET_FRAGMENT_URL = window.QUIZ_SET_FRAGMENT_URL || null;
window.QUIZ_STORAGE_KEY = window.QUIZ_STORAGE_KEY || null;
window.QUIZ_TRY_FETCH_FIRST = window.QUIZ_TRY_FETCH_FIRST || false;
