# VBA Exam 1 - New Questions From Screenshots

Source folder: `/Users/simonpollak/Downloads/vba_exam1`

Note: Questions were extracted from screenshots with OCR and manually normalized for spelling, code formatting, and obvious OCR mistakes. Answers are based on the visible choices and course-topic correctness; where the screenshot/selection was ambiguous, a note is included.

---

## 1. Seřaďte do správného pořadí etapy vývoje software podle Microsoft SDLC.

Visible items in screenshot:

- analýza požadavků
- návrh koncepce

**Správne poradie:** neúplné ve screenshotu

Poznámka: screenshot zachycuje jen část řadicí úlohy.

## 2. Co je typický smysl „default deny" (deny by default)?

- a) přístup se řídí jen podle hesla
- b) pokud neexistuje explicitní zamítnutí, přístup je povolen
- c) pokud neexistuje explicitní povolení, přístup je zamítnut
- d) přístup je vždy povolen pro interní síť

**Správna odpoveď:** c

## 3. Parametr konfigurace `user.email` obsahuje:

- a) jméno nadřízeného
- b) jméno autora revize
- c) emailovou adresu autora revize
- d) přihlašovací jméno uživatele

**Správna odpoveď:** c

## 4. Jaký příkaz vytvoří novou větev v Gitu?

- a) `git newbranch`
- b) `git startbranch`
- c) `git createbranch`
- d) `git branch`

**Správna odpoveď:** d

## 5. Jaký je účel použití Canaries?

- a) Monitorování výkonu aplikace
- b) Zlepšení výkonu zásobníku
- c) Automatizace správy paměti
- d) Detekce pokusů o přetečení zásobníku

**Správna odpoveď:** d

## 6. Jaká jsou potenciální rizika spojená s funkcemi pro práci s řetězci v C?

- a) Možnost buffer overflow kvůli nedostatečné kontrole velikosti
- b) Optimalizace výkonu
- c) Snížení nároků na paměť
- d) Automatická správa paměti

**Správna odpoveď:** a

## 7. Ve Scrumu je role, která usměrňuje tým a pomáhá odstraňovat externí vlivy, nazývána:

- a) Team member (Developer)
- b) Scrum Master
- c) Product Owner
- d) Release manager

**Správna odpoveď:** b

## 8. Nastavení konfigurace, které má být platné pro všechny repozitáře všech uživatelů, se provádí příkazem:

- a) `git config --local`
- b) `git system --config`
- c) `git config --global`
- d) `git config --system`

**Správna odpoveď:** d

## 9. Co dělá příkaz `git clone`?

- a) Změní aktuální větev
- b) Vytváří novou větev
- c) Kopíruje repozitář z vzdáleného serveru na lokální stroj
- d) Odstraní soubory z repozitáře

**Správna odpoveď:** c

## 10. Proč je důležité ošetřovat chyby v programu?

- a) Automatické opravy chyb
- b) Zvýšení komplexnosti aplikace
- c) Prevence proti neočekávanému chování a zabezpečení aplikace
- d) Snížení počtu funkcí v kódu

**Správna odpoveď:** c

## 11. Jaká možná chyba je obsažena v následujícím kódu?

```c
char *buffer = malloc(32);
strcpy(buffer, "test");
free(buffer);
printf("%s\n", buffer);
```

- a) Integer overflow
- b) Memory leak
- c) Use after free
- d) Buffer overflow

**Správna odpoveď:** c

## 12. Které doplnění je nejbezpečnější pro zkopírování textu do pevného bufferu?

```c
void set_name(const char *input)
{
    char name[16];
    /* DOPLŇTE */
}
```

- a) `gets(name);`
- b) `sprintf(name, "%s", input);`
- c) `if (input != NULL) snprintf(name, sizeof(name), "%s", input);`
- d) `strcpy(name, input);`

**Správna odpoveď:** c

## 13. Které chyby jsou často přehlíženy během statické analýzy?

- a) Chyby spojené s definicí proměnných
- b) Chyby, které se projeví pouze za určitých provozních podmínek
- c) Chyby v syntaxi
- d) Typografické chyby v kódu

**Správna odpoveď:** b

## 14. Proč může být dynamická analýza časově náročnější než statická?

- a) Vyžaduje spouštění aplikace a často i simulaci různých provozních podmínek
- b) Je méně automatizovaná
- c) Vyžaduje manuální kontrolu každého řádku kódu
- d) Musí být prováděna vždy v noci

**Správna odpoveď:** a

## 15. Jaká možná chyba je obsažena v následujícím kódu?

```c
char *a = malloc(32);
char *b = a;
free(a);
free(b);
```

- a) Format string vulnerability
- b) Double free
- c) Memory leak
- d) Integer overflow

**Správna odpoveď:** b

## 16. Jaké doplnění nejlépe zabrání přetečení bufferu v následujícím kódu?

```c
void copy_name(const char *input)
{
    char name[16];
    /* DOPLŇTE */
    strcpy(name, input);
}
```

- a) `name[16] = "\0";`
- b) `if (input == NULL || strlen(input) >= sizeof(name)) return;`
- c) `strcpy(input, name);`
- d) `if (input == NULL) strcpy(name, "");`

**Správna odpoveď:** b

## 17. Proč je důležité analyzovat i méně nápadné části kódu při statické analýze?

- a) Protože to zvyšuje rychlost kódu
- b) Protože to zlepšuje vzhled aplikace
- c) Protože to zjednodušuje kód
- d) Abyste identifikovali skryté chyby

**Správna odpoveď:** d

## 18. Jaký příkaz v CUnit registruje testovací sadu?

- a) `CU_init_suite()`
- b) `CU_add_suite()`
- c) `CU_register_suite()`
- d) `CU_create_suite()`

**Správna odpoveď:** b

## 19. Položka `minimum` v souboru `/etc/shadow` označuje:

- a) minimální počet znaků v hesle
- b) den, kdy vyprší platnost hesla
- c) minimální počet dní platnosti hesla
- d) minimální počet znaků v soli

**Správna odpoveď:** c

## 20. O následujícím příkazu neplatí: `keyctl add user mysql mydata @u`

- a) přidá nová šifrovaná data `mydata`
- b) přidá položku do výchozí uživatelovy klíčenky
- c) přidaná položka bude dostupná jen z prostoru jádra
- d) přidá novou položku s názvem `mysql`

**Správna odpoveď:** c

Poznámka: screenshot je v této otázce hůře čitelný. Volba c je věcně nejjasnější nepravdivé tvrzení, protože `@u` je uživatelská klíčenka a `user` klíč je dostupný z uživatelského prostoru.

## 21. Počáteční nastavení `s` generátoru Blum Blum Shub musí splňovat:

- a) `s mod p = q`
- b) `s > p * q`
- c) `s` musí být prvočíslo
- d) `s < p * q - 1`

**Správna odpoveď:** d

## 22. Jak TPM přispívá k ochraně proti hardwarovým útokům?

- a) Používá antivirový software
- b) Generuje varovné signály
- c) Pomocí detekce neoprávněné manipulace s hardwarovými komponentami
- d) Nijak, TPM chrání pouze softwarové útoky

**Správna odpoveď:** c

## 23. Je možné monotónní počítadlo v TPM dekrementovat?

- a) Pokud je povoleno v nastavení
- b) Ano
- c) Pouze v některých modelech
- d) Ne

**Správna odpoveď:** d

## 24. Jak DM-verity ověřuje integritu souborového systému?

- a) Pomocí digitálních podpisů uživatelů
- b) Pomocí kontrolních součtů uložených na serveru
- c) Pomocí pravidelného skenování souborů
- d) Pomocí hash stromu, který začíná od kořenového hashe

**Správna odpoveď:** d

## 25. Co dělá funkce `EVP_EncryptInit()`?

- a) Inicializuje kontext pro šifrování
- b) Generuje klíče
- c) Dešifruje data
- d) Načítá certifikáty

**Správna odpoveď:** a

## 26. Položka `maximum` v souboru `/etc/shadow` označuje:

- a) maximální počet dní platnosti hesla
- b) maximální počet znaků v soli
- c) maximální počet znaků v hesle
- d) den, kdy vyprší platnost hesla

**Správna odpoveď:** a

## 27. Prvky (klíčenky nebo data) platné pouze v kontextu daného sezení jsou označovány:

- a) `@s`
- b) `@u`
- c) `@t`
- d) `@g`

**Správna odpoveď:** a

Poznámka: OCR zde spojilo písmena s ikonami radio tlačítek; významově jde o session keyring `@s`.

## 28. Které kryptografické protokoly TPM podporuje?

- a) AES, RSA, SHA
- b) UDP, TCP, IP
- c) None of the above
- d) FTP, HTTP, SMTP

**Správna odpoveď:** a

Poznámka: formulace ve screenshotu říká „protokoly“, ale uvedené správné možnosti jsou kryptografické algoritmy.

## 29. Jaký příkaz v TPM umožňuje čtení veřejných klíčů?

- a) `tpm2 decrypt`
- b) `tpm2 readpublic`
- c) `tpm2 authenticate`
- d) `tpm2 getrandom`

**Správna odpoveď:** b

## 30. Co znamená PK v kontextu UEFI Secure Boot?

- a) Platform key
- b) Protection key
- c) Public key
- d) Private key

**Správna odpoveď:** a

## 31. Jaký příkaz v OpenSSL slouží k zašifrování dat pomocí symetrického klíče?

- a) `EVP_EncryptUpdate(ctx, out, &outlen, in, inlen)`
- b) `OpenSSL_encrypt()`
- c) `EVP_SymmetricEncrypt()`
- d) `Cipher_encrypt_data()`

**Správna odpoveď:** a
