# Kontext pre generovanie otázok (statický kvíz)

Tento projekt je **jednostránkový kvíz** bez backendu: `vba_kviz_v3_1.html` + CSS + JS načítava **obsah otázok** z externých súborov.

## Čo má chatbot dodávať

1. **Fragment HTML** – súbor typu `quiz_sets/<id>.frag.html`  
   Štruktúra a pravidlá: pozri **`context/quiz_set.template.frag.html`** (kopíruj ako východzí bod).

2. **Vysvetlenia** – súbor `quiz_sets/<id>.explanations.js`  
   Formát: pozri **`context/quiz_set.template.explanations.js`**.

3. (Voliteľné) Pripomenúť používateľovi po úprave fragmentu spustiť z koreňa projektu:  
   `python3 embed_quiz_fragment.py --id <id>`  
   aby sa aktualizoval aj `quiz_sets/<id>.frag.embed.js` (potrebný pri otvorení HTML z disku bez servera).

## Kritické pravidlá markupu

| Prvok | Požiadavka |
|--------|------------|
| Sekcia | `<div class="section" id="sec_XXX">` – **unikátne** `id` (filtre, navigácia). Odporúčané aj `data-section` rovnakou hodnotou ako číslo/vlnovka v id. |
| Názov sekcie | `<div class="section-title">…</div>` – viditeľný text pre sidebar. |
| Otázka | `<div class="question" id="qS_N" …>` – **unikátne** id; `S` = číslo sekcie, `N` = poradie v sekcii. |
| MCQ | `data-answer="a"` (alebo b,c,…) = hodnota **`value`** správneho `<input type="radio">`. Atribút **`name`** na rádiách = **rovnaké ako id otázky**. |
| Možnosti MCQ | Text v `<span>` píšte bez prefixov `a)`, `b)`, `c)`… Písmeno odpovede patrí iba do `value` inputu a UI si značenie rieši samo. |
| Otvorená odpoveď | `data-answer="text"` + **`data-keywords="var1,var2,…"`** (čiarkou; vyhodnotenie: normalizovaná odpoveď musí **obsahovať** aspoň jednu variantu). |
| Textový vstup | `<input type="text" id="{questionId}-input" …>` – **povinne** suffix `-input` za id otázky. |
| Spätná väzba | `<div class="feedback" id="{questionId}-fb"></div>` na konci každej otázky. |

**`.question-label`** môže obsahovať HTML (napr. `<code>`). Pre prvé číslo v texte (napr. `1. …`) sa v strome navigácie skracuje náhľad.

## Vysvetlenia (EXPLANATIONS)

- Súbor musí nastaviť **`window.QUIZ_EXPLANATIONS`** (objekt).
- Kľúče musia **presne** sedieť s `id` otázok v fragmente (`q1_1`, `q2_8`, …).
- Používajú ich vyhodnotenie kvízu a flashcard režim.
- Hodnoty majú byť krátke vysvetlenia **prečo** je odpoveď správna, nie iba text typu `Správna odpoveď: ...`.

## Integrácia do projektu (pre človeka)

- `confg.js`: zaregistrujte set vo `window.QUIZ_SETS`, aby sa zobrazil v sidebari.
- `index.html`: skripty  
  `quiz_sets/<id>.frag.embed.js` a `quiz_sets/<id>.explanations.js` musia zodpovedať zvolenému setu.
- Po zmene `.frag.html` znova: **`python3 embed_quiz_fragment.py --id <id>`**.

## Referenčná implementácia

Kompletný reálny set: `quiz_sets/bpc-vba-2026/default.frag.html` + `quiz_sets/bpc-vba-2026/default.explanations.js`.

---

*Pri odovzdávaní úlohy chatbotovi môžete pripojiť tento súbor + obe šablóny z priečinka `context/` ako jeden balík kontextu.*
