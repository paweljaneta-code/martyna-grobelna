/* ==========================================================================
   Redaktor strony — logika narzędzia.

   Zasada, która rządzi całym plikiem: JEDYNYM źródłem prawdy jest obiekt
   `projekt`. Podgląd, lista sekcji i panel ustawień są z niego rysowane;
   nic nie trzyma stanu „po swojemu". Dzięki temu eksport nie ma prawa
   pokazać czegoś innego niż podgląd.

   Wyjątek, świadomy: pisanie w tekście NIE przerysowuje podglądu — zapis
   idzie do `projekt`, a litery są już na ekranie. Przerysowanie przy każdym
   znaku gubiłoby kursor.
   ========================================================================== */

(function () {
  "use strict";

  const $ = (s, k = document) => k.querySelector(s);
  const $$ = (s, k = document) => [...k.querySelectorAll(s)];

  /* --------------------------------------------------------- ścieżki */
  /* "sekcje.2.karty.1.tekst" → miejsce w obiekcie. Pozwala panelowi
     ustawień i polom w podglądzie mówić o tym samym bez znajomości typu. */
  const pobierz = (o, s) => s.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  function ustaw(o, s, w) {
    const cz = s.split(".");
    let x = o;
    for (let i = 0; i < cz.length - 1; i++) {
      if (x[cz[i]] == null) x[cz[i]] = /^\d+$/.test(cz[i + 1]) ? [] : {};
      x = x[cz[i]];
    }
    x[cz.at(-1)] = w;
  }
  const klon = (o) => JSON.parse(JSON.stringify(o));

  /* --------------------------------------------------------- komunikaty */
  let zegarKomunikatu;
  function powiedz(tekst) {
    const el = $("#komunikat");
    el.textContent = tekst;
    el.classList.add("widoczny");
    clearTimeout(zegarKomunikatu);
    zegarKomunikatu = setTimeout(() => el.classList.remove("widoczny"), 2600);
  }

  /* Deklaracje wyprzedzające. Panel ustawień, wybór grafiki i wgrywanie
     zdjęć mieszkają w drugiej części pliku, a są wołane stąd — bez tego
     pierwsze kliknięcie w podgląd kończyłoby się błędem odwołania. */
  let rysujPanelElementu = () => {};
  let rysujPanelMotywu = () => {};
  let otworzWyborIkony = () => {};
  let wybierzZdjecie = () => {};

  /* --------------------------------------------------------- stan */
  let projekt = klon(window.KX_PROJEKT_DOMYSLNY);
  let zaznaczona = null;   // id sekcji
  let zaznaczonaKarta = null; // "indeksSekcji.indeksKarty"
  const historia = { wstecz: [], naprzod: [] };
  const LIMIT_HISTORII = 60;

  function zapamietaj() {
    historia.wstecz.push(JSON.stringify(projekt));
    if (historia.wstecz.length > LIMIT_HISTORII) historia.wstecz.shift();
    historia.naprzod.length = 0;
    odswiezPrzyciskiHistorii();
  }
  function cofnij() {
    if (!historia.wstecz.length) return;
    historia.naprzod.push(JSON.stringify(projekt));
    projekt = JSON.parse(historia.wstecz.pop());
    poZmianie();
  }
  function ponow() {
    if (!historia.naprzod.length) return;
    historia.wstecz.push(JSON.stringify(projekt));
    projekt = JSON.parse(historia.naprzod.pop());
    poZmianie();
  }
  function odswiezPrzyciskiHistorii() {
    $("#cofnij").disabled = !historia.wstecz.length;
    $("#ponow").disabled = !historia.naprzod.length;
  }

  /* --------------------------------------------------------- trwałość */
  /* IndexedDB, nie localStorage: zdjęcia wchodzą do projektu jako dane
     tekstowe i potrafią przekroczyć pięciomegabajtowy limit localStorage,
     a wtedy zapis pada po cichu i praca znika przy przeładowaniu. */
  const Magazyn = (() => {
    let baza = null, zepsuta = false;
    function otworz() {
      return new Promise((ok, zle) => {
        const z = indexedDB.open("kx-redaktor", 1);
        z.onupgradeneeded = () => z.result.createObjectStore("stan");
        z.onsuccess = () => ok((baza = z.result));
        z.onerror = () => zle(z.error);
      });
    }
    async function operacja(tryb, dzialanie) {
      if (zepsuta) return null;
      try {
        if (!baza) await otworz();
        return await new Promise((ok, zle) => {
          const t = baza.transaction("stan", tryb);
          const z = dzialanie(t.objectStore("stan"));
          z.onsuccess = () => ok(z.result);
          z.onerror = () => zle(z.error);
        });
      } catch (e) {
        zepsuta = true;
        powiedz("Autozapis niedostępny — pobieraj projekt ręcznie.");
        return null;
      }
    }
    return {
      zapisz: (v) => operacja("readwrite", (s) => s.put(JSON.stringify(v), "projekt")),
      wczytaj: () => operacja("readonly", (s) => s.get("projekt")),
      skasuj: () => operacja("readwrite", (s) => s.delete("projekt")),
    };
  })();

  let zegarZapisu;
  function zapiszPozniej() {
    clearTimeout(zegarZapisu);
    zegarZapisu = setTimeout(() => Magazyn.zapisz(projekt), 700);
  }

  /* --------------------------------------------------------- podgląd */
  const STYL_NARZEDZIA = `
    [data-sekcja]{position:relative}
    [data-sekcja]:hover{outline:1px dashed rgba(110,168,254,.5);outline-offset:-1px}
    [data-sekcja].kx-wybrana{outline:2px solid #6ea8fe;outline-offset:-2px}
    [data-karta]{transition:outline-color .12s ease}
    [data-karta].kx-wybrana-karta{outline:2px solid #f0b429;outline-offset:3px}
    [data-pole]:hover{background:rgba(110,168,254,.10);border-radius:2px}
    [data-pole]:focus{outline:2px solid #6ea8fe;outline-offset:2px;border-radius:2px;background:transparent}
    [data-gniazdo]{cursor:pointer}
    [data-gniazdo]:hover{outline:2px dashed #f0b429;outline-offset:4px;border-radius:4px}
  `;

  function rysujPodglad() {
    const d = $("#ramka").contentDocument;
    d.open();
    d.write(
      '<!doctype html><html lang="pl"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<base href="' + location.href.replace(/[^/]*$/, "") + '">' +
      '<link rel="stylesheet" href="assets/fonty.css">' +
      "<style>" + window.KX_STRONA.css(projekt.motyw) + "</style>" +
      "<style>" + STYL_NARZEDZIA + "</style></head><body>" +
      window.KX_STRONA.html(projekt, "edytor") +
      "</body></html>"
    );
    d.close();
    podepnijRamke(d);
    odswiezWybor(d);
  }

  function odswiezWybor(d) {
    d = d || $("#ramka").contentDocument;
    $$("[data-sekcja]", d).forEach((el) =>
      el.classList.toggle("kx-wybrana", el.dataset.sekcja === zaznaczona));
    $$("[data-karta]", d).forEach((el) =>
      el.classList.toggle("kx-wybrana-karta", el.dataset.karta === zaznaczonaKarta));
  }

  let zegarTekstu;
  function podepnijRamke(d) {
    /* Odnośniki w podglądzie nie nawigują — to makieta, nie strona. */
    d.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) e.preventDefault();

      const gniazdo = e.target.closest("[data-gniazdo]");
      const karta = e.target.closest("[data-karta]");
      const sekcja = e.target.closest("[data-sekcja]");

      if (sekcja) {
        zaznaczona = sekcja.dataset.sekcja;
        zaznaczonaKarta = karta ? karta.dataset.karta : null;
        rysujListeSekcji();
        rysujPanelElementu();
        odswiezWybor(d);
      }
      if (gniazdo && gniazdo.dataset.gniazdo === "ikona") {
        otworzWyborIkony(gniazdo.dataset.sciezka);
      }
      if (gniazdo && gniazdo.dataset.gniazdo === "zdjecie") {
        const idx = gniazdo.dataset.sekcjaIdx;
        wybierzZdjecie((dataURL) => {
          zapamietaj();
          projekt.sekcje[idx].zdjecie = dataURL;
          poZmianie();
        });
      }
    });

    /* Pisanie w miejscu: zapis do stanu bez przerysowania. */
    d.addEventListener("input", (e) => {
      const p = e.target.closest("[data-pole]");
      if (!p) return;
      clearTimeout(zegarTekstu);
      /* Pierwsza zmiana w serii trafia do historii; kolejne znaki już nie,
         żeby „cofnij" nie cofało litera po literze. */
      if (!zegarTekstu) zapamietaj();
      zegarTekstu = setTimeout(() => { zegarTekstu = 0; }, 800);
      ustaw(projekt, p.dataset.pole, p.textContent);
      zapiszPozniej();
    });
  }

  /* --------------------------------------------------------- lista sekcji */
  const NAZWY_TYPOW = {
    pasek: "Pasek menu", hero: "Powitanie", filary: "Filary pracy",
    formy: "Karty oferty", tekst: "Blok tekstu", cytat: "Cytat",
    galeria: "Galeria zdjęć", cta: "Wezwanie do kontaktu",
    kontakt: "Kontakt", stopka: "Stopka",
  };

  function opisSekcji(s) {
    const t = NAZWY_TYPOW[s.typ] || s.typ;
    const wlasny = s.tytul || s.tresc || (s.typ === "hero" ? s.tytul : "");
    return wlasny && String(wlasny).trim() ? `${t} — ${String(wlasny).slice(0, 22)}` : t;
  }

  function rysujListeSekcji() {
    const ul = $("#listaSekcji");
    ul.innerHTML = "";
    projekt.sekcje.forEach((s, i) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.idx = i;
      li.setAttribute("aria-selected", String(s.id === zaznaczona));
      li.classList.toggle("ukryta", s.widoczna === false);
      li.innerHTML =
        '<span class="uchwyt" aria-hidden="true">⠿</span>' +
        '<span class="nazwa-sekcji"></span>' +
        `<button class="mini" data-akcja="oko" title="${s.widoczna === false ? "Pokaż" : "Ukryj"}">${s.widoczna === false ? "◌" : "◉"}</button>` +
        '<button class="mini" data-akcja="skasuj" title="Usuń sekcję">✕</button>';
      li.querySelector(".nazwa-sekcji").textContent = opisSekcji(s);
      ul.appendChild(li);
    });
  }

  /* --------------------------------------------------------- przeciąganie */
  /* Jedna obsługa dla listy sekcji i dla list w panelu — różni je tylko to,
     co robi `przenies` po upuszczeniu. */
  function wlaczPrzeciaganie(kontener, wybierak, przenies) {
    let zrodlo = null;
    kontener.addEventListener("dragstart", (e) => {
      const el = e.target.closest(wybierak);
      if (!el) return;
      zrodlo = el;
      el.classList.add("przeciagana");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.idx);
    });
    kontener.addEventListener("dragover", (e) => {
      const el = e.target.closest(wybierak);
      if (!el || el === zrodlo) return;
      e.preventDefault();
      $$(wybierak, kontener).forEach((x) => x.classList.remove("nad"));
      el.classList.add("nad");
    });
    kontener.addEventListener("dragleave", (e) => {
      const el = e.target.closest(wybierak);
      if (el) el.classList.remove("nad");
    });
    kontener.addEventListener("drop", (e) => {
      const cel = e.target.closest(wybierak);
      if (!cel || !zrodlo) return;
      e.preventDefault();
      const z = Number(zrodlo.dataset.idx), k = Number(cel.dataset.idx);
      $$(wybierak, kontener).forEach((x) => x.classList.remove("nad", "przeciagana"));
      if (z !== k) { zapamietaj(); przenies(z, k); poZmianie(); }
      zrodlo = null;
    });
    kontener.addEventListener("dragend", () => {
      $$(wybierak, kontener).forEach((x) => x.classList.remove("nad", "przeciagana"));
      zrodlo = null;
    });
  }

  function przestaw(tablica, z, k) {
    const [el] = tablica.splice(z, 1);
    tablica.splice(k, 0, el);
  }

  /* --------------------------------------------------------- po zmianie */
  function poZmianie() {
    rysujPodglad();
    rysujListeSekcji();
    rysujPanelElementu();
    rysujPanelMotywu();
    odswiezPrzyciskiHistorii();
    /* Bez opóźnienia. Dodanie albo skasowanie sekcji zdarza się rzadko,
       a opóźniony zapis ginie przy przeładowaniu strony — przeładowanie
       kasuje licznik, więc ostatnia zmiana przepadała. */
    clearTimeout(zegarZapisu);
    Magazyn.zapisz(projekt);
  }

  /* Ostatnia deska ratunku: zamknięcie karty albo przeładowanie zapisuje
     to, co czekało w opóźnieniu. Bez tego ginie ostatnie zdanie. */
  addEventListener("pagehide", () => { clearTimeout(zegarZapisu); Magazyn.zapisz(projekt); });

  /* Wystawione dla drugiej części pliku. */
  window.__redaktor = {
    get projekt() { return projekt; },
    set projekt(p) { projekt = p; },
    get zaznaczona() { return zaznaczona; },
    set zaznaczona(v) { zaznaczona = v; },
    get zaznaczonaKarta() { return zaznaczonaKarta; },
    set zaznaczonaKarta(v) { zaznaczonaKarta = v; },
    $, $$, pobierz, ustaw, klon, powiedz, zapamietaj, poZmianie, cofnij, ponow,
    rysujPodglad, rysujListeSekcji, wlaczPrzeciaganie, przestaw, Magazyn,
    NAZWY_TYPOW, historia,
    podepnij(f) {
      if (f.rysujPanelElementu) rysujPanelElementu = f.rysujPanelElementu;
      if (f.rysujPanelMotywu) rysujPanelMotywu = f.rysujPanelMotywu;
      if (f.otworzWyborIkony) otworzWyborIkony = f.otworzWyborIkony;
      if (f.wybierzZdjecie) wybierzZdjecie = f.wybierzZdjecie;
    },
  };
})();

/* ==========================================================================
   Część druga: panel ustawień, wybór grafiki, zdjęcia, wejście i wyjście.
   ========================================================================== */

(function () {
  "use strict";

  const R = window.__redaktor;
  const { $, $$, pobierz, ustaw, klon, powiedz, zapamietaj, poZmianie } = R;

  /* --------------------------------------------------------- szablony sekcji */
  const SZABLONY = {
    pasek: () => ({ typ: "pasek", pozycje: [{ tekst: "o mnie", cel: "#" }, { tekst: "kontakt", cel: "#kontakt" }] }),
    hero: () => ({ typ: "hero", tytul: "CZEŚĆ!", lead: "Krótkie przedstawienie w jednym zdaniu.",
      akapity: ["Dwa, trzy zdania o tym, co oferujesz i dla kogo."], przyciski: [{ tekst: "umów się", cel: "#kontakt" }],
      zdjecie: null, opisZdjecia: "", pokazZdjecie: true, stronaZdjecia: "lewo", ksztalt: "blob" }),
    filary: () => ({ typ: "filary", tytul: "Jak pracuję?", wyrownanieTytulu: "lewo", ukladIkony: "lewo", odstep: "zwykly",
      karty: [{ ikona: "serce", nazwa: "pierwszy filar", tekst: "Opis." }], przyciskPod: { tekst: "", cel: "#" } }),
    formy: () => ({ typ: "formy", tytul: "formy spotkań", wyrownanieTytulu: "lewo", kolumny: 2, odstep: "zwykly",
      karty: [{ ikona: "sylwetka", nazwa: "nazwa oferty", tekst: "Opis.", przycisk: { tekst: "dowiedz się więcej", cel: "#" } }],
      przyciskiPod: [] }),
    tekst: () => ({ typ: "tekst", tytul: "Nagłówek", akapity: ["Treść."], wyrownanie: "justowane",
      szerokoscTekstu: 68, wKarcie: false, odstep: "zwykly", wyrownanieTytulu: "lewo" }),
    cytat: () => ({ typ: "cytat", tresc: "Zdanie, które ma zostać w pamięci.", autor: "", odstep: "zwykly" }),
    galeria: () => ({ typ: "galeria", tytul: "", zdjecia: [], kolumny: 3, odstep: "zwykly" }),
    cta: () => ({ typ: "cta", tytul: "Porozmawiajmy", przyciski: [{ tekst: "napisz do mnie", cel: "#kontakt" }], odstep: "zwykly" }),
    kontakt: () => ({ typ: "kontakt", tytul: "Kontakt", mapa: true, mapaHtml: "",
      kolumny: [{ naglowek: "Zapisy:", wiersze: ["kontakt@example.com"], godziny: [] }] }),
    stopka: () => ({ typ: "stopka", tresc: "kontakt@example.com" }),
  };

  /* --------------------------------------------------------- opis ustawień */
  /* Panel jest rysowany z tego opisu, nie z ręcznie pisanego HTML-a dla
     każdego typu. Dołożenie pola to jedna linia, a nie nowa funkcja. */
  const ODSTEP = { typ: "wybor", sciezka: "odstep", etykieta: "Odstęp od sąsiadów",
    opcje: [["ciasny", "ciasny"], ["zwykly", "zwykły"], ["luzny", "luźny"]] };
  const TYTUL_POZ = { typ: "wybor", sciezka: "wyrownanieTytulu", etykieta: "Tytuł sekcji",
    opcje: [["lewo", "do lewej"], ["srodek", "wyśrodkowany"]] };

  const USTAWIENIA = {
    pasek: [
      { typ: "listaObiektow", sciezka: "pozycje", etykieta: "Pozycje menu",
        pola: [["tekst", "Napis"], ["cel", "Odnośnik"]], nowy: () => ({ tekst: "nowa pozycja", cel: "#" }) },
    ],
    hero: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Nagłówek" },
      { typ: "obszar", sciezka: "lead", etykieta: "Zdanie pod nagłówkiem" },
      { typ: "listaProsta", sciezka: "akapity", etykieta: "Akapity", nowy: () => "Nowy akapit." },
      { typ: "listaObiektow", sciezka: "przyciski", etykieta: "Przyciski",
        pola: [["tekst", "Napis"], ["cel", "Odnośnik"]], nowy: () => ({ tekst: "nowy przycisk", cel: "#" }) },
      { typ: "rozdzielacz" },
      { typ: "przelacznik", sciezka: "pokazZdjecie", etykieta: "Pokaż zdjęcie" },
      { typ: "zdjecie", sciezka: "zdjecie", etykieta: "Zdjęcie" },
      { typ: "tekst", sciezka: "opisZdjecia", etykieta: "Opis zdjęcia dla czytników ekranu" },
      { typ: "wybor", sciezka: "stronaZdjecia", etykieta: "Zdjęcie po stronie",
        opcje: [["lewo", "lewej"], ["prawo", "prawej"]] },
      { typ: "wybor", sciezka: "ksztalt", etykieta: "Kształt zdjęcia",
        opcje: [["blob", "organiczny"], ["kolo", "koło"], ["luk", "łuk"], ["prostokat", "prostokąt"]] },
    ],
    filary: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł sekcji" }, TYTUL_POZ,
      { typ: "wybor", sciezka: "ukladIkony", etykieta: "Grafika", opcje: [["lewo", "z boku"], ["gora", "nad tekstem"]] },
      { typ: "karty", sciezka: "karty", etykieta: "Karty",
        nowy: () => ({ ikona: "serce", nazwa: "nowa karta", tekst: "Treść karty." }) },
      { typ: "rozdzielacz" },
      { typ: "tekst", sciezka: "przyciskPod.tekst", etykieta: "Przycisk pod sekcją — napis (pusty = brak)" },
      { typ: "tekst", sciezka: "przyciskPod.cel", etykieta: "Przycisk pod sekcją — odnośnik" },
      ODSTEP,
    ],
    formy: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł sekcji" }, TYTUL_POZ,
      { typ: "wybor", sciezka: "kolumny", etykieta: "Kart w rzędzie", opcje: [[2, "dwie"], [3, "trzy"]], liczba: true },
      { typ: "karty", sciezka: "karty", zPrzyciskiem: true, etykieta: "Karty",
        nowy: () => ({ ikona: "sylwetka", nazwa: "nowa karta", tekst: "Opis.", przycisk: { tekst: "dowiedz się więcej", cel: "#" } }) },
      { typ: "listaObiektow", sciezka: "przyciskiPod", etykieta: "Przyciski pod sekcją",
        pola: [["tekst", "Napis"], ["cel", "Odnośnik"]], nowy: () => ({ tekst: "nowy przycisk", cel: "#" }) },
      ODSTEP,
    ],
    tekst: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł (pusty = brak)" }, TYTUL_POZ,
      { typ: "listaProsta", sciezka: "akapity", etykieta: "Akapity", nowy: () => "Nowy akapit." },
      { typ: "wybor", sciezka: "wyrownanie", etykieta: "Wyrównanie tekstu",
        opcje: [["justowane", "justowane"], ["lewo", "do lewej"]] },
      { typ: "liczba", sciezka: "szerokoscTekstu", etykieta: "Szerokość kolumny (znaki)", min: 40, max: 100, krok: 2 },
      { typ: "przelacznik", sciezka: "wKarcie", etykieta: "Na białej karcie" },
      ODSTEP,
    ],
    cytat: [
      { typ: "obszar", sciezka: "tresc", etykieta: "Treść cytatu" },
      { typ: "tekst", sciezka: "autor", etykieta: "Podpis (pusty = brak)" },
      ODSTEP,
    ],
    galeria: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł (pusty = brak)" },
      { typ: "wybor", sciezka: "kolumny", etykieta: "Zdjęć w rzędzie", opcje: [[2, "dwa"], [3, "trzy"], [4, "cztery"]], liczba: true },
      { typ: "galeria", sciezka: "zdjecia", etykieta: "Zdjęcia" },
      ODSTEP,
    ],
    cta: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł (pusty = brak)" },
      { typ: "listaObiektow", sciezka: "przyciski", etykieta: "Przyciski",
        pola: [["tekst", "Napis"], ["cel", "Odnośnik"]], nowy: () => ({ tekst: "nowy przycisk", cel: "#" }) },
      ODSTEP,
    ],
    kontakt: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł sekcji" },
      { typ: "kolumnyKontaktu", sciezka: "kolumny", etykieta: "Kolumny" },
      { typ: "rozdzielacz" },
      { typ: "przelacznik", sciezka: "mapa", etykieta: "Pokaż mapę" },
      { typ: "obszar", sciezka: "mapaHtml", etykieta: "Kod osadzenia mapy (opcjonalnie)" },
    ],
    stopka: [{ typ: "tekst", sciezka: "tresc", etykieta: "Treść stopki" }],
  };

  /* --------------------------------------------------------- budulec pól */
  function polePodpisane(etykieta, wnetrze) {
    const d = document.createElement("div");
    d.className = "pole";
    const l = document.createElement("label");
    l.textContent = etykieta;
    d.append(l, wnetrze);
    return d;
  }

  function wejscie(wartosc, typ, przyZmianie) {
    const i = document.createElement("input");
    i.type = typ;
    i.value = wartosc ?? "";
    let pierwsza = true;
    i.addEventListener("input", () => {
      if (pierwsza) { zapamietaj(); pierwsza = false; }
      przyZmianie(i.value);
    });
    i.addEventListener("blur", () => { pierwsza = true; });
    return i;
  }

  function guzik(napis, tytul, dzialanie) {
    const b = document.createElement("button");
    b.className = "mini";
    b.textContent = napis;
    b.title = tytul;
    b.addEventListener("click", dzialanie);
    return b;
  }

  /* --------------------------------------------------------- panel elementu */
  function rysujPanelElementu() {
    const cel = $("#panelElement");
    cel.innerHTML = "";

    const idx = R.projekt.sekcje.findIndex((s) => s.id === R.zaznaczona);
    if (idx < 0) {
      cel.innerHTML = '<p class="pusty">Kliknij dowolny fragment strony w podglądzie, ' +
        'żeby go tu ustawić.<br><br>W podglądzie możesz też pisać wprost po tekście — ' +
        'zmiany zapisują się same.</p>';
      return;
    }
    const s = R.projekt.sekcje[idx];
    const baza = `sekcje.${idx}`;

    const tytulik = document.createElement("h2");
    tytulik.style.cssText = "position:static;padding:0 0 10px";
    tytulik.textContent = R.NAZWY_TYPOW[s.typ] || s.typ;
    cel.append(tytulik);

    for (const opis of USTAWIENIA[s.typ] || []) {
      const el = rysujKontrolke(opis, s, baza, idx);
      if (el) cel.append(el);
    }
  }

  function rysujKontrolke(opis, s, baza, idx) {
    const pelna = `${baza}.${opis.sciezka || ""}`;

    if (opis.typ === "rozdzielacz") return document.createElement("hr");

    if (opis.typ === "tekst" || opis.typ === "obszar") {
      const el = document.createElement(opis.typ === "obszar" ? "textarea" : "input");
      if (opis.typ !== "obszar") el.type = "text";
      el.value = pobierz(R.projekt, pelna) ?? "";
      let pierwsza = true;
      el.addEventListener("input", () => {
        if (pierwsza) { zapamietaj(); pierwsza = false; }
        ustaw(R.projekt, pelna, el.value);
        R.rysujPodglad(); R.rysujListeSekcji(); R.Magazyn.zapisz(R.projekt);
      });
      el.addEventListener("blur", () => { pierwsza = true; });
      return polePodpisane(opis.etykieta, el);
    }

    if (opis.typ === "liczba") {
      const el = wejscie(pobierz(R.projekt, pelna), "number", (v) => {
        ustaw(R.projekt, pelna, Number(v)); R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      el.min = opis.min; el.max = opis.max; el.step = opis.krok || 1;
      return polePodpisane(opis.etykieta, el);
    }

    if (opis.typ === "wybor") {
      const sel = document.createElement("select");
      for (const [w, n] of opis.opcje) {
        const o = document.createElement("option");
        o.value = String(w); o.textContent = n;
        sel.append(o);
      }
      sel.value = String(pobierz(R.projekt, pelna) ?? opis.opcje[0][0]);
      sel.addEventListener("change", () => {
        zapamietaj();
        ustaw(R.projekt, pelna, opis.liczba ? Number(sel.value) : sel.value);
        poZmianie();
      });
      return polePodpisane(opis.etykieta, sel);
    }

    if (opis.typ === "przelacznik") {
      const d = document.createElement("div");
      d.className = "przel";
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = pobierz(R.projekt, pelna) !== false;
      i.id = "p-" + Math.random().toString(36).slice(2, 8);
      const l = document.createElement("label");
      l.htmlFor = i.id; l.textContent = opis.etykieta;
      i.addEventListener("change", () => { zapamietaj(); ustaw(R.projekt, pelna, i.checked); poZmianie(); });
      d.append(i, l);
      return d;
    }

    if (opis.typ === "zdjecie") return polaZdjecia(opis, pelna);
    if (opis.typ === "galeria") return polaGalerii(opis, pelna);
    if (opis.typ === "listaProsta") return listaProsta(opis, pelna);
    if (opis.typ === "listaObiektow") return listaObiektow(opis, pelna);
    if (opis.typ === "karty") return listaKart(opis, pelna, idx);
    if (opis.typ === "kolumnyKontaktu") return kolumnyKontaktu(opis, pelna);
    return null;
  }

  /* --------------------------------------------------------- listy */
  function ramkaListy(etykieta, elementy, przyDodaniu, napisDodaj) {
    const d = document.createElement("div");
    d.className = "pole";
    const l = document.createElement("label");
    l.textContent = etykieta;
    const ul = document.createElement("ul");
    ul.className = "karty";
    elementy.forEach((li) => ul.append(li));
    const dodaj = document.createElement("button");
    dodaj.className = "btn";
    dodaj.style.width = "100%";
    dodaj.textContent = napisDodaj || "+ Dodaj";
    dodaj.addEventListener("click", przyDodaniu);
    d.append(l, ul, dodaj);
    return { pole: d, ul };
  }

  function listaProsta(opis, pelna) {
    const tab = pobierz(R.projekt, pelna) || [];
    const elementy = tab.map((w, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      li.style.alignItems = "flex-start";
      const ta = document.createElement("textarea");
      ta.value = w; ta.style.minHeight = "62px"; ta.style.flex = "1";
      ta.style.cssText += ";background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px";
      let pierwsza = true;
      ta.addEventListener("input", () => {
        if (pierwsza) { zapamietaj(); pierwsza = false; }
        const t = pobierz(R.projekt, pelna); t[j] = ta.value;
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      ta.addEventListener("blur", () => { pierwsza = true; });
      li.append(ta, guzik("✕", "Usuń akapit", () => {
        zapamietaj(); pobierz(R.projekt, pelna).splice(j, 1); poZmianie();
      }));
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj(); pobierz(R.projekt, pelna).push(opis.nowy()); poZmianie();
    }, "+ Dodaj akapit");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.projekt, pelna), z, k));
    return pole;
  }

  function listaObiektow(opis, pelna) {
    const tab = pobierz(R.projekt, pelna) || [];
    const elementy = tab.map((o, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      li.style.flexDirection = "column"; li.style.alignItems = "stretch"; li.style.gap = "5px";
      const gora = document.createElement("div");
      gora.style.cssText = "display:flex;align-items:center;gap:6px";
      const uchwyt = document.createElement("span");
      uchwyt.className = "uchwyt"; uchwyt.textContent = "⠿";
      const podpis = document.createElement("span");
      podpis.className = "etykieta"; podpis.textContent = o[opis.pola[0][0]] || "(bez napisu)";
      gora.append(uchwyt, podpis, guzik("✕", "Usuń", () => {
        zapamietaj(); pobierz(R.projekt, pelna).splice(j, 1); poZmianie();
      }));
      li.append(gora);
      for (const [klucz, etykieta] of opis.pola) {
        const i = wejscie(o[klucz], "text", (v) => {
          pobierz(R.projekt, pelna)[j][klucz] = v;
          podpis.textContent = pobierz(R.projekt, pelna)[j][opis.pola[0][0]] || "(bez napisu)";
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        i.placeholder = etykieta;
        i.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%";
        li.append(i);
      }
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj(); pobierz(R.projekt, pelna).push(opis.nowy()); poZmianie();
    });
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.projekt, pelna), z, k));
    return pole;
  }

  function listaKart(opis, pelna, idxSekcji) {
    const tab = pobierz(R.projekt, pelna) || [];
    const elementy = tab.map((c, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      li.style.flexDirection = "column"; li.style.alignItems = "stretch"; li.style.gap = "6px";

      const gora = document.createElement("div");
      gora.style.cssText = "display:flex;align-items:center;gap:8px";
      const uchwyt = document.createElement("span");
      uchwyt.className = "uchwyt"; uchwyt.textContent = "⠿";

      const podglad = document.createElement("button");
      podglad.className = "podglad-ikony";
      podglad.style.cssText += ";background:transparent;border:0;padding:0;cursor:pointer";
      podglad.title = "Zmień grafikę";
      podglad.innerHTML = window.KX_STRONA.ikona(c.ikona) || "—";
      podglad.addEventListener("click", () => otworzWyborIkony(`${pelna}.${j}.ikona`));

      const podpis = document.createElement("span");
      podpis.className = "etykieta"; podpis.textContent = c.nazwa || "(bez nazwy)";
      gora.append(uchwyt, podglad, podpis, guzik("✕", "Usuń kartę", () => {
        zapamietaj(); pobierz(R.projekt, pelna).splice(j, 1); poZmianie();
      }));
      li.append(gora);

      const nazwa = wejscie(c.nazwa, "text", (v) => {
        pobierz(R.projekt, pelna)[j].nazwa = v; podpis.textContent = v || "(bez nazwy)";
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      nazwa.placeholder = "Nazwa";
      nazwa.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%";

      const tresc = document.createElement("textarea");
      tresc.value = c.tekst; tresc.placeholder = "Treść";
      tresc.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%;min-height:74px";
      let pierwsza = true;
      tresc.addEventListener("input", () => {
        if (pierwsza) { zapamietaj(); pierwsza = false; }
        pobierz(R.projekt, pelna)[j].tekst = tresc.value;
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      tresc.addEventListener("blur", () => { pierwsza = true; });
      li.append(nazwa, tresc);

      if (opis.zPrzyciskiem) {
        const bt = wejscie(c.przycisk?.tekst, "text", (v) => {
          const k = pobierz(R.projekt, pelna)[j];
          k.przycisk = k.przycisk || { tekst: "", cel: "#" }; k.przycisk.tekst = v;
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        bt.placeholder = "Napis przycisku (pusty = brak)";
        const bc = wejscie(c.przycisk?.cel, "text", (v) => {
          const k = pobierz(R.projekt, pelna)[j];
          k.przycisk = k.przycisk || { tekst: "", cel: "#" }; k.przycisk.cel = v;
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        bc.placeholder = "Odnośnik przycisku";
        for (const b of [bt, bc]) b.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%";
        li.append(bt, bc);
      }
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj(); pobierz(R.projekt, pelna).push(opis.nowy()); poZmianie();
    }, "+ Dodaj kartę");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.projekt, pelna), z, k));
    return pole;
  }

  function kolumnyKontaktu(opis, pelna) {
    const tab = pobierz(R.projekt, pelna) || [];
    const elementy = tab.map((c, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      li.style.flexDirection = "column"; li.style.alignItems = "stretch"; li.style.gap = "6px";
      const gora = document.createElement("div");
      gora.style.cssText = "display:flex;align-items:center;gap:6px";
      const uchwyt = document.createElement("span");
      uchwyt.className = "uchwyt"; uchwyt.textContent = "⠿";
      const podpis = document.createElement("span");
      podpis.className = "etykieta"; podpis.textContent = c.naglowek || "(bez nagłówka)";
      gora.append(uchwyt, podpis, guzik("✕", "Usuń kolumnę", () => {
        zapamietaj(); pobierz(R.projekt, pelna).splice(j, 1); poZmianie();
      }));
      const nag = wejscie(c.naglowek, "text", (v) => {
        pobierz(R.projekt, pelna)[j].naglowek = v; podpis.textContent = v || "(bez nagłówka)";
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      nag.placeholder = "Nagłówek kolumny";
      const wiersze = document.createElement("textarea");
      wiersze.value = (c.wiersze || []).join("\n");
      wiersze.placeholder = "Każda linia = osobny wiersz";
      wiersze.addEventListener("input", () => {
        pobierz(R.projekt, pelna)[j].wiersze = wiersze.value.split("\n");
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      const godziny = document.createElement("textarea");
      godziny.value = (c.godziny || []).map((g) => `${g.dzien} | ${g.zakres}`).join("\n");
      godziny.placeholder = "Godziny: Dzień | zakres (po jednym w linii)";
      godziny.addEventListener("input", () => {
        pobierz(R.projekt, pelna)[j].godziny = godziny.value.split("\n")
          .filter((w) => w.trim())
          .map((w) => { const [d, z = ""] = w.split("|"); return { dzien: d.trim(), zakres: z.trim() }; });
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      for (const el of [nag, wiersze, godziny])
        el.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%" +
          (el.tagName === "TEXTAREA" ? ";min-height:62px" : "");
      li.append(gora, nag, wiersze, godziny);
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj();
      pobierz(R.projekt, pelna).push({ naglowek: "Nowa kolumna", wiersze: [""], godziny: [] });
      poZmianie();
    }, "+ Dodaj kolumnę");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.projekt, pelna), z, k));
    return pole;
  }

  /* --------------------------------------------------------- zdjęcia */
  /* Zdjęcie z aparatu potrafi ważyć 6 MB. W projekcie siedzi jako tekst,
     więc bez zmniejszenia plik projektu robi się nie do wysłania.
     1600 px dłuższego boku wystarcza na ekrany o podwójnej gęstości. */
  async function zmniejsz(plik, maxPx = 1600, jakosc = 0.85) {
    const bitmapa = await createImageBitmap(plik);
    const skala = Math.min(1, maxPx / Math.max(bitmapa.width, bitmapa.height));
    const w = Math.round(bitmapa.width * skala), h = Math.round(bitmapa.height * skala);
    const plotno = Object.assign(document.createElement("canvas"), { width: w, height: h });
    plotno.getContext("2d").drawImage(bitmapa, 0, 0, w, h);
    bitmapa.close();
    return plotno.toDataURL("image/jpeg", jakosc);
  }

  function wybierzZdjecie(gotowe, wiele = false) {
    const i = document.createElement("input");
    i.type = "file"; i.accept = "image/*"; i.multiple = wiele;
    i.addEventListener("change", async () => {
      if (!i.files.length) return;
      powiedz("Przetwarzam zdjęcia…");
      const wyniki = [];
      for (const p of i.files) wyniki.push(await zmniejsz(p));
      gotowe(wiele ? wyniki : wyniki[0]);
      powiedz(`Dodano ${wyniki.length} ${wyniki.length === 1 ? "zdjęcie" : "zdjęcia"}.`);
    });
    i.click();
  }

  function polaZdjecia(opis, pelna) {
    const d = document.createElement("div");
    d.className = "pole";
    const l = document.createElement("label");
    l.textContent = opis.etykieta;
    d.append(l);
    const obecne = pobierz(R.projekt, pelna);
    if (obecne) {
      const img = document.createElement("img");
      img.className = "miniatura"; img.src = obecne; img.alt = "";
      d.append(img);
    }
    const rzad = document.createElement("div");
    rzad.className = "rzad";
    const wgraj = document.createElement("button");
    wgraj.className = "btn";
    wgraj.textContent = obecne ? "Zmień…" : "Wgraj…";
    wgraj.addEventListener("click", () => wybierzZdjecie((data) => {
      zapamietaj(); ustaw(R.projekt, pelna, data); poZmianie();
    }));
    const zdejmij = document.createElement("button");
    zdejmij.className = "btn";
    zdejmij.textContent = "Usuń";
    zdejmij.disabled = !obecne;
    zdejmij.addEventListener("click", () => {
      zapamietaj(); ustaw(R.projekt, pelna, null); poZmianie();
    });
    rzad.append(wgraj, zdejmij);
    d.append(rzad);
    return d;
  }

  function polaGalerii(opis, pelna) {
    const tab = pobierz(R.projekt, pelna) || [];
    const elementy = tab.map((z, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      const img = document.createElement("img");
      img.src = z; img.alt = "";
      img.style.cssText = "width:52px;height:38px;object-fit:cover;border-radius:4px";
      const podpis = document.createElement("span");
      podpis.className = "etykieta"; podpis.textContent = `Zdjęcie ${j + 1}`;
      li.append(document.createElement("span"), img, podpis, guzik("✕", "Usuń zdjęcie", () => {
        zapamietaj(); pobierz(R.projekt, pelna).splice(j, 1); poZmianie();
      }));
      li.firstChild.className = "uchwyt"; li.firstChild.textContent = "⠿";
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      wybierzZdjecie((lista) => {
        zapamietaj(); pobierz(R.projekt, pelna).push(...lista); poZmianie();
      }, true);
    }, "+ Wgraj zdjęcia…");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.projekt, pelna), z, k));
    return pole;
  }

  /* --------------------------------------------------------- panel motywu */
  const KOLORY = [
    ["tlo", "Tło strony"], ["pasKontakt", "Tło pasa kontaktu"], ["karta", "Tło kart"],
    ["tekst", "Tekst"], ["miekki", "Tekst drugorzędny"], ["kreska", "Kreski i obramowania"],
    ["akcent", "Tło za zdjęciem"],
  ];

  function wyborKroju(etykieta, klucz, kluczZapasowy) {
    const sel = document.createElement("select");
    const grupy = {};
    for (const k of window.KX_KROJE) (grupy[k.rodzaj] = grupy[k.rodzaj] || []).push(k);
    const nazwyGrup = { bezszeryfowy: "Bezszeryfowe", szeryfowy: "Szeryfowe", odreczny: "Odręczne" };
    for (const [rodzaj, lista] of Object.entries(grupy)) {
      const g = document.createElement("optgroup");
      g.label = nazwyGrup[rodzaj] || rodzaj;
      for (const k of lista) {
        const o = document.createElement("option");
        o.value = k.nazwa; o.textContent = k.nazwa;
        o.style.fontFamily = `"${k.nazwa}", ${k.zapasowy}`;
        g.append(o);
      }
      sel.append(g);
    }
    sel.value = R.projekt.motyw[klucz];
    sel.style.fontFamily = `"${sel.value}", sans-serif`;
    sel.addEventListener("change", () => {
      zapamietaj();
      const k = window.KX_KROJE.find((x) => x.nazwa === sel.value);
      R.projekt.motyw[klucz] = sel.value;
      R.projekt.motyw[kluczZapasowy] = k ? k.zapasowy : "sans-serif";
      sel.style.fontFamily = `"${sel.value}", sans-serif`;
      poZmianie();
    });
    return polePodpisane(etykieta, sel);
  }

  function rysujPanelMotywu() {
    const cel = $("#panelMotyw");
    cel.innerHTML = "";
    const m = R.projekt.motyw;

    cel.append(wyborKroju("Krój nagłówków", "krojNaglowki", "zapasowyNaglowki"));
    cel.append(wyborKroju("Krój tekstu", "krojProza", "zapasowyProza"));

    const proba = document.createElement("p");
    proba.className = "wskazowka";
    proba.style.cssText = "font-size:15px;line-height:1.5;color:#e8e8ea;background:#26262e;padding:10px;border-radius:6px";
    proba.innerHTML = `<span style="font-family:'${m.krojNaglowki}',sans-serif;font-weight:700;font-size:19px">Zażółć gęślą jaźń</span><br>` +
      `<span style="font-family:'${m.krojProza}',serif">Mąka, źdźbło, ćwierć — próba polskich znaków.</span>`;
    cel.append(proba);

    const suw = (etykieta, klucz, min, max, krok) => {
      const i = document.createElement("input");
      i.type = "number"; i.min = min; i.max = max; i.step = krok;
      i.value = m[klucz];
      i.addEventListener("change", () => {
        zapamietaj(); m[klucz] = Number(i.value); poZmianie();
      });
      return polePodpisane(etykieta, i);
    };
    const rzad = document.createElement("div");
    rzad.className = "rzad";
    rzad.append(suw("Wielkość tekstu", "skala", 0.85, 1.3, 0.05), suw("Interlinia", "interlinia", 1.3, 2.1, 0.05));
    cel.append(rzad);
    const rzad2 = document.createElement("div");
    rzad2.className = "rzad";
    rzad2.append(suw("Zaokrąglenie (px)", "zaokraglenie", 0, 28, 1), suw("Szerokość treści (px)", "szerokosc", 900, 1440, 20));
    cel.append(rzad2);

    cel.append(document.createElement("hr"));
    for (const [klucz, etykieta] of KOLORY) {
      const i = document.createElement("input");
      i.type = "color"; i.value = m.kolory[klucz];
      i.addEventListener("input", () => { m.kolory[klucz] = i.value; R.rysujPodglad(); });
      i.addEventListener("change", () => { zapamietaj(); R.Magazyn.zapisz(R.projekt); });
      cel.append(polePodpisane(etykieta, i));
    }

    cel.append(document.createElement("hr"));
    const meta = (etykieta, klucz) => {
      const i = wejscie(R.projekt.meta[klucz], "text", (v) => {
        R.projekt.meta[klucz] = v; R.Magazyn.zapisz(R.projekt);
      });
      return polePodpisane(etykieta, i);
    };
    cel.append(meta("Tytuł strony (karta przeglądarki)", "tytul"));
    cel.append(meta("Opis dla wyszukiwarek", "opis"));
  }

  /* --------------------------------------------------------- wybór grafiki */
  let sciezkaIkony = null;

  function otworzWyborIkony(sciezka) {
    sciezkaIkony = sciezka;
    $("#szukajIkony").value = "";
    rysujIkony("");
    $("#oknoIkon").setAttribute("open", "");
    $("#szukajIkony").focus();
  }
  function zamknijIkony() {
    $("#oknoIkon").removeAttribute("open");
    sciezkaIkony = null;
  }

  function rysujIkony(fraza) {
    const cel = $("#cialoIkon");
    cel.innerHTML = "";
    const f = fraza.trim().toLowerCase();
    const obecna = sciezkaIkony ? pobierz(R.projekt, sciezkaIkony) : null;
    let cokolwiek = false;

    for (const [grupa, tytul] of Object.entries(window.KX_IKONY.grupy)) {
      const lista = window.KX_IKONY.lista.filter((i) =>
        i.grupa === grupa && (!f || i.nazwa.toLowerCase().includes(f) || i.id.includes(f)));
      if (!lista.length) continue;
      cokolwiek = true;
      const h = document.createElement("h3");
      h.textContent = tytul;
      const siatka = document.createElement("div");
      siatka.className = "siatka-ikon";
      for (const i of lista) {
        const b = document.createElement("button");
        b.setAttribute("aria-pressed", String(i.id === obecna));
        b.innerHTML = window.KX_STRONA.ikona(i.id) + `<span>${i.nazwa}</span>`;
        b.addEventListener("click", () => {
          zapamietaj(); ustaw(R.projekt, sciezkaIkony, i.id); zamknijIkony(); poZmianie();
        });
        siatka.append(b);
      }
      cel.append(h, siatka);
    }
    if (!cokolwiek) cel.innerHTML = '<p class="pusty">Nic nie pasuje do tej frazy.</p>';
  }

  /* --------------------------------------------------------- pliki */
  function pobierzPlik(nazwa, tresc, typ) {
    const blob = new Blob([tresc], { type: typ });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nazwa;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function nowyId() { return "s-" + Math.random().toString(36).slice(2, 9); }

  /* --------------------------------------------------------- start */
  function podepnijZdarzenia() {
    $("#cofnij").addEventListener("click", R.cofnij);
    $("#ponow").addEventListener("click", R.ponow);

    document.addEventListener("keydown", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== "z") return;
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      e.preventDefault();
      e.shiftKey ? R.ponow() : R.cofnij();
    });

    $$(".grupa [data-widok]").forEach((b) => b.addEventListener("click", () => {
      $$(".grupa [data-widok]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $("#scena").dataset.widok = b.dataset.widok;
    }));

    $$(".zakladki [data-zakladka]").forEach((b) => b.addEventListener("click", () => {
      $$(".zakladki [data-zakladka]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $("#panelElement").hidden = b.dataset.zakladka !== "element";
      $("#panelMotyw").hidden = b.dataset.zakladka !== "motyw";
    }));

    /* lista sekcji */
    const lista = $("#listaSekcji");
    lista.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const idx = Number(li.dataset.idx);
      const akcja = e.target.closest("[data-akcja]")?.dataset.akcja;
      if (akcja === "oko") {
        zapamietaj();
        R.projekt.sekcje[idx].widoczna = R.projekt.sekcje[idx].widoczna === false;
        poZmianie();
        return;
      }
      if (akcja === "skasuj") {
        const s = R.projekt.sekcje[idx];
        if (!confirm(`Usunąć sekcję „${R.NAZWY_TYPOW[s.typ] || s.typ}"? Tego nie cofnie autozapis, ale cofnie Ctrl+Z.`)) return;
        zapamietaj();
        R.projekt.sekcje.splice(idx, 1);
        if (R.zaznaczona === s.id) R.zaznaczona = null;
        poZmianie();
        return;
      }
      R.zaznaczona = R.projekt.sekcje[idx].id;
      R.zaznaczonaKarta = null;
      poZmianie();
    });
    R.wlaczPrzeciaganie(lista, "li", (z, k) => R.przestaw(R.projekt.sekcje, z, k));

    /* dodawanie sekcji */
    const wybor = $("#nowaSekcja");
    for (const [typ, nazwa] of Object.entries(R.NAZWY_TYPOW)) {
      const o = document.createElement("option");
      o.value = typ; o.textContent = nazwa;
      wybor.append(o);
    }
    wybor.addEventListener("change", () => {
      if (!wybor.value) return;
      zapamietaj();
      const nowa = Object.assign({ id: nowyId(), widoczna: true }, SZABLONY[wybor.value]());
      const gdzie = R.projekt.sekcje.findIndex((s) => s.id === R.zaznaczona);
      R.projekt.sekcje.splice(gdzie < 0 ? R.projekt.sekcje.length : gdzie + 1, 0, nowa);
      R.zaznaczona = nowa.id;
      wybor.value = "";
      poZmianie();
      powiedz("Sekcja dodana.");
    });

    /* okno grafik */
    $("#zamknijIkony").addEventListener("click", zamknijIkony);
    $("#oknoIkon").addEventListener("click", (e) => { if (e.target.id === "oknoIkon") zamknijIkony(); });
    $("#szukajIkony").addEventListener("input", (e) => rysujIkony(e.target.value));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#oknoIkon").hasAttribute("open")) zamknijIkony();
    });

    /* wejście i wyjście */
    $("#pobierzProjekt").addEventListener("click", () => {
      pobierzPlik("projekt-strony.json", JSON.stringify(R.projekt, null, 2), "application/json");
      powiedz("Projekt pobrany — to jest plik do odesłania.");
    });

    $("#pobierzStrone").addEventListener("click", () => {
      pobierzPlik("index.html", window.KX_STRONA.dokument(R.projekt), "text/html");
      powiedz("Strona pobrana. Podmień index.html w repozytorium.");
    });

    $("#wczytaj").addEventListener("click", () => $("#plikProjektu").click());
    $("#plikProjektu").addEventListener("change", async (e) => {
      const plik = e.target.files[0];
      if (!plik) return;
      try {
        const wczytany = JSON.parse(await plik.text());
        if (!wczytany || !Array.isArray(wczytany.sekcje)) throw new Error("zły kształt");
        zapamietaj();
        R.projekt = wczytany;
        R.zaznaczona = null; R.zaznaczonaKarta = null;
        poZmianie();
        powiedz("Projekt wczytany.");
      } catch (err) {
        alert("Nie udało się wczytać tego pliku — to nie wygląda na projekt strony.");
      }
      e.target.value = "";
    });

    $("#odNowa").addEventListener("click", async () => {
      if (!confirm("Wrócić do stanu wyjściowego? Cała praca w przeglądarce przepadnie.\n\nJeśli chcesz ją zachować, najpierw kliknij „Pobierz projekt\".")) return;
      zapamietaj();
      R.projekt = klon(window.KX_PROJEKT_DOMYSLNY);
      R.zaznaczona = null; R.zaznaczonaKarta = null;
      await R.Magazyn.skasuj();
      poZmianie();
      powiedz("Wrócono do stanu wyjściowego.");
    });
  }

  R.podepnij({ rysujPanelElementu, rysujPanelMotywu, otworzWyborIkony, wybierzZdjecie });

  (async function start() {
    const zapisany = await R.Magazyn.wczytaj();
    if (zapisany) {
      try {
        const p = JSON.parse(zapisany);
        if (p && Array.isArray(p.sekcje)) { R.projekt = p; powiedz("Wczytano poprzednią pracę."); }
      } catch (e) { /* uszkodzony zapis — startujemy od domyślnego */ }
    }
    podepnijZdarzenia();
    poZmianie();
  })();
})();
