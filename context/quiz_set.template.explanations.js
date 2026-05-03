/**
 * ŠABLÓNA: quiz_sets/<id>.explanations.js
 *
 * • Musí definovať window.QUIZ_EXPLANATIONS ako objekt.
 * • Kľúče = presne id otázok z .frag.html (napr. q1_1, q2_8).
 * • Hodnoty = krátke vysvetlenie, prečo je odpoveď správna; nie iba zopakovanie správnej odpovede.
 * • HTML nie je potrebné; text sa zobrazí po vyhodnotení a vo flashcard režime.
 * • Pre každú otázku s EXPLANATIONS v logike aplikácie stačí mať kľúč; chýbajúce kľúče sú ticho ignorované.
 */

window.QUIZ_EXPLANATIONS = {
    q1_1: "Pre MCQ: stručné zdôvodnenie, prečo je správna odpoveď správna; prípadne prečo hlavné distraktory neplatia.",
    q1_2: "Pre textovú otázku: aké varianty sú akceptované a čo skúšať pri písaní odpovede.",
    q2_1: "Ďalšia nápoveda / vysvetlenie.",
};
