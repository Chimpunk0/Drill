/**
 * ŠABLÓNA: quiz_sets/<id>.explanations.js
 *
 * • Musí definovať window.QUIZ_EXPLANATIONS ako objekt.
 * • Kľúče = presne id otázok z .frag.html (napr. q1_1, q2_8).
 * • Hodnoty = krátky text (HTML nie je potrebné); zobrazí sa po vyhodnotení a vo flashcard režime.
 * • Pre každú otázku s EXPLANATIONS v logike aplikácie stačí mať kľúč; chýbajúce kľúče sú ticho ignorované.
 */

window.QUIZ_EXPLANATIONS = {
    q1_1: "Pre MCQ: stručné zdôvodnenie správnej odpovede a prečo ostatné nie.",
    q1_2: "Pre textovú otázku: aké varianty sú akceptované a čo skúšať pri písaní odpovede.",
    q2_1: "Ďalšia nápoveda / vysvetlenie.",
};
