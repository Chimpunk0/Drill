/**
 * Konfigurácia aktívneho setu otázok.
 *
 * Quiz sety sa načítavajú ako štruktúrované JSON dáta. Súbor dataUrl má byť
 * statický asset v quiz_sets/ a vzniká z YAML/Markdown zdroja cez Python
 * import/generation nástroje.
 */

// Available quiz sets – add new entries here to expose them in the UI
window.QUIZ_SETS = window.QUIZ_SETS || [
  {
    id: "bpc-vba-2026/default",
    label: "BPC-VBA 2026",
    dataUrl: "quiz_sets/bpc-vba-2026/default.json",
  },
  {
    id: "bpc-sos-2026/polsemestralka",
    label: "BPC-SOS 2026 – Polsemestralka",
    dataUrl: "quiz_sets/bpc-sos-2026/polsemestralka.json",
  },
  {
    id: "sos-skuska/sos-skuska",
    label: "SOS-SKUSKA (Skúška)",
    dataUrl: "quiz_sets/sos-skuska/sos-skuska.json",
  },
  {
    id: "bpc-ic1-2026/skuska",
    label: "BPC-IC1 2026 – Skúška",
    dataUrl: "quiz_sets/bpc-ic1-2026/skuska.json",
  },
  {
    id: "bpc-vba/kodove-chytaky-quiz-large",
    label: "BPC-VBA cviko-skuska large",
    dataUrl: "quiz_sets/bpc-vba/kodove-chytaky-quiz-large.json",
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
window.QUIZ_STORAGE_KEY = window.QUIZ_STORAGE_KEY || null;
