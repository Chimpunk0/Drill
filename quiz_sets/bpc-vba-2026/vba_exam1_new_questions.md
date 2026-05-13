# VBA Exam 1 - New Questions From Screenshots

Source folder: `/Users/simonpollak/Downloads/vba_exam1`

Note: answers below were checked from the parsed screenshots and corrected where the visible selection looked wrong.

---

## 1. U agilních technik programování je neměnný:

- a) rozsah
- b) termín dodání
- c) rozpočet
- d) rozpočet a termín dodání

**Správna odpoveď:** d

## 2. Threat modeling je proces, který:

- a) nahrazuje unit testy
- b) slouží pouze k vytvoření dokumentace pro audit
- c) řeší jen výkonové problémy
- d) identifikuje hrozby a navrhuje mitigace už při návrhu

**Správna odpoveď:** d

## 3. Seřaďte příkazy upravující konfiguraci repozitáře podle klesající priority:

- `git config --system user.name "system"`
- `git config --global user.name "global"`
- `git config --local user.name "local"`

**Správne poradie:** local, global, system

Poznámka: pri Gite má lokálna konfigurácia repozitára vyššiu prioritu než globálna konfigurácia používateľa a tá má vyššiu prioritu než systémová konfigurácia.

## 4. Co dělá příkaz `git clone`?

- a) Změní aktuální větev
- b) Vytváří novou větev
- c) Kopíruje repozitář z vzdáleného serveru na lokální stroj
- d) Odstraní soubory z repozitáře

**Správna odpoveď:** c

## 5. Co znamená Stack Smashing Protection (SSP)?

- a) Detekce přetečení zásobníku pomocí speciálních funkcí
- b) Komprese dat na zásobníku
- c) Ochrana proti přepsání dat na zásobníku
- d) Zvýšení velikosti zásobníku

**Správna odpoveď:** c

## 6. Jaké jsou důsledky chyby formátovacího řetězce?

- a) Zvýšení výkonu aplikace.
- b) Omezený přístup k paměti a ztráta dat.
- c) Zlepšení ochrany paměti a zvýšení bezpečnosti.
- d) Narušení integrity a dostupnosti aplikace.

**Správna odpoveď:** d

## 7. Místo funkce `strcpy` je vhodné používat bezpečnou funkci s názvem:

**Správna odpoveď:** `strlcpy`

## 8. Jaká možná chyba je obsažena v následujícím kódu?

```c
char *get_text(void)
{
    char text[16] = "hello";
    return text;
}
```

- a) Vrácení ukazatele na lokální proměnnou
- b) Format string vulnerability
- c) Double free
- d) Integer overflow

**Správna odpoveď:** a

## 9. Jaké doplnění je správné, aby bylo možné paměť bezpečně uvolnit pomocí `free`?

```c
void process(void)
{
    /* DOPLŇTE */

    strcpy(data, "abc");
    free(data);
}
```

- a) `char *data = malloc(32); if (data == NULL) return;`
- b) `char *data;`
- c) `char data[32];`
- d) `char *data = "abc";`

**Správna odpoveď:** a

## 10. Jaký typ chyb může statická analýza efektivně identifikovat?

- a) Chyby síťové komunikace
- b) Sémantické chyby, jako jsou neinicializované proměnné a nedosažitelný kód
- c) Výkonové problémy za běhu
- d) Chyby způsobené uživatelským vstupem

**Správna odpoveď:** b

## 11. Jaká je jedna z hlavních výhod dynamické analýzy?

- a) Rychlejší než statická analýza
- b) Schopnost pracovat bez přístupu k zdrojovému kódu
- c) Nenáročnost na systémové zdroje
- d) Schopnost odhalit chyby, které nejsou zřejmé bez spuštění kódu

**Správna odpoveď:** d

## 12. Jaký je hlavní účel použití CUnit?

- a) Automatizace testování jednotkových testů v C
- b) Kompilace programů v C
- c) Správa databázových spojení v C
- d) Vývoj uživatelských rozhraní v C

**Správna odpoveď:** a

## 13. Jak se v CUnit testuje, že řetězec odpovídá očekávané hodnotě?

- a) Pomocí `CU_ASSERT_EQUAL_STR()`
- b) Pomocí `CU_ASSERT_TEXT_MATCH()`
- c) Pomocí `CU_ASSERT_STRING_EQUAL()`
- d) Pomocí `CU_ASSERT_SAME_TEXT()`

**Správna odpoveď:** c

## 14. Jaká jsou bezpečnostní doporučení pro ukládání hesel v systému Windows?

- a) Používat stejné heslo pro více účtů
- b) Ukládat hesla v nezašifrované formě
- c) Zapisovat hesla na papír
- d) Používat silná hesla a využívat šifrování

**Správna odpoveď:** d

## 15. Prvky (klíčenky nebo data) platné pouze v kontextu daného sezení jsou označovány:

- a) `@u`
- b) `@s`
- c) `@t`
- d) `@g`

**Správna odpoveď:** b

## 16. Počáteční nastavení `s` generátoru Blum Blum Shub musí splňovat:

- a) `s` musí být prvočíslo
- b) `s > p * q`
- c) `s < p * q - 1`
- d) `s mod p = q`

**Správna odpoveď:** c

## 17. Co znamená PCR v kontextu TPM?

- a) Permanent Control Repository
- b) Platform Configuration Register
- c) Personal Crypto Resource
- d) Protected Code Region

**Správna odpoveď:** b

## 18. Jaký je hlavní účel AIK klíčů v TPM?

- a) Šifrování dat
- b) Autentizace
- c) Dekomprese dat
- d) Generování náhodných čísel

**Správna odpoveď:** b

Poznámka: AIK znamená Attestation Identity Key. Jeho účel je preukazovanie identity/autentizácia TPM pri atestácii, nie bežné šifrovanie dát.

## 19. Jak DM-verity ověřuje integritu souborového systému?

- a) Pomocí hash stromu, který začíná od kořenového hashe
- b) Pomocí kontrolních součtů uložených na serveru
- c) Pomocí digitálních podpisů uživatelů
- d) Pomocí pravidelného skenování souborů

**Správna odpoveď:** a

## 20. Co dělá funkce `EVP_DigestFinal()`?

- a) Aktualizuje hashovací kontext
- b) Ukončuje proces hashování a vrací výsledný hash
- c) Generuje klíče
- d) Inicializuje hashovací proces

**Správna odpoveď:** b
