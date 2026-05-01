/**
 * Vysvetlenia pre sadu SOS-SKUSKA (Operačné systémy - skúška)
 */

window.QUIZ_EXPLANATIONS = {
    // Sekcia 1: TCP/IP
    q1_1: "Porty 0-1023 jsou privilegované (well-known) a rezervované pro standardní služby na straně serveru.",
    q1_2: "Veřejný klíč se používá pro šifrování, soukromý (tajný) pro dešifrování. Pouze držitel soukromého klíče může dešifrovat.",
    q1_3: "SSH podporuje autentizaci pomocí páru klíčů (veřejný + soukromý), což umožňuje přihlášení bez hesla.",
    q1_5: "TCP three-way handshake: SYN → SYN-ACK → ACK. Takto se sestavují dvě jednosměrná spojení.",
    q1_6: "FIN ukončuje jednosměrné spojení. Druhá strana může stále posílat data, dokud také nepošle FIN.",
    q1_7: "FTP active mode: klient otevře port pro příkazy (21), server otevře datové spojení zpět na port zvolený klientem.",
    q1_8: "Na transportní vrstvě TCP používá segmenty, UDP používá datagramy.",
    q1_11: "Privilegované porty 0-1023 vyžadují administrátorská práva pro bind().",
    q1_13: "SYN (synchronize) zahajuje spojení, ACK (acknowledge) potvrzuje přijetí.",

    // Sekcia 2: OSI
    q2_1: "Síťová vrstva (3) zajišťuje směrování paketů mezi sítěmi.",
    q2_2: "Správné pořadí OSI: Fyzická, Linková, Síťová, Transportní, Relační, Prezentační, Aplikační.",
    q2_3: "Směrovač potřebuje fyzickou, linkovou a síťovou vrstvu pro přenos paketů mezi sítěmi.",
    q2_4: "Rámec (frame) je jednotka linkové/spojové vrstvy (2).",
    q2_8: "Paket je jednotka síťové vrstvy (3).",

    // Sekcia 3: Procesy
    q3_1: "Proces ve stavu swapped musí být probuzen, načten do paměti a pak může být naplánován.",
    q3_2: "Parametr nice umožňuje uživateli ovlivnit prioritu procesu. Nižší nice = vyšší priorita.",
    q3_3: "PID je přiděleno při fork(), je unikátní pro běžící proces.",
    q3_6: "Nový proces může být připraven v paměti (pokud je místo) nebo odložen (swapped).",
    q3_7: "Real-time systémy vyžadují dodržení termínů (deadlines).",
    q3_14: "Zombie proces skončil (exit()), ale rodič ještě nezavolal wait() pro získání návratové hodnoty.",
    q3_19: "Sdílená paměť je nejrychlejší IPC, protože nevyžaduje kopírování dat přes jádro.",

    // Sekcia 4: Synchronizácia
    q4_2: "Vzájemné vyloučení zajišťuje, že pouze jeden proces může být v kritické sekci.",
    q4_3: "Sdílená proměnná nemusí být atomická - může dojít k race condition.",
    q4_5: "Kritická sekce je část kódu s přístupem ke sdíleným prostředkům.",
    q4_6: "Race condition nastává, když výsledek závisí na pořadí vykonávání procesů.",
    q4_8: "Pasivní čekání (spánek) je efektivnější než aktivní (busy-waiting).",

    // Sekcia 5: Pamäť
    q5_1: "Segmentace rozděluje paměť logicky (kód, data, stack), stránkování na stejné části.",
    q5_2: "Stránkování používá stejně velké stránky a rámce (obvykle 4KB).",
    q5_4: "Heap slouží pro dynamickou alokaci (malloc), stack pro lokální proměnné.",
    q5_5: "Textový segment obsahuje strojový kód programu (read-only).",
    q5_7: "PCB (Process Control Block) je v jádře, ne v uživatelském kontextu.",
    q5_8: "Interní fragmentace = nevyužité místo v poslední stránce alokovaného bloku.",
    q5_10: "32bit adresy = 2^32 = 4 GiB adresového prostoru.",
    q5_12: "Page fault nastane, když přistupujeme na stránku, která je ve swapu, ne v RAM.",
    q5_14: "Více RAM = méně potřeby swapovat = méně page faultů.",
    q5_18: "Velikost stránek je dána architekturou OS, nikoli jednotlivými procesy.",
    q5_20: "Stránkování nezaručuje souvislé umístění - stránky mohou být různě fyzicky.",

    // Sekcia 6: Súborový systém
    q6_1: "Soubory jsou uloženy v blocích, které mohou být rozptýleny (fragmentace).",
    q6_3: "/etc obsahuje konfigurační soubory v UNIX-like systémech.",
    q6_5: "/var obsahuje proměnlivá data (logy, databáze, mail).",
    q6_7: "/bin = spustitelné, /etc = konfigurace, /dev = zařízení, /var = proměnlivá data.",
    q6_8: "/sbin obsahuje systémové nástroje pro správu.",
    q6_10: "Speciální soubory fungují i pro bloková zařízení (např. /dev/sda).",

    // Sekcia 7: Jadro
    q7_2: "Moduly jádra obsahují ovladače zařízení a souborových systémů.",
    q7_4: "Jádro je stále aktivní, obsluhuje přerušení a systémová volání.",
    q7_6: "Mikrojádro obsahuje pouze minimum: správa paměti, multitasking, IPC.",
    q7_9: "Režim jádra má plný přístup k hardware, uživatelský režim je izolovaný.",
    q7_10: "Systémová volání přepínají CPU do režimu jádra.",
    q7_13: "Systémové programy poskytují prostředí pro aplikace (shell, knihovny).",
    q7_15: "V UNIX nižší číslo priority = vyšší priorita. Jádro má záporné hodnoty.",
};
