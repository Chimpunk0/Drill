/**
 * Minimal bootstrap configuration.
 *
 * Runtime quiz-set registration comes from quiz_sets/index.json. The fallback
 * list below exists only so local development still has something to render if
 * the manifest is missing or malformed.
 */

window.QUIZ_MANIFEST_URL =
  window.QUIZ_MANIFEST_URL || "quiz_sets/index.json";

window.QUIZ_FALLBACK_SETS = window.QUIZ_FALLBACK_SETS || [
  {
    id: "bpc-vba-2026/default",
    label: "BPC-VBA 2026",
    dataUrl: "quiz_sets/bpc-vba-2026/default.json",
    source: {
      type: "github",
      owner: "Chimpunk0",
      repo: "drill_content",
      branch: "main",
      path: "quiz_sets/bpc-vba-2026/default.json",
    },
  },
  {
    id: "bpc-sos-2026/polsemestralka",
    label: "BPC-SOS 2026 – Polsemestralka",
    dataUrl: "quiz_sets/bpc-sos-2026/polsemestralka.json",
    source: {
      type: "github",
      owner: "Chimpunk0",
      repo: "drill_content",
      branch: "main",
      path: "quiz_sets/bpc-sos-2026/polsemestralka.json",
    },
  },
  {
    id: "sos-skuska/sos-skuska",
    label: "SOS-SKUSKA (Skúška)",
    dataUrl: "quiz_sets/sos-skuska/sos-skuska.json",
    source: {
      type: "github",
      owner: "Chimpunk0",
      repo: "drill_content",
      branch: "main",
      path: "quiz_sets/sos-skuska/sos-skuska.json",
    },
  },
  {
    id: "bpc-ic1-2026/skuska",
    label: "BPC-IC1 2026 – Skúška",
    dataUrl: "quiz_sets/bpc-ic1-2026/skuska.json",
    source: {
      type: "github",
      owner: "Chimpunk0",
      repo: "drill_content",
      branch: "main",
      path: "quiz_sets/bpc-ic1-2026/skuska.json",
    },
  },
  {
    id: "bpc-vba/kodove-chytaky-quiz-large",
    label: "BPC-VBA cviko-skuska large",
    dataUrl: "quiz_sets/bpc-vba/kodove-chytaky-quiz-large.json",
    source: {
      type: "github",
      owner: "Chimpunk0",
      repo: "drill_content",
      branch: "main",
      path: "quiz_sets/bpc-vba/kodove-chytaky-quiz-large.json",
    },
  },
];

window.QUIZ_SETS = window.QUIZ_SETS || window.QUIZ_FALLBACK_SETS;

// Read active set from URL param ?set=<id>. Manifest loading chooses the final
// fallback after it knows which sets exist.
(function () {
  const params = new URLSearchParams(window.location.search);
  const setParam = params.get("set");
  if (setParam) window.QUIZ_SET_ID = setParam;
})();

window.QUIZ_STORAGE_KEY = window.QUIZ_STORAGE_KEY || null;
