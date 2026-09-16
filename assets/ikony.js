/* ==========================================================================
   Biblioteka grafik — rysunki kreską w jednym stylu.

   Każdy wpis niesie samą ZAWARTOŚĆ <svg>; ramkę (viewBox, grubość kreski,
   zaokrąglone końce) dokłada ten, kto rysuje. Dzięki temu grubość i kolor
   da się zmieniać w jednym miejscu, a nie w pięćdziesięciu plikach.

   Układ współrzędnych: kwadrat 120 × 120, treść mieści się w 12–108,
   więc grafiki są tej samej wielkości optycznej i można je podmieniać
   bez poprawiania układu.
   ========================================================================== */

window.KX_IKONY = {
  ramka: { viewBox: "0 0 120 120", fill: "none", stroke: "currentColor",
           "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" },

  grupy: {
    ludzie: "Ludzie i relacje",
    umysl: "Umysł i emocje",
    proces: "Proces i kierunek",
    natura: "Natura i metafory",
    oparcie: "Oparcie i bezpieczeństwo",
    rzeczy: "Przedmioty i kontakt",
  },

  lista: [
    /* ---------------- ludzie i relacje ---------------- */
    { id: "osoby-trzy", nazwa: "Trzy sylwetki", grupa: "ludzie", svg:
      '<circle cx="26" cy="46" r="11"/><path d="M10 90C10 72 17 62 26 62s16 10 16 28"/>' +
      '<circle cx="60" cy="38" r="13"/><path d="M42 90C42 68 50 56 60 56s18 12 18 34"/>' +
      '<circle cx="94" cy="50" r="10"/><path d="M80 90C80 74 86 66 94 66s14 8 14 24"/>' },

    { id: "para-glowy", nazwa: "Dwie głowy", grupa: "ludzie", svg:
      '<g transform="translate(-4,2) scale(.75)"><path d="M34 100c-8-18-10-50 10-66s46-6 49 16c1 6 5 7 5 9s-6 3-8 4c0 6-2 10-7 12-3 1-3 4-3 8v17"/></g>' +
      '<g transform="translate(34,12) scale(.75)"><path d="M34 100c-8-18-10-50 10-66s46-6 49 16c1 6 5 7 5 9s-6 3-8 4c0 6-2 10-7 12-3 1-3 4-3 8v17" fill="var(--karta,#fff)"/></g>' },

    { id: "sylwetka", nazwa: "Jedna osoba", grupa: "ludzie", svg:
      '<circle cx="60" cy="38" r="15"/><path d="M26 98c0-24 15-38 34-38s34 14 34 38"/>' },

    { id: "rodzina", nazwa: "Rodzina", grupa: "ludzie", svg:
      '<circle cx="30" cy="40" r="11"/><path d="M14 92c0-20 7-30 16-30s16 10 16 30"/>' +
      '<circle cx="90" cy="40" r="11"/><path d="M74 92c0-20 7-30 16-30s16 10 16 30"/>' +
      '<circle cx="60" cy="64" r="8"/><path d="M48 92c0-13 5-19 12-19s12 6 12 19"/>' },

    { id: "krag-osob", nazwa: "Krąg osób", grupa: "ludzie", svg:
      '<circle cx="60" cy="60" r="34" stroke-dasharray="4 7"/>' +
      '<circle cx="60" cy="26" r="7"/><circle cx="89" cy="43" r="7"/><circle cx="89" cy="77" r="7"/>' +
      '<circle cx="60" cy="94" r="7"/><circle cx="31" cy="77" r="7"/><circle cx="31" cy="43" r="7"/>' },

    { id: "dlonie-wsparcie", nazwa: "Trzymane w dłoniach", grupa: "ludzie", svg:
      '<circle cx="60" cy="46" r="15"/><path d="M16 94c0-24 14-40 26-42"/><path d="M104 94c0-24-14-40-26-42"/>' },

    { id: "serce", nazwa: "Serce", grupa: "ludzie", svg:
      '<path d="M60 98C36 79 20 64 20 46c0-12 9-21 20-21 8 0 15 4 20 11 5-7 12-11 20-11 11 0 20 9 20 21 0 18-16 33-40 52z"/>' },

    { id: "serce-w-dloniach", nazwa: "Serce w dłoniach", grupa: "ludzie", svg:
      '<path d="M60 58C47 47 38 40 38 30c0-6 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 6 11 12 0 10-9 17-22 28z"/>' +
      '<path d="M14 66c0 23 21 40 46 40s46-17 46-40"/><path d="M14 66c-4 0-6 3-6 7M106 66c4 0 6 3 6 7"/>' },

    /* ---------------- umysł i emocje ---------------- */
    { id: "glowa-platanina", nazwa: "Głowa z plątaniną", grupa: "umysl", svg:
      '<path d="M34 100c-8-18-10-50 10-66s46-6 49 16c1 6 5 7 5 9s-6 3-8 4c0 6-2 10-7 12-3 1-3 4-3 8v17"/>' +
      '<path d="M44 68c-7-11 7-21 16-13 7 6 1 17-8 13-7-3-4-13 6-11"/>' },

    { id: "glowa-pusta", nazwa: "Głowa — profil", grupa: "umysl", svg:
      '<path d="M34 100c-8-18-10-50 10-66s46-6 49 16c1 6 5 7 5 9s-6 3-8 4c0 6-2 10-7 12-3 1-3 4-3 8v17"/>' },

    { id: "mozg", nazwa: "Mózg", grupa: "umysl", svg:
      '<path d="M60 20c-6-4-16-3-20 4-8-1-15 5-15 13-6 3-9 11-5 17-4 7 0 16 8 18 2 8 11 12 18 8 4 5 12 6 14 2"/>' +
      '<path d="M60 20c6-4 16-3 20 4 8-1 15 5 15 13 6 3 9 11 5 17 4 7 0 16-8 18-2 8-11 12-18 8-4 5-12 6-14 2"/>' +
      '<path d="M60 20v62"/><path d="M40 40c6 2 10 6 12 12M80 40c-6 2-10 6-12 12M44 66c5 0 9 3 10 8M76 66c-5 0-9 3-10 8"/>' },

    { id: "zarowka", nazwa: "Żarówka — wgląd", grupa: "umysl", svg:
      '<path d="M60 20c-16 0-28 12-28 27 0 10 6 17 10 22 3 4 4 7 4 11h28c0-4 1-7 4-11 4-5 10-12 10-22 0-15-12-27-28-27z"/>' +
      '<path d="M48 92h24M52 100h16"/>' },

    { id: "chmura-mysli", nazwa: "Chmura myśli", grupa: "umysl", svg:
      '<path d="M42 72c-11 0-20-8-20-18s9-18 20-18c2-10 12-17 22-17 13 0 23 9 24 20 8 1 14 8 14 16 0 9-7 17-17 17H42z"/>' +
      '<circle cx="36" cy="88" r="5"/><circle cx="25" cy="100" r="3.5"/>' },

    { id: "dymek", nazwa: "Dymek rozmowy", grupa: "umysl", svg:
      '<rect x="14" y="26" width="92" height="52" rx="10"/><path d="M40 78v22l22-22"/>' },

    { id: "dwa-dymki", nazwa: "Dialog", grupa: "umysl", svg:
      '<rect x="12" y="18" width="64" height="40" rx="9"/><path d="M28 58v16l18-16"/>' +
      '<rect x="50" y="54" width="58" height="38" rx="9" fill="var(--karta,#fff)"/><path d="M92 92v14l-16-14"/>' },

    { id: "oko", nazwa: "Oko — uważność", grupa: "umysl", svg:
      '<path d="M12 60s20-26 48-26 48 26 48 26-20 26-48 26-48-26-48-26z"/><circle cx="60" cy="60" r="13"/>' },

    { id: "ucho", nazwa: "Słuchanie", grupa: "umysl", svg:
      '<g transform="translate(14,0)"><path d="M34 100c-8-18-10-50 10-66s46-6 49 16c1 6 5 7 5 9s-6 3-8 4c0 6-2 10-7 12-3 1-3 4-3 8v17"/></g>' +
      '<path d="M22 46a16 16 0 0 0 0 28M12 36a30 30 0 0 0 0 48"/>' },

    { id: "oddech", nazwa: "Oddech", grupa: "umysl", svg:
      '<circle cx="60" cy="60" r="10"/><circle cx="60" cy="60" r="24" stroke-dasharray="4 7"/>' +
      '<circle cx="60" cy="60" r="40" stroke-dasharray="4 9"/>' },

    { id: "medytacja", nazwa: "Medytacja", grupa: "umysl", svg:
      '<circle cx="60" cy="24" r="13"/><path d="M36 90c0-24 11-42 24-42s24 18 24 42"/>' +
      '<path d="M26 90h68"/><path d="M38 72c-9 2-14 9-14 18M82 72c9 2 14 9 14 18"/>' },

    { id: "fala", nazwa: "Fale — emocje", grupa: "umysl", svg:
      '<path d="M8 48q13-18 26 0t26 0 26 0 26 0"/><path d="M8 76q13-18 26 0t26 0 26 0 26 0"/>' },

    /* ---------------- proces i kierunek ---------------- */
    { id: "sciezka-wezly", nazwa: "Ścieżka z etapami", grupa: "proces", svg:
      '<path d="M18 88c0-18 16-22 30-18s28 0 32-14c4-14-6-24-18-20"/>' +
      '<circle cx="18" cy="88" r="4.5"/><circle cx="48" cy="70" r="4.5"/><circle cx="80" cy="56" r="4.5"/>' +
      '<path d="M62 36V20"/><path d="M62 21l17 5-17 6"/>' },

    { id: "strzalka-petla", nazwa: "Strzałka z pętlą", grupa: "proces", svg:
      '<path d="M16 76C22 46 46 40 56 58c8 14-8 26-14 14-7-14 14-28 36-22 12 3 18 8 24 14"/>' +
      '<path d="M102 64 89 62M102 64l-8 11"/>' },

    { id: "drabina", nazwa: "Drabina", grupa: "proces", svg:
      '<path d="M34 14v92M86 14v92M34 36h52M34 58h52M34 80h52"/>' },

    { id: "schody", nazwa: "Schody w górę", grupa: "proces", svg:
      '<path d="M12 102h24V80h24V58h24V36h24"/>' },

    { id: "wykres", nazwa: "Wykres rosnący", grupa: "proces", svg:
      '<path d="M18 16v86h86"/><path d="M34 82l20-22 16 14 26-34"/><path d="M96 40H82M96 40v14"/>' },

    { id: "kompas", nazwa: "Kompas", grupa: "proces", svg:
      '<circle cx="60" cy="60" r="42"/><path d="M78 42 68 68l-26 10 10-26z"/>' },

    { id: "cel-tarcza", nazwa: "Cel", grupa: "proces", svg:
      '<circle cx="60" cy="60" r="42"/><circle cx="60" cy="60" r="26"/><circle cx="60" cy="60" r="10"/>' },

    { id: "klepsydra", nazwa: "Klepsydra", grupa: "proces", svg:
      '<path d="M30 16h60M30 104h60"/>' +
      '<path d="M38 16v14c0 10 22 20 22 30s-22 20-22 30v14M82 16v14c0 10-22 20-22 30s22 20 22 30v14"/>' },

    { id: "zegar", nazwa: "Zegar", grupa: "proces", svg:
      '<circle cx="60" cy="60" r="42"/><path d="M60 34v28l18 12"/>' },

    { id: "kalendarz", nazwa: "Kalendarz", grupa: "proces", svg:
      '<rect x="16" y="26" width="88" height="78" rx="8"/><path d="M16 48h88M38 16v20M82 16v20"/>' +
      '<circle cx="42" cy="70" r="4"/><circle cx="60" cy="70" r="4"/><circle cx="78" cy="70" r="4"/>' },

    { id: "puzzle", nazwa: "Puzzle", grupa: "proces", svg:
      '<path d="M18 18h30v8a8 8 0 0 0 16 0v-8h30v30h-8a8 8 0 0 0 0 16h8v30H64v-8a8 8 0 0 0-16 0v8H18V64h8a8 8 0 0 0 0-16h-8z"/>' },

    { id: "wezel", nazwa: "Supeł", grupa: "proces", svg:
      '<path d="M32 44c0-14 12-24 28-24s28 10 28 24-11 22-22 22c-9 0-15-6-15-13s5-11 10-11"/>' +
      '<path d="M32 44c0 12 8 20 17 24M88 44c0 12-8 20-17 24"/><path d="M49 68v34M71 68v34"/>' },

    { id: "klebek", nazwa: "Kłębek nici", grupa: "proces", svg:
      '<circle cx="54" cy="54" r="32"/>' +
      '<ellipse cx="54" cy="54" rx="13" ry="32" transform="rotate(30 54 54)"/>' +
      '<ellipse cx="54" cy="54" rx="13" ry="32" transform="rotate(-30 54 54)"/>' +
      '<path d="M80 76c8 6 14 14 16 26"/>' },

    { id: "waga", nazwa: "Waga — równowaga", grupa: "proces", svg:
      '<path d="M60 22v74M38 96h44"/><path d="M20 38h80"/>' +
      '<path d="M20 38 8 66a14 14 0 0 0 24 0zM100 38l12 28a14 14 0 0 1-24 0z"/>' },

    /* ---------------- natura i metafory ---------------- */
    { id: "drzewo", nazwa: "Drzewo", grupa: "natura", svg:
      '<path d="M60 104V56"/><path d="M60 72 42 58M60 86l18-14"/>' +
      '<path d="M38 56c-10 0-18-8-18-18s8-18 18-18c2-9 10-16 22-16s20 7 22 16c10 0 18 8 18 18s-8 18-18 18H38z"/>' },

    { id: "korzenie", nazwa: "Korzenie", grupa: "natura", svg:
      '<path d="M20 60h80"/><path d="M60 60V24"/>' +
      '<path d="M60 42c-13 0-20-7-20-18 11 0 20 7 20 18zM60 36c11 0 18-7 18-16-10 0-18 7-18 16z"/>' +
      '<path d="M60 60v16M60 76c0 10-8 14-14 20-4 4-6 8-6 12M60 76c0 10 8 14 14 20 4 4 6 8 6 12"/>' },

    { id: "lisc", nazwa: "Liść", grupa: "natura", svg:
      '<path d="M98 22C56 22 26 46 26 76c0 9 3 16 7 22 28 0 65-22 65-56V22z"/><path d="M98 22 36 98"/>' },

    { id: "kielek", nazwa: "Kiełek", grupa: "natura", svg:
      '<path d="M60 104V56"/>' +
      '<path d="M60 72c-16 0-26-10-26-24 14 0 26 10 26 24zM60 60c14 0 24-10 24-22-12 0-24 8-24 22z"/>' +
      '<path d="M36 104h48"/>' },

    { id: "gora", nazwa: "Góra", grupa: "natura", svg:
      '<path d="M10 96l30-52 16 28 14-22 40 46z"/><path d="M32 66l8 8 8-8"/>' },

    { id: "wzgorza", nazwa: "Droga przez wzgórza", grupa: "natura", svg:
      '<path d="M8 88c14 0 18-30 34-30s18 20 30 20 16-26 40-26"/><path d="M8 102h104"/>' },

    { id: "kregi-na-wodzie", nazwa: "Kręgi na wodzie", grupa: "natura", svg:
      '<ellipse cx="60" cy="66" rx="12" ry="5"/><ellipse cx="60" cy="66" rx="26" ry="11"/>' +
      '<ellipse cx="60" cy="66" rx="40" ry="17"/><path d="M60 50V22"/><circle cx="60" cy="18" r="5"/>' },

    { id: "slonce", nazwa: "Słońce", grupa: "natura", svg:
      '<circle cx="60" cy="60" r="22"/>' +
      '<path d="M60 14v14M60 92v14M14 60h14M92 60h14M27 27l10 10M83 83l10 10M93 27 83 37M37 83l-10 10"/>' },

    { id: "ksiezyc", nazwa: "Księżyc i gwiazdy", grupa: "natura", svg:
      '<path d="M84 22a40 40 0 1 0 14 56 34 34 0 0 1-14-56z"/>' +
      '<path d="M28 24l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM24 58l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' },

    { id: "swieca", nazwa: "Świeca", grupa: "natura", svg:
      '<rect x="46" y="50" width="28" height="54" rx="4"/><path d="M60 50V38"/>' +
      '<path d="M60 38c-7-4-9-13-4-19 2 6 8 4 10 0 4 7 2 15-6 19z"/>' },

    /* ---------------- oparcie i bezpieczeństwo ---------------- */
    { id: "kotwica", nazwa: "Kotwica", grupa: "oparcie", svg:
      '<circle cx="60" cy="24" r="10"/><path d="M60 34v68M36 50h48"/>' +
      '<path d="M22 66c0 20 17 36 38 36s38-16 38-36"/>' },

    { id: "latarnia", nazwa: "Latarnia morska", grupa: "oparcie", svg:
      '<path d="M44 46h32l8 58H36z"/><path d="M48 26h24v20H48z"/><path d="M40 64h40"/>' +
      '<path d="M38 34 20 26M82 34l18-8"/>' },

    { id: "most", nazwa: "Most", grupa: "oparcie", svg:
      '<path d="M8 84h104"/><path d="M20 84c0-22 18-38 40-38s40 16 40 38"/>' +
      '<path d="M36 84V56M60 84V46M84 84V56"/><path d="M20 84v18M100 84v18"/>' },

    { id: "drzwi", nazwa: "Otwarte drzwi", grupa: "oparcie", svg:
      '<rect x="30" y="14" width="60" height="90" rx="4"/><circle cx="76" cy="60" r="4"/><path d="M18 104h84"/>' },

    { id: "klucz", nazwa: "Klucz", grupa: "oparcie", svg:
      '<circle cx="38" cy="48" r="20"/><path d="M52 62l46 46"/><path d="M78 88l12-12M88 98l12-12"/>' },

    { id: "klodka", nazwa: "Otwarta kłódka", grupa: "oparcie", svg:
      '<rect x="26" y="54" width="68" height="50" rx="8"/>' +
      '<path d="M42 54V38c0-12 9-20 20-20 10 0 18 6 20 15"/><circle cx="60" cy="74" r="6"/><path d="M60 80v10"/>' },

    { id: "tarcza", nazwa: "Tarcza", grupa: "oparcie", svg:
      '<path d="M60 12 20 28v30c0 27 17 44 40 52 23-8 40-25 40-52V28z"/><path d="M44 60l12 12 22-24"/>' },

    { id: "parasol", nazwa: "Parasol", grupa: "oparcie", svg:
      '<path d="M12 58c0-26 21-46 48-46s48 20 48 46c-8-6-14-6-24 0-8-6-16-6-24 0-8-6-16-6-24 0-10-6-16-6-24 0z"/>' +
      '<path d="M60 58v38c0 8-6 12-12 12s-12-5-12-12"/>' },

    { id: "dom", nazwa: "Dom", grupa: "oparcie", svg:
      '<path d="M16 58 60 20l44 38"/><path d="M30 50v54h60V50"/><path d="M50 104V74h20v30"/>' },

    { id: "okno", nazwa: "Okno", grupa: "oparcie", svg:
      '<rect x="24" y="18" width="72" height="84" rx="4"/><path d="M60 18v84M24 60h72"/>' },

    /* ---------------- przedmioty i kontakt ---------------- */
    { id: "notatnik", nazwa: "Notatnik", grupa: "rzeczy", svg:
      '<rect x="26" y="20" width="68" height="84" rx="6"/><path d="M26 42h68"/>' +
      '<path d="M42 60h36M42 76h24"/><path d="M42 14v14M78 14v14"/>' },

    { id: "ksiazka", nazwa: "Książka", grupa: "rzeczy", svg:
      '<path d="M18 26c14-6 28-6 42 4 14-10 28-10 42-4v66c-14-6-28-6-42 4-14-10-28-10-42-4z"/><path d="M60 30v70"/>' },

    { id: "koperta", nazwa: "Koperta", grupa: "rzeczy", svg:
      '<rect x="14" y="30" width="92" height="60" rx="6"/><path d="M14 36l46 32 46-32"/>' },

    { id: "telefon", nazwa: "Telefon", grupa: "rzeczy", svg:
      '<rect x="36" y="12" width="48" height="96" rx="8"/><path d="M52 24h16"/><circle cx="60" cy="96" r="4"/>' },

    { id: "laptop", nazwa: "Spotkanie online", grupa: "rzeczy", svg:
      '<rect x="26" y="26" width="68" height="46" rx="4"/><path d="M14 86h92l-10-14H24z"/>' },

    { id: "lustro", nazwa: "Lustro", grupa: "rzeczy", svg:
      '<ellipse cx="60" cy="46" rx="30" ry="36"/><path d="M60 82v20M44 102h32"/><path d="M46 32c2-8 8-12 14-12"/>' },
  ],
};
