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
  let rysujSpisStron = () => {};
  let rysujPanelMotywu = () => {};
  let otworzWyborIkony = () => {};
  let wybierzZdjecie = () => {};

  /* --------------------------------------------------------- stan */
  let projekt = klon(window.KX_PROJEKT_DOMYSLNY);
  let idxStrony = 0;
  /* Ścieżki pól ("sekcje.2.tytul") są liczone względem STRONY, nie projektu.
     Dzięki temu generator i panel ustawień nie muszą wiedzieć, na której
     stronie stoimy — rozstrzyga to jedna funkcja. */
  const strona = () => projekt.strony[idxStrony];

  /* Projekt zapisany w wersji 1 miał jedną listę sekcji. Wpuszczamy go
     dalej zamiast wyrzucać — czyjaś praca nie ma przepadać przez zmianę
     kształtu pliku. */
  function uwspolczesnij(p) {
    if (!p || typeof p !== "object") return null;
    if (Array.isArray(p.strony)) return p;
    if (Array.isArray(p.sekcje)) {
      return { wersja: 2, meta: p.meta || { tytul: "", opis: "" }, motyw: p.motyw,
        strony: [{ id: "glowna", nazwa: "Strona główna", plik: "index.html",
                   tytul: "", opis: "", sekcje: p.sekcje }] };
    }
    return null;
  }
  let zaznaczona = null;   // id sekcji
  let zaznaczonaKarta = null; // "indeksSekcji.indeksKarty"
  let zaznaczonyBlok = null;  // "indeksSekcji.indeksBloku" na płótnie
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

    /* Bloki płótna. Uchwyt przesuwania i róg rozciągania dokłada redaktor
       do drzewa W RAMCE, a nie generator — gotowa strona nie ma o nich
       pojęcia. Dlatego też chwyta się za uchwyt, nie za sam blok: kliknięcie
       w blok tekstowy ma stawiać kursor, bo tekst pisze się w miejscu. */
    [data-blok]{outline:1px dashed rgba(110,168,254,.3);outline-offset:3px;position:relative}
    [data-blok].kx-wybrany{outline:2px solid #6ea8fe}
    /* Dwie rzeczy, bez których uchwyty kradną kliknięcia sąsiadom:
       1. pointer-events:none, dopóki są niewidoczne — element o zerowej
          przezroczystości NADAL łapie wskaźnik, więc niewidoczne kółko
          sąsiedniego bloku przechwytywało klik w bloku obok;
       2. położenie WEWNĄTRZ obrysu bloku, nie na ujemnych odsunięciach —
          uchwyt wystający poza blok leży na cudzym terytorium, a przy
          blokach stykających się bokami zawsze wygrywa ten narysowany
          później. */
    .kx-uchwyt,.kx-rozciag{position:absolute;z-index:6;opacity:0;pointer-events:none;
      transition:opacity .12s ease}
    .kx-uchwyt{top:3px;left:3px;width:23px;height:23px;border-radius:50%;background:#6ea8fe;
      color:#0c1220;font-size:12px;line-height:23px;text-align:center;cursor:grab;user-select:none;
      box-shadow:0 1px 4px rgba(0,0,0,.3)}
    .kx-rozciag{right:3px;bottom:3px;width:17px;height:17px;border-radius:4px;
      background:#f0b429;cursor:nwse-resize;box-shadow:0 1px 4px rgba(0,0,0,.3)}
    [data-blok]:hover .kx-uchwyt,[data-blok]:hover .kx-rozciag,
    [data-blok].kx-wybrany .kx-uchwyt,[data-blok].kx-wybrany .kx-rozciag{opacity:1;pointer-events:auto}
    .kx-ciagniemy,.kx-ciagniemy *{cursor:grabbing !important;user-select:none !important}
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
      window.KX_STRONA.html(strona(), "edytor") +
      "</body></html>"
    );
    d.close();
    podepnijRamke(d);
    dolozUchwyty(d);
    podepnijPrzesuwanie(d);
    odswiezWybor(d);
  }

  function odswiezWybor(d) {
    d = d || $("#ramka").contentDocument;
    $$("[data-sekcja]", d).forEach((el) =>
      el.classList.toggle("kx-wybrana", el.dataset.sekcja === zaznaczona));
    $$("[data-karta]", d).forEach((el) =>
      el.classList.toggle("kx-wybrana-karta", el.dataset.karta === zaznaczonaKarta));
    $$("[data-blok]", d).forEach((el) =>
      el.classList.toggle("kx-wybrany", el.dataset.blok === zaznaczonyBlok));
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

      const blok = e.target.closest("[data-blok]");
      if (sekcja) {
        zaznaczona = sekcja.dataset.sekcja;
        zaznaczonaKarta = karta ? karta.dataset.karta : null;
        zaznaczonyBlok = blok ? blok.dataset.blok : null;
        rysujListeSekcji();
        rysujPanelElementu();
        odswiezWybor(d);
      }
      if (gniazdo && gniazdo.dataset.gniazdo === "ikona") {
        otworzWyborIkony(gniazdo.dataset.sciezka);
      }
      if (gniazdo && gniazdo.dataset.gniazdo === "blok-zdjecie") {
        const sciezka = gniazdo.dataset.sciezka;
        wybierzZdjecie((dataURL) => {
          zapamietaj();
          ustaw(strona(), sciezka, dataURL);
          poZmianie();
        });
      }
      if (gniazdo && gniazdo.dataset.gniazdo === "zdjecie") {
        const idx = gniazdo.dataset.sekcjaIdx;
        wybierzZdjecie((dataURL) => {
          zapamietaj();
          strona().sekcje[idx].zdjecie = dataURL;
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
      ustaw(strona(), p.dataset.pole, p.textContent);
      zapiszPozniej();
    });
  }


  /* ------------------------------------------------- przesuwanie bloków */
  /* Uchwyty dokładamy do drzewa W RAMCE po każdym przerysowaniu. Nie
     wchodzą do generatora, więc gotowa strona ich nie zna. */
  function dolozUchwyty(d) {
    for (const blok of d.querySelectorAll("[data-blok]")) {
      if (blok.querySelector(".kx-uchwyt")) continue;
      const u = d.createElement("div");
      u.className = "kx-uchwyt"; u.textContent = "✥"; u.title = "Przeciągnij, żeby przesunąć";
      const r = d.createElement("div");
      r.className = "kx-rozciag"; r.title = "Przeciągnij, żeby zmienić rozmiar";
      blok.append(u, r);
    }
  }

  let gest = null;

  function podepnijPrzesuwanie(d) {
    d.addEventListener("pointerdown", (e) => {
      const uchwyt = e.target.closest(".kx-uchwyt, .kx-rozciag");
      if (!uchwyt) return;
      e.preventDefault();

      const blok = uchwyt.closest("[data-blok]");
      const plotno = blok.closest(".plotno");
      if (!plotno) return;

      const [is, ib] = blok.dataset.blok.split(".").map(Number);
      const sek = strona().sekcje[is];
      const b = sek.bloki[ib];

      /* Krok siatki: szerokość kolumny plus przerwa. Liczony z układu,
         a nie z założeń — płótno ma marginesy wewnętrzne i przerwę
         ustawialną przez użytkownika. */
      const st = d.defaultView.getComputedStyle(plotno);
      const prost = plotno.getBoundingClientRect();
      const lukaX = parseFloat(st.columnGap) || 0;
      const lukaY = parseFloat(st.rowGap) || 0;
      const uzyteczna = prost.width - (parseFloat(st.paddingLeft) || 0) - (parseFloat(st.paddingRight) || 0);

      gest = {
        rozciaganie: uchwyt.classList.contains("kx-rozciag"),
        is, ib, blok,
        startX: e.clientX, startY: e.clientY,
        x0: b.x, y0: b.y, w0: b.w, h0: b.h,
        krokX: (uzyteczna + lukaX) / 12,
        krokY: (sek.rzad || 44) + lukaY,
      };
      zaznaczonyBlok = blok.dataset.blok;
      zaznaczona = blok.closest("[data-sekcja]").dataset.sekcja;
      odswiezWybor(d);
      d.body.classList.add("kx-ciagniemy");
      uchwyt.setPointerCapture(e.pointerId);
      zapamietaj();
    });

    d.addEventListener("pointermove", (e) => {
      if (!gest) return;
      const dx = Math.round((e.clientX - gest.startX) / gest.krokX);
      const dy = Math.round((e.clientY - gest.startY) / gest.krokY);
      const b = strona().sekcje[gest.is].bloki[gest.ib];

      if (gest.rozciaganie) {
        b.w = Math.max(1, Math.min(12 - b.x, gest.w0 + dx));
        b.h = Math.max(1, gest.h0 + dy);
      } else {
        b.x = Math.max(0, Math.min(12 - gest.w0, gest.x0 + dx));
        b.y = Math.max(0, gest.y0 + dy);
      }
      /* Przesuwamy sam styl, bez przerysowania dokumentu — inaczej blok
         znikałby spod kursora przy każdym ruchu myszy. */
      gest.blok.style.gridColumn = (b.x + 1) + "/span " + b.w;
      gest.blok.style.gridRow = (b.y + 1) + "/span " + b.h;
    });

    const koniec = () => {
      if (!gest) return;
      gest.blok.ownerDocument.body.classList.remove("kx-ciagniemy");
      gest = null;
      poZmianie();
    };
    d.addEventListener("pointerup", koniec);
    d.addEventListener("pointercancel", koniec);
  }

  /* --------------------------------------------------------- lista sekcji */
  const NAZWY_TYPOW = {
    pasek: "Pasek menu", hero: "Powitanie", filary: "Filary pracy",
    formy: "Karty oferty", tekst: "Blok tekstu", cytat: "Cytat",
    galeria: "Galeria zdjęć", cta: "Wezwanie do kontaktu",
    kontakt: "Kontakt", stopka: "Stopka",
    plotno: "Swobodne płótno", cennik: "Cennik",
  };

  function opisSekcji(s) {
    const t = NAZWY_TYPOW[s.typ] || s.typ;
    const wlasny = s.tytul || s.tresc || (s.typ === "hero" ? s.tytul : "");
    return wlasny && String(wlasny).trim() ? `${t} — ${String(wlasny).slice(0, 22)}` : t;
  }

  function rysujListeSekcji() {
    const ul = $("#listaSekcji");
    ul.innerHTML = "";
    strona().sekcje.forEach((s, i) => {
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
    rysujSpisStron();
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
    get zaznaczonyBlok() { return zaznaczonyBlok; },
    set zaznaczonyBlok(v) { zaznaczonyBlok = v; },
    get idxStrony() { return idxStrony; },
    set idxStrony(v) { idxStrony = v; },
    strona, uwspolczesnij,
    $, $$, pobierz, ustaw, klon, powiedz, zapamietaj, poZmianie, cofnij, ponow,
    rysujPodglad, rysujListeSekcji, wlaczPrzeciaganie, przestaw, Magazyn,
    NAZWY_TYPOW, historia,
    podepnij(f) {
      if (f.rysujPanelElementu) rysujPanelElementu = f.rysujPanelElementu;
      if (f.rysujSpisStron) rysujSpisStron = f.rysujSpisStron;
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
    plotno: () => ({ typ: "plotno", odstep: "zwykly", rzad: 44, luka: 14, wysokosc: 8, bloki: [
      { rodzaj: "naglowek", x: 0, y: 0, w: 7, h: 2, tresc: "Nagłówek", wielkosc: 2.2 },
      { rodzaj: "tekst", x: 0, y: 2, w: 7, h: 3, tresc: "Tekst do przesunięcia gdziekolwiek." },
      { rodzaj: "zdjecie", x: 8, y: 0, w: 4, h: 5, zdjecie: null, opis: "" },
    ] }),
    cennik: () => ({ typ: "cennik", odstep: "zwykly", tytul: "Cennik", wyrownanieTytulu: "srodek",
      pozycje: [{ nazwa: "Nazwa usługi", kwota: "000 zł" }], uwagi: [] }),
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
    plotno: [
      { typ: "bloki", sciezka: "bloki", etykieta: "Bloki na płótnie" },
      { typ: "rozdzielacz" },
      { typ: "liczba", sciezka: "wysokosc", etykieta: "Wysokość płótna (rzędy)", min: 3, max: 40, krok: 1 },
      { typ: "liczba", sciezka: "rzad", etykieta: "Wysokość rzędu (px)", min: 20, max: 90, krok: 2 },
      { typ: "liczba", sciezka: "luka", etykieta: "Przerwa między blokami (px)", min: 0, max: 40, krok: 2 },
      ODSTEP,
    ],
    cennik: [
      { typ: "tekst", sciezka: "tytul", etykieta: "Tytuł sekcji" }, TYTUL_POZ,
      { typ: "listaObiektow", sciezka: "pozycje", etykieta: "Pozycje cennika",
        pola: [["nazwa", "Nazwa usługi"], ["kwota", "Kwota"]],
        nowy: () => ({ nazwa: "Nowa pozycja", kwota: "000 zł" }) },
      { typ: "listaProsta", sciezka: "uwagi", etykieta: "Uwagi pod cennikiem",
        nowy: () => "Nowa uwaga." },
      ODSTEP,
    ],
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

    const idx = R.strona().sekcje.findIndex((s) => s.id === R.zaznaczona);
    if (idx < 0) {
      cel.innerHTML = '<p class="pusty">Kliknij dowolny fragment strony w podglądzie, ' +
        'żeby go tu ustawić.<br><br>W podglądzie możesz też pisać wprost po tekście — ' +
        'zmiany zapisują się same.</p>';
      return;
    }
    const s = R.strona().sekcje[idx];
    const baza = `sekcje.${idx}`;

    const tytulik = document.createElement("h2");
    tytulik.style.cssText = "position:static;padding:0 0 10px";
    tytulik.textContent = R.NAZWY_TYPOW[s.typ] || s.typ;
    cel.append(tytulik);

    for (const opis of USTAWIENIA[s.typ] || []) {
      const el = rysujKontrolke(opis, s, baza, idx);
      if (el) cel.append(el);
    }

    /* Tło sekcji dotyczy każdego typu, więc nie powtarzamy go w opisach.
       Pusta wartość znaczy „bez własnego tła" — sekcja bierze tło strony. */
    cel.append(document.createElement("hr"));
    const kolorTla = document.createElement("input");
    kolorTla.type = "color";
    kolorTla.value = s.tloSekcji || R.projekt.motyw.kolory.tlo;
    kolorTla.addEventListener("input", () => {
      s.tloSekcji = kolorTla.value; R.rysujPodglad();
    });
    kolorTla.addEventListener("change", () => { zapamietaj(); R.Magazyn.zapisz(R.projekt); });
    cel.append(polePodpisane("Własne tło sekcji", kolorTla));
    const zdejmijTlo = document.createElement("button");
    zdejmijTlo.className = "btn";
    zdejmijTlo.style.width = "100%";
    zdejmijTlo.textContent = "Bez własnego tła";
    zdejmijTlo.disabled = !s.tloSekcji;
    zdejmijTlo.addEventListener("click", () => { zapamietaj(); delete s.tloSekcji; poZmianie(); });
    cel.append(zdejmijTlo);
  }

  function rysujKontrolke(opis, s, baza, idx) {
    const pelna = `${baza}.${opis.sciezka || ""}`;

    if (opis.typ === "rozdzielacz") return document.createElement("hr");

    if (opis.typ === "tekst" || opis.typ === "obszar") {
      const el = document.createElement(opis.typ === "obszar" ? "textarea" : "input");
      if (opis.typ !== "obszar") el.type = "text";
      el.value = pobierz(R.strona(), pelna) ?? "";
      let pierwsza = true;
      el.addEventListener("input", () => {
        if (pierwsza) { zapamietaj(); pierwsza = false; }
        ustaw(R.strona(), pelna, el.value);
        R.rysujPodglad(); R.rysujListeSekcji(); R.Magazyn.zapisz(R.projekt);
      });
      el.addEventListener("blur", () => { pierwsza = true; });
      return polePodpisane(opis.etykieta, el);
    }

    if (opis.typ === "liczba") {
      const el = wejscie(pobierz(R.strona(), pelna), "number", (v) => {
        ustaw(R.strona(), pelna, Number(v)); R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
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
      sel.value = String(pobierz(R.strona(), pelna) ?? opis.opcje[0][0]);
      sel.addEventListener("change", () => {
        zapamietaj();
        ustaw(R.strona(), pelna, opis.liczba ? Number(sel.value) : sel.value);
        poZmianie();
      });
      return polePodpisane(opis.etykieta, sel);
    }

    if (opis.typ === "przelacznik") {
      const d = document.createElement("div");
      d.className = "przel";
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = pobierz(R.strona(), pelna) !== false;
      i.id = "p-" + Math.random().toString(36).slice(2, 8);
      const l = document.createElement("label");
      l.htmlFor = i.id; l.textContent = opis.etykieta;
      i.addEventListener("change", () => { zapamietaj(); ustaw(R.strona(), pelna, i.checked); poZmianie(); });
      d.append(i, l);
      return d;
    }

    if (opis.typ === "zdjecie") return polaZdjecia(opis, pelna);
    if (opis.typ === "galeria") return polaGalerii(opis, pelna);
    if (opis.typ === "listaProsta") return listaProsta(opis, pelna);
    if (opis.typ === "listaObiektow") return listaObiektow(opis, pelna);
    if (opis.typ === "karty") return listaKart(opis, pelna, idx);
    if (opis.typ === "kolumnyKontaktu") return kolumnyKontaktu(opis, pelna);
    if (opis.typ === "bloki") return listaBlokow(opis, pelna);
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
    const tab = pobierz(R.strona(), pelna) || [];
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
        const t = pobierz(R.strona(), pelna); t[j] = ta.value;
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      ta.addEventListener("blur", () => { pierwsza = true; });
      li.append(ta, guzik("✕", "Usuń akapit", () => {
        zapamietaj(); pobierz(R.strona(), pelna).splice(j, 1); poZmianie();
      }));
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj(); pobierz(R.strona(), pelna).push(opis.nowy()); poZmianie();
    }, "+ Dodaj akapit");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.strona(), pelna), z, k));
    return pole;
  }

  function listaObiektow(opis, pelna) {
    const tab = pobierz(R.strona(), pelna) || [];
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
        zapamietaj(); pobierz(R.strona(), pelna).splice(j, 1); poZmianie();
      }));
      li.append(gora);
      for (const [klucz, etykieta] of opis.pola) {
        const i = wejscie(o[klucz], "text", (v) => {
          pobierz(R.strona(), pelna)[j][klucz] = v;
          podpis.textContent = pobierz(R.strona(), pelna)[j][opis.pola[0][0]] || "(bez napisu)";
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        i.placeholder = etykieta;
        i.style.cssText = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%";
        li.append(i);
      }
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      zapamietaj(); pobierz(R.strona(), pelna).push(opis.nowy()); poZmianie();
    });
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.strona(), pelna), z, k));
    return pole;
  }

  function listaKart(opis, pelna, idxSekcji) {
    const tab = pobierz(R.strona(), pelna) || [];
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
        zapamietaj(); pobierz(R.strona(), pelna).splice(j, 1); poZmianie();
      }));
      li.append(gora);

      const nazwa = wejscie(c.nazwa, "text", (v) => {
        pobierz(R.strona(), pelna)[j].nazwa = v; podpis.textContent = v || "(bez nazwy)";
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
        pobierz(R.strona(), pelna)[j].tekst = tresc.value;
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      tresc.addEventListener("blur", () => { pierwsza = true; });
      li.append(nazwa, tresc);

      if (opis.zPrzyciskiem) {
        const bt = wejscie(c.przycisk?.tekst, "text", (v) => {
          const k = pobierz(R.strona(), pelna)[j];
          k.przycisk = k.przycisk || { tekst: "", cel: "#" }; k.przycisk.tekst = v;
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        bt.placeholder = "Napis przycisku (pusty = brak)";
        const bc = wejscie(c.przycisk?.cel, "text", (v) => {
          const k = pobierz(R.strona(), pelna)[j];
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
      zapamietaj(); pobierz(R.strona(), pelna).push(opis.nowy()); poZmianie();
    }, "+ Dodaj kartę");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.strona(), pelna), z, k));
    return pole;
  }

  function kolumnyKontaktu(opis, pelna) {
    const tab = pobierz(R.strona(), pelna) || [];
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
        zapamietaj(); pobierz(R.strona(), pelna).splice(j, 1); poZmianie();
      }));
      const nag = wejscie(c.naglowek, "text", (v) => {
        pobierz(R.strona(), pelna)[j].naglowek = v; podpis.textContent = v || "(bez nagłówka)";
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      nag.placeholder = "Nagłówek kolumny";
      const wiersze = document.createElement("textarea");
      wiersze.value = (c.wiersze || []).join("\n");
      wiersze.placeholder = "Każda linia = osobny wiersz";
      wiersze.addEventListener("input", () => {
        pobierz(R.strona(), pelna)[j].wiersze = wiersze.value.split("\n");
        R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
      });
      const godziny = document.createElement("textarea");
      godziny.value = (c.godziny || []).map((g) => `${g.dzien} | ${g.zakres}`).join("\n");
      godziny.placeholder = "Godziny: Dzień | zakres (po jednym w linii)";
      godziny.addEventListener("input", () => {
        pobierz(R.strona(), pelna)[j].godziny = godziny.value.split("\n")
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
      pobierz(R.strona(), pelna).push({ naglowek: "Nowa kolumna", wiersze: [""], godziny: [] });
      poZmianie();
    }, "+ Dodaj kolumnę");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.strona(), pelna), z, k));
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
    const obecne = pobierz(R.strona(), pelna);
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
      zapamietaj(); ustaw(R.strona(), pelna, data); poZmianie();
    }));
    const zdejmij = document.createElement("button");
    zdejmij.className = "btn";
    zdejmij.textContent = "Usuń";
    zdejmij.disabled = !obecne;
    zdejmij.addEventListener("click", () => {
      zapamietaj(); ustaw(R.strona(), pelna, null); poZmianie();
    });
    rzad.append(wgraj, zdejmij);
    d.append(rzad);
    return d;
  }

  function polaGalerii(opis, pelna) {
    const tab = pobierz(R.strona(), pelna) || [];
    const elementy = tab.map((z, j) => {
      const li = document.createElement("li");
      li.draggable = true; li.dataset.idx = j;
      const img = document.createElement("img");
      img.src = z; img.alt = "";
      img.style.cssText = "width:52px;height:38px;object-fit:cover;border-radius:4px";
      const podpis = document.createElement("span");
      podpis.className = "etykieta"; podpis.textContent = `Zdjęcie ${j + 1}`;
      li.append(document.createElement("span"), img, podpis, guzik("✕", "Usuń zdjęcie", () => {
        zapamietaj(); pobierz(R.strona(), pelna).splice(j, 1); poZmianie();
      }));
      li.firstChild.className = "uchwyt"; li.firstChild.textContent = "⠿";
      return li;
    });
    const { pole, ul } = ramkaListy(opis.etykieta, elementy, () => {
      wybierzZdjecie((lista) => {
        zapamietaj(); pobierz(R.strona(), pelna).push(...lista); poZmianie();
      }, true);
    }, "+ Wgraj zdjęcia…");
    R.wlaczPrzeciaganie(ul, "li", (z, k) => R.przestaw(pobierz(R.strona(), pelna), z, k));
    return pole;
  }

  /* --------------------------------------------------------- spis stron */
  function rysujStrony() {
    const ul = $("#listaStron");
    ul.innerHTML = "";
    R.projekt.strony.forEach((st, i) => {
      const li = document.createElement("li");
      li.dataset.idx = i;
      li.setAttribute("aria-selected", String(i === R.idxStrony));
      const nazwa = document.createElement("span");
      nazwa.style.cssText = "flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
      nazwa.textContent = st.nazwa;
      const plik = document.createElement("span");
      plik.className = "plik";
      plik.textContent = st.plik;
      li.append(nazwa, plik);
      /* Strony głównej nie da się skasować — bez index.html nie ma witryny. */
      if (i > 0) {
        li.append(guzik("✕", "Usuń podstronę", (e) => {
          e.stopPropagation();
          if (!confirm(`Usunąć podstronę „${st.nazwa}"? Cofnie to Ctrl+Z.`)) return;
          zapamietaj();
          R.projekt.strony.splice(i, 1);
          if (R.idxStrony >= R.projekt.strony.length) R.idxStrony = R.projekt.strony.length - 1;
          R.zaznaczona = null; R.zaznaczonaKarta = null; R.zaznaczonyBlok = null;
          poZmianie();
        }));
      }
      li.addEventListener("click", () => {
        if (i === R.idxStrony) return;
        R.idxStrony = i;
        R.zaznaczona = null; R.zaznaczonaKarta = null; R.zaznaczonyBlok = null;
        poZmianie();
      });
      ul.append(li);
    });
  }

  /* --------------------------------------------------------- bloki płótna */
  const RODZAJE_BLOKU = {
    naglowek: "Nagłówek", tekst: "Tekst", zdjecie: "Miejsce na zdjęcie",
    grafika: "Grafika", przycisk: "Przycisk",
  };

  function nowyBlok(rodzaj) {
    const wspolne = { rodzaj, x: 0, y: 0, w: 6, h: 2, wyrownanie: "left" };
    if (rodzaj === "naglowek") return { ...wspolne, tresc: "Nowy nagłówek", wielkosc: 2 };
    if (rodzaj === "tekst") return { ...wspolne, h: 3, tresc: "Nowy tekst.", wielkosc: 1 };
    if (rodzaj === "zdjecie") return { ...wspolne, w: 4, h: 5, zdjecie: null, opis: "" };
    if (rodzaj === "grafika") return { ...wspolne, w: 3, h: 3, ikona: "serce" };
    return { ...wspolne, w: 4, h: 1, tresc: "nowy przycisk", cel: "#" };
  }

  function listaBlokow(opis, pelna) {
    const tab = pobierz(R.strona(), pelna) || [];
    const male = "background:#16161a;border:1px solid #33333d;border-radius:5px;padding:6px 8px;width:100%";

    const elementy = tab.map((b, j) => {
      const li = document.createElement("li");
      li.dataset.idx = j;
      li.style.flexDirection = "column";
      li.style.alignItems = "stretch";
      li.style.gap = "6px";
      const [isek] = pelna.split(".").slice(1, 2).map(Number);
      const klucz = isek + "." + j;
      if (R.zaznaczonyBlok === klucz) li.style.borderColor = "#6ea8fe";

      const gora = document.createElement("div");
      gora.style.cssText = "display:flex;align-items:center;gap:8px";
      const znacznik = document.createElement("span");
      znacznik.textContent = RODZAJE_BLOKU[b.rodzaj] || b.rodzaj;
      znacznik.style.cssText = "font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#9a9aa6";
      const podpis = document.createElement("button");
      podpis.className = "etykieta";
      podpis.style.cssText = "background:transparent;border:0;color:inherit;text-align:left;padding:0;cursor:pointer";
      podpis.textContent = b.tresc || (b.zdjecie ? "(zdjęcie)" : b.ikona ? b.ikona : "(pusty)");
      podpis.title = "Pokaż w podglądzie";
      podpis.addEventListener("click", () => {
        R.zaznaczonyBlok = klucz;
        R.rysujPodglad();
        rysujPanelElementu();
      });
      gora.append(znacznik, podpis, guzik("✕", "Usuń blok", () => {
        zapamietaj();
        pobierz(R.strona(), pelna).splice(j, 1);
        if (R.zaznaczonyBlok === klucz) R.zaznaczonyBlok = null;
        poZmianie();
      }));
      li.append(gora);

      /* Treść — zależnie od rodzaju bloku. */
      if (b.rodzaj === "zdjecie") {
        if (b.zdjecie) {
          const img = document.createElement("img");
          img.className = "miniatura"; img.src = b.zdjecie; img.alt = "";
          img.style.marginBottom = "0";
          li.append(img);
        }
        const rzad = document.createElement("div");
        rzad.className = "rzad";
        const wgraj = document.createElement("button");
        wgraj.className = "btn";
        wgraj.textContent = b.zdjecie ? "Zmień…" : "Wgraj…";
        wgraj.addEventListener("click", () => wybierzZdjecie((data) => {
          zapamietaj(); pobierz(R.strona(), pelna)[j].zdjecie = data; poZmianie();
        }));
        const usun = document.createElement("button");
        usun.className = "btn"; usun.textContent = "Usuń"; usun.disabled = !b.zdjecie;
        usun.addEventListener("click", () => {
          zapamietaj(); pobierz(R.strona(), pelna)[j].zdjecie = null; poZmianie();
        });
        rzad.append(wgraj, usun);
        li.append(rzad);
      } else if (b.rodzaj === "grafika") {
        const wybierz = document.createElement("button");
        wybierz.className = "btn";
        wybierz.style.cssText = "width:100%;display:flex;align-items:center;justify-content:center;gap:8px";
        wybierz.innerHTML = '<span class="podglad-ikony" style="width:22px;height:22px">' +
          (window.KX_STRONA.ikona(b.ikona) || "") + "</span><span>Zmień grafikę…</span>";
        wybierz.addEventListener("click", () => otworzWyborIkony(pelna + "." + j + ".ikona"));
        li.append(wybierz);
      } else {
        const ta = document.createElement("textarea");
        ta.value = b.tresc || "";
        ta.style.cssText = male + ";min-height:" + (b.rodzaj === "tekst" ? 70 : 40) + "px";
        let pierwsza = true;
        ta.addEventListener("input", () => {
          if (pierwsza) { zapamietaj(); pierwsza = false; }
          pobierz(R.strona(), pelna)[j].tresc = ta.value;
          podpis.textContent = ta.value || "(pusty)";
          R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
        });
        ta.addEventListener("blur", () => { pierwsza = true; });
        li.append(ta);

        if (b.rodzaj === "przycisk") {
          const cel = wejscie(b.cel, "text", (v) => {
            pobierz(R.strona(), pelna)[j].cel = v;
            R.rysujPodglad(); R.Magazyn.zapisz(R.projekt);
          });
          cel.placeholder = "Odnośnik";
          cel.style.cssText = male;
          li.append(cel);
        }
      }

      /* Miejsce na siatce — to samo, co daje przeciąganie, ale na liczby.
         Przydaje się, kiedy chce się ustawić dwa bloki równo. */
      const siatka = document.createElement("div");
      siatka.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:5px";
      for (const [klu, tyt, min, max] of [["x", "kol.", 0, 11], ["y", "rząd", 0, 60], ["w", "szer.", 1, 12], ["h", "wys.", 1, 40]]) {
        const i = document.createElement("input");
        i.type = "number"; i.min = min; i.max = max; i.value = b[klu]; i.title = tyt;
        i.style.cssText = male + ";padding:5px 6px";
        i.addEventListener("change", () => {
          zapamietaj();
          const v = Math.max(min, Math.min(max, Number(i.value) || 0));
          pobierz(R.strona(), pelna)[j][klu] = v;
          poZmianie();
        });
        siatka.append(i);
      }
      li.append(siatka);

      /* Kolory bloku i wyrównanie. */
      const dolne = document.createElement("div");
      dolne.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;align-items:center";

      const kolorT = document.createElement("input");
      kolorT.type = "color"; kolorT.title = "Kolor tekstu";
      kolorT.value = b.kolorTekstu || R.projekt.motyw.kolory.tekst;
      kolorT.style.cssText = "height:28px;padding:2px;background:#16161a;border:1px solid #33333d;border-radius:5px";
      kolorT.addEventListener("input", () => {
        pobierz(R.strona(), pelna)[j].kolorTekstu = kolorT.value; R.rysujPodglad();
      });
      kolorT.addEventListener("change", () => { zapamietaj(); R.Magazyn.zapisz(R.projekt); });

      const kolorB = document.createElement("input");
      kolorB.type = "color"; kolorB.title = "Tło bloku";
      kolorB.value = b.kolorTla || R.projekt.motyw.kolory.karta;
      kolorB.style.cssText = kolorT.style.cssText;
      kolorB.addEventListener("input", () => {
        pobierz(R.strona(), pelna)[j].kolorTla = kolorB.value; R.rysujPodglad();
      });
      kolorB.addEventListener("change", () => { zapamietaj(); R.Magazyn.zapisz(R.projekt); });

      const czysc = document.createElement("button");
      czysc.className = "btn";
      czysc.textContent = "bez koloru";
      czysc.style.fontSize = "11px";
      czysc.title = "Zdejmij własne kolory tego bloku";
      czysc.addEventListener("click", () => {
        zapamietaj();
        const blok = pobierz(R.strona(), pelna)[j];
        delete blok.kolorTekstu; delete blok.kolorTla;
        poZmianie();
      });
      dolne.append(kolorT, kolorB, czysc);
      li.append(dolne);

      if (b.rodzaj === "naglowek" || b.rodzaj === "tekst") {
        const rozmiar = document.createElement("input");
        rozmiar.type = "range"; rozmiar.min = "0.8"; rozmiar.max = "4"; rozmiar.step = "0.1";
        rozmiar.value = b.wielkosc || 1;
        rozmiar.title = "Wielkość pisma";
        rozmiar.style.width = "100%";
        rozmiar.addEventListener("input", () => {
          pobierz(R.strona(), pelna)[j].wielkosc = Number(rozmiar.value); R.rysujPodglad();
        });
        rozmiar.addEventListener("change", () => { zapamietaj(); R.Magazyn.zapisz(R.projekt); });
        li.append(rozmiar);
      }

      const wyr = document.createElement("select");
      for (const [w, n] of [["left", "do lewej"], ["center", "wyśrodkowany"], ["right", "do prawej"]]) {
        const o = document.createElement("option");
        o.value = w; o.textContent = n;
        wyr.append(o);
      }
      wyr.value = b.wyrownanie || "left";
      wyr.style.cssText = male;
      wyr.addEventListener("change", () => {
        zapamietaj(); pobierz(R.strona(), pelna)[j].wyrownanie = wyr.value; poZmianie();
      });
      li.append(wyr);

      return li;
    });

    const d = document.createElement("div");
    d.className = "pole";
    const l = document.createElement("label");
    l.textContent = opis.etykieta;
    const wsk = document.createElement("p");
    wsk.className = "wskazowka";
    wsk.style.margin = "0 0 8px";
    wsk.textContent = "W podglądzie chwyć niebieskie kółko, żeby przesunąć blok, " +
      "a żółty róg, żeby zmienić jego rozmiar. Na telefonie bloki układają się " +
      "w kolumnę od góry do dołu.";
    const ul = document.createElement("ul");
    ul.className = "karty";
    elementy.forEach((li) => ul.append(li));

    const dodaj = document.createElement("select");
    dodaj.style.cssText = male;
    const pusty = document.createElement("option");
    pusty.value = ""; pusty.textContent = "+ Dodaj blok…";
    dodaj.append(pusty);
    for (const [k, n] of Object.entries(RODZAJE_BLOKU)) {
      const o = document.createElement("option");
      o.value = k; o.textContent = n;
      dodaj.append(o);
    }
    dodaj.addEventListener("change", () => {
      if (!dodaj.value) return;
      zapamietaj();
      const lista = pobierz(R.strona(), pelna);
      const blok = nowyBlok(dodaj.value);
      /* Nowy blok ląduje pod najniższym — nie na cudzym miejscu. */
      blok.y = lista.reduce((max, b) => Math.max(max, b.y + b.h), 0);
      lista.push(blok);
      dodaj.value = "";
      poZmianie();
    });

    d.append(l, wsk, ul, dodaj);
    return d;
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
    const obecna = sciezkaIkony ? pobierz(R.strona(), sciezkaIkony) : null;
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
          zapamietaj(); ustaw(R.strona(), sciezkaIkony, i.id); zamknijIkony(); poZmianie();
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
        R.strona().sekcje[idx].widoczna = R.strona().sekcje[idx].widoczna === false;
        poZmianie();
        return;
      }
      if (akcja === "skasuj") {
        const s = R.strona().sekcje[idx];
        if (!confirm(`Usunąć sekcję „${R.NAZWY_TYPOW[s.typ] || s.typ}"? Tego nie cofnie autozapis, ale cofnie Ctrl+Z.`)) return;
        zapamietaj();
        R.strona().sekcje.splice(idx, 1);
        if (R.zaznaczona === s.id) R.zaznaczona = null;
        poZmianie();
        return;
      }
      R.zaznaczona = R.strona().sekcje[idx].id;
      R.zaznaczonaKarta = null;
      poZmianie();
    });
    R.wlaczPrzeciaganie(lista, "li", (z, k) => R.przestaw(R.strona().sekcje, z, k));

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
      const gdzie = R.strona().sekcje.findIndex((s) => s.id === R.zaznaczona);
      R.strona().sekcje.splice(gdzie < 0 ? R.strona().sekcje.length : gdzie + 1, 0, nowa);
      R.zaznaczona = nowa.id;
      wybor.value = "";
      poZmianie();
      powiedz("Sekcja dodana.");
    });

    $("#dodajStrone").addEventListener("click", () => {
      const nazwa = prompt("Nazwa podstrony (np. „Kontakt\u201d):", "Nowa podstrona");
      if (!nazwa) return;
      /* Nazwa pliku z nazwy strony: bez ogonków, spacje na myślniki.
         Bez tego adres byłby zakodowany procentami i nieczytelny. */
      const plik = nazwa.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + ".html";
      if (R.projekt.strony.some((st) => st.plik === plik)) {
        alert("Podstrona o takim pliku już istnieje: " + plik);
        return;
      }
      zapamietaj();
      R.projekt.strony.push({
        id: "st-" + Math.random().toString(36).slice(2, 8),
        nazwa: nazwa.trim(), plik, tytul: "", opis: "",
        sekcje: [
          Object.assign({ id: nowyId(), widoczna: true }, SZABLONY.pasek()),
          Object.assign({ id: nowyId(), widoczna: true }, SZABLONY.tekst()),
          Object.assign({ id: nowyId(), widoczna: true }, SZABLONY.stopka()),
        ],
      });
      R.idxStrony = R.projekt.strony.length - 1;
      R.zaznaczona = null; R.zaznaczonaKarta = null; R.zaznaczonyBlok = null;
      poZmianie();
      powiedz("Podstrona „" + nazwa.trim() + "\u201d dodana.");
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

    $("#pobierzStrone").addEventListener("click", async () => {
      /* Po jednym pliku, z przerwą: przeglądarki blokują serię pobrań
         wystrzeloną w jednej chwili i po cichu gubią wszystkie poza pierwszym. */
      for (const st of R.projekt.strony) {
        pobierzPlik(st.plik, window.KX_STRONA.dokument(R.projekt, st), "text/html");
        await new Promise((ok) => setTimeout(ok, 450));
      }
      powiedz(`Pobrano ${R.projekt.strony.length} stron. Podmień pliki w repozytorium.`);
    });

    $("#wczytaj").addEventListener("click", () => $("#plikProjektu").click());
    $("#plikProjektu").addEventListener("change", async (e) => {
      const plik = e.target.files[0];
      if (!plik) return;
      try {
        const wczytany = R.uwspolczesnij(JSON.parse(await plik.text()));
        if (!wczytany) throw new Error("zły kształt");
        zapamietaj();
        R.projekt = wczytany;
        R.idxStrony = 0;
        R.zaznaczona = null; R.zaznaczonaKarta = null; R.zaznaczonyBlok = null;
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
      R.idxStrony = 0;
      R.zaznaczona = null; R.zaznaczonaKarta = null; R.zaznaczonyBlok = null;
      await R.Magazyn.skasuj();
      poZmianie();
      powiedz("Wrócono do stanu wyjściowego.");
    });
  }

  R.podepnij({ rysujPanelElementu, rysujPanelMotywu, rysujSpisStron: rysujStrony, otworzWyborIkony, wybierzZdjecie });

  (async function start() {
    const zapisany = await R.Magazyn.wczytaj();
    if (zapisany) {
      try {
        const p = R.uwspolczesnij(JSON.parse(zapisany));
        if (p) { R.projekt = p; powiedz("Wczytano poprzednią pracę."); }
      } catch (e) { /* uszkodzony zapis — startujemy od domyślnego */ }
    }
    podepnijZdarzenia();
    poZmianie();
  })();
})();
