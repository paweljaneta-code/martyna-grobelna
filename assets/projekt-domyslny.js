/* Punkt wyjścia redaktora — wersja 2: projekt trzyma KILKA stron.
   Redaktor kopiuje ten obiekt przy pierwszym uruchomieniu i od tej pory
   pracuje na kopii w przeglądarce. Plik zostaje nietknięty, więc
   „Zacznij od nowa" zawsze ma dokąd wrócić. */

(function () {
  let licznik = 0;
  const id = (p) => `${p}-${++licznik}`;

  /* Menu i stopka powtarzają się na każdej stronie. Trzymamy je w funkcjach,
     żeby zmiana adresu w jednym miejscu nie wymagała pięciu poprawek —
     ale każda strona dostaje WŁASNĄ kopię z własnym identyfikatorem,
     bo redaktor adresuje sekcje po id. */
  const pasek = () => ({ id: id("pasek"), typ: "pasek", widoczna: true, pozycje: [
    { tekst: "o mnie", cel: "o-mnie.html" },
    { tekst: "jak pracuję", cel: "index.html#jak-pracuje" },
    { tekst: "formy spotkań", cel: "index.html#formy-spotkan" },
    { tekst: "kontakt", cel: "index.html#kontakt" },
  ] });

  const stopka = () => ({ id: id("stopka"), typ: "stopka", widoczna: true, tresc: "kontakt@example.com" });

  const wezwanie = (tytul) => ({ id: id("cta"), typ: "cta", widoczna: true, odstep: "zwykly",
    tytul: tytul || "", przyciski: [
      { tekst: "umów się na spotkanie", cel: "index.html#kontakt" },
      { tekst: "wróć na stronę główną", cel: "index.html" },
    ] });

  window.KX_PROJEKT_DOMYSLNY = {
    wersja: 2,

    meta: {
      tytul: "Martyna Grobelna — psychoterapia",
      opis: "Gabinet psychoterapii. Terapia indywidualna i terapia par — stacjonarnie i online.",
    },

    motyw: {
      krojNaglowki: "Poppins", zapasowyNaglowki: "system-ui, sans-serif",
      krojProza: "EB Garamond", zapasowyProza: "Georgia, serif",
      skala: 1, interlinia: 1.7, zaokraglenie: 2, szerokosc: 1120,
      kolory: {
        tlo: "#efeeec", pasKontakt: "#e6e4e0", karta: "#ffffff",
        tekst: "#14130f", miekki: "#56534c", kreska: "#dcd9d3", akcent: "#ece5d4",
      },
    },

    strony: [

      /* ---------------------------------------------------- strona główna */
      { id: "glowna", nazwa: "Strona główna", plik: "index.html", tytul: "", opis: "",
        sekcje: [
          pasek(),

          { id: id("hero"), typ: "hero", widoczna: true,
            tytul: "CZEŚĆ!",
            lead: "Nazywam się Martyna Grobelna. Jestem psycholożką i psychoterapeutką.",
            akapity: [
              "Rozmowa o tym, co trudne, wymaga odwagi — i miejsca, w którym da się ją bezpiecznie zacząć. Takie miejsce staram się tworzyć w gabinecie: bez oceniania, we własnym tempie, z uwagą na to, co przynosisz.",
              "Pracuję po to, żeby wesprzeć Cię w budowaniu życia, które uznasz za swoje.",
            ],
            przyciski: [
              { tekst: "więcej o mnie", cel: "o-mnie.html" },
              { tekst: "umów się na spotkanie", cel: "#kontakt" },
            ],
            zdjecie: null, opisZdjecia: "Portret", pokazZdjecie: true,
            stronaZdjecia: "lewo", ksztalt: "blob" },

          { id: id("filary"), typ: "filary", widoczna: true,
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

          { id: id("formy"), typ: "formy", widoczna: true,
            tytul: "formy spotkań", wyrownanieTytulu: "lewo", kolumny: 2, odstep: "zwykly",
            karty: [
              { ikona: "glowa-platanina", nazwa: "terapia indywidualna",
                tekst: "Dla osób, które mierzą się z trudnościami życiowymi albo z problemami ze zdrowiem psychicznym, a także dla tych, które chcą wprowadzić ważną zmianę.",
                przycisk: { tekst: "dowiedz się więcej", cel: "terapia-indywidualna.html" } },
              { ikona: "para-glowy", nazwa: "terapia partnerska/par",
                tekst: "Dla osób w relacji romantycznej, które chcą zadbać o jakość swojego związku albo rozwiązać powtarzające się konflikty.",
                przycisk: { tekst: "dowiedz się więcej", cel: "terapia-partnerska.html" } },
            ],
            przyciskiPod: [
              { tekst: "umów się na spotkanie", cel: "#kontakt" },
              { tekst: "cennik", cel: "cennik.html" },
            ] },

          { id: id("kontakt"), typ: "kontakt", widoczna: true,
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

          stopka(),
        ] },

      /* ---------------------------------------------------------- o mnie */
      { id: "o-mnie", nazwa: "O mnie", plik: "o-mnie.html",
        tytul: "O mnie — Martyna Grobelna",
        opis: "Wykształcenie, doświadczenie i sposób pracy.",
        sekcje: [
          pasek(),

          /* Swobodne płótno: portret obok przedstawienia. Bloki można
             przesuwać i skalować myszą — od tego zaczyna się ta strona,
             żeby było widać, do czego płótno służy. */
          { id: id("plotno"), typ: "plotno", widoczna: true, odstep: "zwykly",
            rzad: 44, luka: 14, wysokosc: 9,
            bloki: [
              { rodzaj: "zdjecie", x: 0, y: 0, w: 5, h: 8, zdjecie: null, opis: "Portret" },
              { rodzaj: "naglowek", x: 6, y: 1, w: 6, h: 2, tresc: "Martyna Grobelna", wielkosc: 2.4 },
              { rodzaj: "tekst", x: 6, y: 3, w: 6, h: 1, tresc: "psycholożka i psychoterapeutka",
                kolorTekstu: "#56534c" },
              { rodzaj: "tekst", x: 6, y: 4, w: 6, h: 3,
                tresc: "Tutaj stanie kilka zdań o drodze zawodowej: co skłoniło mnie do tej pracy, w czym czuję się najmocniej i czego można się spodziewać po pierwszym spotkaniu." },
              { rodzaj: "przycisk", x: 6, y: 7, w: 4, h: 1, tresc: "umów się na spotkanie", cel: "index.html#kontakt" },
            ] },

          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Wykształcenie", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: false,
            akapity: [
              "Kierunek i uczelnia, rok ukończenia.",
              "Szkoła psychoterapii — nazwa, tryb, rok ukończenia albo rok rozpoczęcia.",
              "Kursy i szkolenia, które naprawdę zmieniły sposób pracy.",
            ] },

          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Doświadczenie", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: false,
            akapity: [
              "Miejsca pracy: poradnie, oddziały, fundacje, praktyka prywatna.",
              "Grupy, z którymi pracuję najczęściej.",
              "Liczba godzin pracy z osobami w terapii, jeśli chcesz ją podać.",
            ] },

          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Superwizja i etyka", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: true,
            akapity: [
              "Pracuję pod stałą superwizją i przestrzegam kodeksu etycznego — uzupełnij nazwę towarzystwa. Wszystko, o czym rozmawiamy, objęte jest tajemnicą zawodową.",
            ] },

          wezwanie(""),
          stopka(),
        ] },

      /* ------------------------------------------- terapia indywidualna */
      { id: "terapia-indywidualna", nazwa: "Terapia indywidualna", plik: "terapia-indywidualna.html",
        tytul: "Terapia indywidualna — Martyna Grobelna",
        opis: "Terapia indywidualna — dla kogo, jak wygląda, ile trwa.",
        sekcje: [
          pasek(),
          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Terapia indywidualna", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: true,
            akapity: [
              "Forma spotkań dla osób, które mierzą się z trudnościami życiowymi albo z problemami ze zdrowiem psychicznym, a także dla tych, które chcą wprowadzić w swoim życiu ważną zmianę.",
            ] },
          { id: id("filary"), typ: "filary", widoczna: true,
            tytul: "Jak to wygląda", wyrownanieTytulu: "lewo", ukladIkony: "lewo", odstep: "zwykly",
            karty: [
              { ikona: "zegar", nazwa: "spotkanie",
                tekst: "Spotkanie trwa 50 minut i odbywa się zwykle raz w tygodniu, o stałej porze. Te wartości są typowe, nie ustalone — podmień na swoje." },
              { ikona: "sciezka-wezly", nazwa: "początek",
                tekst: "Pierwsze dwa albo trzy spotkania są konsultacyjne — służą poznaniu się i ustaleniu, czy i nad czym chcemy pracować." },
              { ikona: "laptop", nazwa: "gdzie",
                tekst: "Terapia może odbywać się w gabinecie albo online." },
            ],
            przyciskPod: { tekst: "", cel: "#" } },
          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Z czym można przyjść", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: false,
            akapity: [
              "Lęk, napięcie, natrętne myśli.",
              "Obniżony nastrój, brak energii, poczucie utknięcia.",
              "Kryzys życiowy: strata, rozstanie, zmiana pracy, wypalenie.",
              "Trudności w relacjach i w stawianiu granic.",
              "Praca nad tym, co powtarza się od lat.",
            ] },

          wezwanie(""),
          stopka(),
        ] },

      /* --------------------------------------------- terapia partnerska */
      { id: "terapia-partnerska", nazwa: "Terapia par", plik: "terapia-partnerska.html",
        tytul: "Terapia partnerska/par — Martyna Grobelna",
        opis: "Terapia par — dla kogo, jak wygląda, ile trwa.",
        sekcje: [
          pasek(),
          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Terapia partnerska/par", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: true,
            akapity: [
              "Forma spotkań dla osób w relacji romantycznej, które wspólnie chcą zadbać o jakość swojego związku albo rozwiązać powtarzające się konflikty. Zapraszam pary niezależnie od płci, orientacji i modelu relacji.",
            ] },
          { id: id("filary"), typ: "filary", widoczna: true,
            tytul: "Jak to wygląda", wyrownanieTytulu: "lewo", ukladIkony: "lewo", odstep: "zwykly",
            karty: [
              { ikona: "zegar", nazwa: "spotkanie",
                tekst: "Spotkanie trwa 80 minut i odbywa się co tydzień albo co dwa tygodnie." },
              { ikona: "para-glowy", nazwa: "kto przychodzi",
                tekst: "Na początku zwykle spotykamy się we troje; czasem proponuję po jednym spotkaniu indywidualnym z każdą z osób. Nie staję po żadnej ze stron — pracuję na rzecz relacji." },
              { ikona: "tarcza", nazwa: "kiedy to nie jest właściwa forma",
                tekst: "Przy przemocy w relacji, przy nieleczonym uzależnieniu albo gdy jedna z osób podjęła już decyzję o rozstaniu, terapia par bywa przeciwskuteczna. W takiej sytuacji powiem o tym wprost i pomogę znaleźć odpowiedniejszą pomoc." },
            ],
            przyciskPod: { tekst: "", cel: "#" } },
          { id: id("tekst"), typ: "tekst", widoczna: true, odstep: "zwykly",
            tytul: "Z czym można przyjść", wyrownanieTytulu: "lewo", wyrownanie: "justowane",
            szerokoscTekstu: 68, wKarcie: false,
            akapity: [
              "Kłótnie, które toczą się wciąż o to samo i nigdzie nie prowadzą.",
              "Oddalenie, chłód, poczucie życia obok siebie.",
              "Kryzys zaufania.",
              "Różnice w potrzebach — bliskości, czasu, seksu, planów na przyszłość.",
              "Ważna zmiana: dziecko, przeprowadzka, choroba, nowy układ relacji.",
            ] },

          wezwanie(""),
          stopka(),
        ] },

      /* ---------------------------------------------------------- cennik */
      { id: "cennik", nazwa: "Cennik", plik: "cennik.html",
        tytul: "Cennik — Martyna Grobelna",
        opis: "Ceny konsultacji, terapii indywidualnej i terapii par.",
        sekcje: [
          pasek(),
          { id: id("cennik"), typ: "cennik", widoczna: true, odstep: "zwykly",
            tytul: "Cennik", wyrownanieTytulu: "srodek",
            pozycje: [
              { nazwa: "Konsultacja indywidualna (50 min)", kwota: "000 zł" },
              { nazwa: "Terapia indywidualna (50 min)", kwota: "000 zł" },
              { nazwa: "Konsultacja pary (80 min)", kwota: "000 zł" },
              { nazwa: "Terapia par (80 min)", kwota: "000 zł" },
            ],
            uwagi: [
              "Płatność przelewem lub kartą po spotkaniu. Termin odwołany później niż 24 godziny przed spotkaniem jest płatny — rezerwuję go wyłącznie dla Ciebie.",
              "Dysponuję kilkoma miejscami w niższej cenie dla osób w trudnej sytuacji finansowej. Jeśli cena jest przeszkodą, napisz — poszukamy rozwiązania.",
            ] },
          wezwanie(""),
          stopka(),
        ] },
    ],
  };
})();
