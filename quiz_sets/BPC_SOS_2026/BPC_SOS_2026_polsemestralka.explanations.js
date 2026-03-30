/**
 * Vysvetlenia pre sadu BPC_SOS_2026_polsemestralka
 */

window.QUIZ_EXPLANATIONS = {
    // Sekcia 1
    q1_1: "Příkaz ./skript.sh spouští soubor v aktuálním pracovním adresáři.",
    q1_2: "Hodnota 2700 nastavuje setgid (2) pro dědění skupiny a plná práva pro vlastníka (7).",
    q1_3: "Znak >> znamená přidávání na konec souboru.",
    q1_4: "U adresářů příznak 'x' (executable) znamená právo vstoupit do něj (procházet ho).",
    q1_5: "664 = rw-rw-r-- (vlastník a skupina rw, ostatní r).",
    q1_6: "U symbolických odkazů (l) se práva uvedená ve výpisu obvykle ignorují, platí práva cíle.",
    q1_10: "Soubor /etc/shadow by měl být čitelný pouze pro root (400).",
    q1_15: "Telnet není šifrovaný, proto je bezpečný pouze v izolovaných privátních sítích.",
    q1_21: "Zahrnutí aktuálního adresáře do PATH je bezpečnostní riziko (možnost spuštění škodlivého kódu místo systémového příkazu).",
    q1_27: "Stínová hesla jsou uložena v /etc/shadow s právy pouze pro roota.",
    q1_31: "Tainting jádra často souvisí s vložením modulů s nekompatibilní nebo chybějící licencí (GPL).",
    q1_42: "Slovníkový útok porovnává hashe slov ze slovníku s hashem hesla v systému.",
    q1_45: "Pokud je heslo silné a náhodné, zbývá pouze útok hrubou silou (brute force).",

    // Sekcia 2
    q2_3: "Moduly jádra umožňují dynamicky načítat funkce (např. ovladače) jen když jsou potřeba.",
    q2_7: "Slovníkový útok využívá předem vypočítané hashe nebo je počítá za běhu ze seznamu slov.",
    q2_22: "Dynamické moduly nejsou nezbytné pro stabilní funkci (jádro může být monolitické), ale jsou praktické.",
    q2_35: "Aktuální adresář v PATH je nebezpečný (možnost podvržení binárky).",
    q2_52: "Principem slovníkového útoku je porovnávání otisků (hashů).",
};
