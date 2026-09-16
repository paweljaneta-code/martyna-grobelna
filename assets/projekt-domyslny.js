/* Punkt wyjścia redaktora — ta sama treść, co w pierwszej wersji strony.
   Redaktor kopiuje ten obiekt przy pierwszym uruchomieniu i od tej pory
   pracuje na kopii w przeglądarce. Plik zostaje nietknięty, więc
   „Zacznij od nowa" zawsze ma dokąd wrócić. */

window.KX_PROJEKT_DOMYSLNY = {
  wersja: 1,

  meta: {
    tytul: "Martyna Grobelna — psychoterapia",
    opis: "Gabinet psychoterapii. Terapia indywidualna i terapia par — stacjonarnie i online.",
  },

  motyw: {
    krojNaglowki: "Poppins",
    zapasowyNaglowki: "system-ui, sans-serif",
    krojProza: "EB Garamond",
    zapasowyProza: "Georgia, serif",
    skala: 1,
    interlinia: 1.7,
    zaokraglenie: 2,
    szerokosc: 1120,
    kolory: {
      tlo: "#efeeec",
      pasKontakt: "#e6e4e0",
      karta: "#ffffff",
      tekst: "#14130f",
      miekki: "#56534c",
      kreska: "#dcd9d3",
      akcent: "#ece5d4",
    },
  },

  sekcje: [
    { id: "s-pasek", typ: "pasek", widoczna: true, pozycje: [
      { tekst: "o mnie", cel: "#o-mnie" },
      { tekst: "jak pracuję", cel: "#jak-pracuje" },
      { tekst: "formy spotkań", cel: "#formy-spotkan" },
      { tekst: "kontakt", cel: "#kontakt" },
    ] },

    { id: "s-hero", typ: "hero", widoczna: true,
      tytul: "CZEŚĆ!",
      lead: "Nazywam się Martyna Grobelna. Jestem psycholożką i psychoterapeutką.",
      akapity: [
        "Rozmowa o tym, co trudne, wymaga odwagi — i miejsca, w którym da się ją bezpiecznie zacząć. Takie miejsce staram się tworzyć w gabinecie: bez oceniania, we własnym tempie, z uwagą na to, co przynosisz.",
        "Pracuję po to, żeby wesprzeć Cię w budowaniu życia, które uznasz za swoje.",
      ],
      przyciski: [
        { tekst: "więcej o mnie", cel: "#o-mnie" },
        { tekst: "umów się na spotkanie", cel: "#kontakt" },
      ],
      zdjecie: null, opisZdjecia: "Portret", pokazZdjecie: true,
      stronaZdjecia: "lewo", ksztalt: "blob" },

    { id: "s-filary", typ: "filary", widoczna: true,
      tytul: "Jak pracuję?", wyrownanieTytulu: "lewo", ukladIkony: "lewo", odstep: "zwykly",
      karty: [
        { ikona: "osoby-trzy", nazwa: "różnorodność",
          tekst: "Gabinet jest otwarty niezależnie od tożsamości płciowej, orientacji, modelu relacji, wyznania i pochodzenia. To punkt wyjścia całej mojej praktyki, nie temat do obsłużenia przy okazji." },
        { ikona: "strzalka-petla", nazwa: "nurty",
          tekst: "Moja praca opiera się na podejściach o potwierdzonej skuteczności i na bieżącej literaturze naukowej. Nurty, w których pracuję, wypisz tutaj wprost — to jedna z pierwszych rzeczy, których szuka osoba szukająca terapeuty." },
        { ikona: "sciezka-wezly", nazwa: "struktura",
          tekst: "Zaczynamy od kilku spotkań konsultacyjnych. Kiedy kierunek jest już jasny, przechodzimy do pracy nad bieżącymi trudnościami. Postępy oglądamy wspólnie i na bieżąco." },
      ],
      przyciskPod: { tekst: "umów się na spotkanie", cel: "#kontakt" } },

    { id: "s-formy", typ: "formy", widoczna: true,
      tytul: "formy spotkań", wyrownanieTytulu: "lewo", kolumny: 2, odstep: "zwykly",
      karty: [
        { ikona: "glowa-platanina", nazwa: "terapia indywidualna",
          tekst: "Dla osób, które mierzą się z trudnościami życiowymi albo z problemami ze zdrowiem psychicznym, a także dla tych, które chcą wprowadzić ważną zmianę.",
          przycisk: { tekst: "dowiedz się więcej", cel: "#" } },
        { ikona: "para-glowy", nazwa: "terapia partnerska/par",
          tekst: "Dla osób w relacji romantycznej, które chcą zadbać o jakość swojego związku albo rozwiązać powtarzające się konflikty.",
          przycisk: { tekst: "dowiedz się więcej", cel: "#" } },
      ],
      przyciskiPod: [
        { tekst: "umów się na spotkanie", cel: "#kontakt" },
        { tekst: "cennik", cel: "#" },
      ] },

    { id: "s-kontakt", typ: "kontakt", widoczna: true,
      tytul: "Kontakt", mapa: true, mapaHtml: "",
      kolumny: [
        { naglowek: "Zapisy:", wiersze: ["kontakt@example.com"], godziny: [] },
        { naglowek: "Adres", wiersze: ["ul. Przykładowa 1", "00-000 Warszawa", "Polska"], godziny: [] },
        { naglowek: "Dostępność:", wiersze: [], godziny: [
          { dzien: "Poniedziałek", zakres: "09:00 – 16:00 (stacjonarnie)" },
          { dzien: "Wtorek", zakres: "09:00 – 15:00 (online)" },
          { dzien: "Środa", zakres: "09:00 – 15:00 (online)" },
          { dzien: "Czwartek", zakres: "09:00 – 15:00 (online)" },
        ] },
      ] },

    { id: "s-stopka", typ: "stopka", widoczna: true, tresc: "kontakt@example.com" },
  ],
};
