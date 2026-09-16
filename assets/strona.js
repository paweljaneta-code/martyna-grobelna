/* ==========================================================================
   Generator strony — JEDNO źródło układu dla dwóch odbiorców:
   podglądu w redaktorze i pliku, który redaktor eksportuje.

   Gdyby podgląd i eksport miały osobny kod, rozjechałyby się po tygodniu
   i „u mnie w edytorze wyglądało inaczej" byłoby nie do rozstrzygnięcia.

   Tryb „edytor" dokłada do znaczników atrybuty data-* i contenteditable,
   po których redaktor poznaje, co użytkownik kliknął. Tryb „eksport"
   ich nie dokłada, więc gotowa strona jest czystym HTML-em.
   ========================================================================== */

window.KX_STRONA = (function () {

  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* Pole edytowalne w miejscu. Ścieżka wskazuje miejsce w projekcie,
     żeby redaktor mógł zapisać zmianę bez wiedzy, co to za sekcja. */
  function pole(tresc, sciezka, tryb, tag = "span", klasa = "") {
    const k = klasa ? ` class="${klasa}"` : "";
    if (tryb !== "edytor") return `<${tag}${k}>${esc(tresc)}</${tag}>`;
    return `<${tag}${k} data-pole="${esc(sciezka)}" contenteditable="plaintext-only" spellcheck="false">${esc(tresc)}</${tag}>`;
  }

  /* Zaczepy narzędzia (data-karta, data-gniazdo…) mają prawo istnieć
     WYŁĄCZNIE w podglądzie. W eksporcie to śmieci, które nic nie robią,
     a zostają w kodzie strony na zawsze. */
  const zaczep = (tryb, atrybuty) => (tryb === "edytor" ? " " + atrybuty : "");

  function ikona(id) {
    const bib = window.KX_IKONY;
    const wpis = bib && bib.lista.find((i) => i.id === id);
    if (!wpis) return "";
    const atr = Object.entries(bib.ramka).map(([k, v]) => `${k}="${v}"`).join(" ");
    return `<svg ${atr} aria-hidden="true">${wpis.svg}</svg>`;
  }

  /* ---------------------------------------------------------------- style */

  function css(m) {
    const k = m.kolory;
    return `
:root{
  --tlo:${k.tlo}; --tlo2:${k.pasKontakt}; --karta:${k.karta};
  --tekst:${k.tekst}; --miekki:${k.miekki}; --kreska:${k.kreska}; --akcent:${k.akcent};
  --promien:${m.zaokraglenie}px; --szer:${m.szerokosc}px;
  --naglowki:"${m.krojNaglowki}", ${m.zapasowyNaglowki || "system-ui, sans-serif"};
  --proza:"${m.krojProza}", ${m.zapasowyProza || "Georgia, serif"};
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--tlo);color:var(--tekst);font-family:var(--proza);
  font-size:${(17 * (m.skala || 1)).toFixed(1)}px;line-height:${m.interlinia || 1.7};-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
a:focus-visible,button:focus-visible{outline:2px solid var(--tekst);outline-offset:3px}
[id]{scroll-margin-top:84px}

.skip{position:absolute;left:-9999px;top:0;background:var(--karta);padding:10px 16px;
  font-family:var(--naglowki);font-size:14px;z-index:100}
.skip:focus{left:8px;top:8px}

.pasek{position:sticky;top:0;z-index:50;background:color-mix(in srgb, var(--tlo) 92%, transparent);backdrop-filter:blur(8px)}
.pasek__wnetrze{max-width:var(--szer);margin:0 auto;padding:18px 24px;display:flex;justify-content:var(--pasek-poz,center)}
.menu{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(20px,6vw,72px);list-style:none;margin:0;padding:0}
.menu a{font-family:var(--naglowki);font-size:14px;font-weight:500;letter-spacing:.02em;
  text-decoration:none;padding-bottom:2px;border-bottom:1px solid transparent}
.menu a:hover{border-bottom-color:var(--tekst)}

.obszar{max-width:var(--szer);margin:0 auto;padding:0 24px}
.sekcja{margin:clamp(56px,9vw,104px) auto}
.sekcja--ciasna{margin:clamp(32px,5vw,56px) auto}
.sekcja--luzna{margin:clamp(80px,13vw,150px) auto}
.sekcja__tytul{font-family:var(--naglowki);font-size:clamp(22px,3.4vw,30px);font-weight:700;
  letter-spacing:-.01em;margin:0 0 28px}
.sekcja__tytul--srodek{text-align:center}
.karta{background:var(--karta);border-radius:var(--promien);box-shadow:0 1px 2px rgba(20,19,15,.06)}
.proza{text-align:justify;hyphens:auto}
.proza p{margin:0 0 1em}
.proza p:last-child{margin-bottom:0}
.proza--lewo{text-align:left}

.przyciski{display:flex;flex-wrap:wrap;gap:14px}
.przyciski--srodek{justify-content:center}
.przycisk{display:inline-block;font-family:var(--naglowki);font-size:14px;font-weight:500;
  text-decoration:none;padding:11px 24px;border:1px solid var(--kreska);border-radius:999px;
  background:var(--karta);box-shadow:0 1px 3px rgba(20,19,15,.08);
  transition:background .15s ease,border-color .15s ease}
.przycisk:hover{background:var(--tekst);border-color:var(--tekst);color:var(--karta)}

.hero{margin-top:28px;padding:clamp(32px,5vw,64px);display:grid;
  grid-template-columns:minmax(0,.9fr) minmax(0,1fr);gap:clamp(32px,6vw,72px);align-items:center}
.hero--odwrocony .hero__portret{order:2}
.hero--bezZdjecia{grid-template-columns:minmax(0,1fr)}
.hero__portret{background:var(--akcent);overflow:hidden;aspect-ratio:1/1.05}
.hero__portret img{width:100%;height:100%;object-fit:cover}
.ksztalt-blob{border-radius:64% 36% 43% 57%/52% 44% 56% 48%}
.ksztalt-kolo{border-radius:50%}
.ksztalt-luk{border-radius:999px 999px 24px 24px}
.ksztalt-prostokat{border-radius:var(--promien)}
.hero__tytul{font-family:var(--naglowki);font-size:clamp(34px,5.4vw,52px);font-weight:700;
  letter-spacing:-.02em;line-height:1.05;margin:0 0 18px}
.hero__lead{font-size:1.06rem;margin:0 0 26px}
.hero .przyciski{margin-top:30px}

.filar{display:grid;grid-template-columns:240px minmax(0,1fr);gap:clamp(24px,5vw,56px);
  align-items:center;padding:clamp(28px,4vw,44px);margin-bottom:22px}
.filar--gora{grid-template-columns:minmax(0,1fr);text-align:center}
.filar--gora .proza{text-align:center}
.filar__godlo{display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center}
.filar__godlo svg{width:96px;height:96px}
.filar__nazwa{font-family:var(--naglowki);font-size:17px;font-weight:600}

.formy{display:grid;gap:28px;margin:0 auto}
.formy--2{grid-template-columns:repeat(2,minmax(0,1fr));max-width:760px}
.formy--3{grid-template-columns:repeat(3,minmax(0,1fr));max-width:1000px}
.forma{padding:40px 32px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px}
.forma svg{width:86px;height:86px}
.forma__nazwa{font-family:var(--naglowki);font-size:19px;font-weight:600;line-height:1.3;margin:0}
.forma p{margin:0;font-size:.98rem}
.forma .przycisk{margin-top:auto}

.cytat{max-width:820px;margin:0 auto;text-align:center;padding:0 24px}
.cytat blockquote{margin:0;font-family:var(--naglowki);font-weight:400;
  font-size:clamp(20px,3vw,28px);line-height:1.45}
.cytat figcaption{margin-top:18px;font-size:.92rem;color:var(--miekki);font-family:var(--naglowki)}

.galeria{display:grid;gap:18px}
.galeria--2{grid-template-columns:repeat(2,1fr)}
.galeria--3{grid-template-columns:repeat(3,1fr)}
.galeria--4{grid-template-columns:repeat(4,1fr)}
.galeria img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--promien);background:var(--akcent)}

.kontakt{background:var(--tlo2);padding:clamp(56px,8vw,96px) 0;margin-top:clamp(56px,9vw,104px)}
.kontakt__tytul{font-family:var(--naglowki);font-size:clamp(30px,5vw,46px);font-weight:400;
  text-align:center;margin:0 0 clamp(36px,6vw,64px)}
.kontakt__siatka{display:grid;grid-template-columns:repeat(var(--kol,3),minmax(0,1fr));gap:clamp(28px,5vw,56px)}
.kontakt__naglowek{font-family:var(--naglowki);font-size:16px;font-weight:600;margin:0 0 14px}
.kontakt__blok p{margin:0 0 .3em}
.godziny{width:100%;border-collapse:collapse;font-size:.95rem}
.godziny th,.godziny td{text-align:left;font-weight:400;padding:5px 0;vertical-align:top}
.godziny td{color:var(--miekki);padding-left:12px}
.mapa{margin-top:clamp(36px,6vw,56px);aspect-ratio:16/6;background:color-mix(in srgb,var(--tlo2) 80%,#000 8%);
  display:flex;align-items:center;justify-content:center;font-family:var(--naglowki);font-size:14px;
  color:var(--miekki);text-align:center;padding:24px;border-radius:var(--promien);overflow:hidden}
.mapa iframe{width:100%;height:100%;border:0;display:block}

/* Pas tła pod sekcją. display:flow-root domyka marginesy dziecka —
   bez tego margines sekcji wychodziłby poza kolorowe tło. */
.pas{display:flow-root}

/* Swobodne płótno: dwanaście kolumn, rzędy o stałej wysokości.
   Bloki stawia się na siatce, więc da się je przesuwać myszą, a mimo to
   układ nie rozsypie się przy innej szerokości okna. */
.plotno{display:grid;grid-template-columns:repeat(12,1fr);gap:var(--luka,14px);
  grid-auto-rows:var(--rzad,44px);max-width:var(--szer);margin:0 auto;padding:0 24px}
.plotno-blok{min-width:0;display:flex;flex-direction:column;justify-content:center;overflow-wrap:anywhere}
.plotno-blok--naglowek{font-family:var(--naglowki);font-weight:700;letter-spacing:-.01em;line-height:1.1}
.plotno-blok--tekst{line-height:1.6}
.plotno-blok--zdjecie{padding:0}
.plotno-blok--zdjecie img,.plotno-blok--zdjecie svg{width:100%;height:100%;object-fit:cover;display:block}
.plotno-blok--grafika{align-items:center}
.plotno-blok--grafika svg{width:100%;height:100%;max-height:100%}
.plotno-blok--przycisk{align-items:flex-start;justify-content:center}
.plotno-puste{background:var(--akcent);border-radius:var(--promien);display:flex;
  align-items:center;justify-content:center;width:100%;height:100%;
  font-family:var(--naglowki);font-size:13px;color:var(--miekki);text-align:center;padding:12px}

/* Cennik: pozycja i kwota rozstrzelone do krawędzi. */
.cennik{list-style:none;padding:0;margin:0 auto;max-width:68ch}
.cennik li{display:flex;align-items:baseline;gap:12px;padding:14px 0;border-bottom:1px solid var(--kreska)}
.cennik li:last-child{border-bottom:0}
.cennik__kropki{flex:1 1 auto;border-bottom:1px dotted var(--kreska)}
.cennik__kwota{font-family:var(--naglowki);font-size:15px;font-weight:600;white-space:nowrap}

.stopka{padding:28px 24px 36px;text-align:center;font-family:var(--naglowki);font-size:12px;color:var(--miekki)}
.stopka a{text-decoration:none}

@media (max-width:900px){
  .hero{grid-template-columns:1fr}
  .hero--odwrocony .hero__portret{order:0}
  .hero__portret{max-width:340px;margin:0 auto}
  .hero .przyciski{justify-content:center}
  .hero__tytul,.hero__lead{text-align:center}
  .filar{grid-template-columns:1fr}
  .filar__godlo{flex-direction:row;justify-content:center}
  .filar__godlo svg{width:64px;height:64px}
  .kontakt__siatka{grid-template-columns:1fr}
  .formy--3{grid-template-columns:repeat(2,minmax(0,1fr))}
  .galeria--4{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:760px){
  .plotno{display:flex;flex-direction:column;grid-auto-rows:auto}
  .plotno-blok{grid-column:auto !important;grid-row:auto !important;min-height:var(--min-tel,auto)}
}
@media (max-width:620px){
  body{font-size:${(16 * (m.skala || 1)).toFixed(1)}px}
  .formy--2,.formy--3{grid-template-columns:1fr}
  .galeria--2,.galeria--3,.galeria--4{grid-template-columns:1fr}
  .menu{gap:18px 22px}
  .proza{text-align:left}
  .mapa{aspect-ratio:4/3}
}
@media print{
  .pasek,.przyciski,.mapa{display:none}
  body{background:#fff}
  .karta,.hero{box-shadow:none}
}`;
  }

  /* --------------------------------------------------------------- sekcje */

  const ODSTEP = { ciasny: " sekcja--ciasna", zwykly: "", luzny: " sekcja--luzna" };

  const RYSUJ = {

    pasek(s, i, t) {
      const poz = s.pozycje.map((p, j) =>
        `<li><a href="${esc(p.cel)}">${pole(p.tekst, `sekcje.${i}.pozycje.${j}.tekst`, t)}</a></li>`).join("");
      return `<header class="pasek"><nav class="pasek__wnetrze" aria-label="Główne"><ul class="menu">${poz}</ul></nav></header>`;
    },

    hero(s, i, t) {
      const portret = s.zdjecie
        ? `<img src="${s.zdjecie}" alt="${esc(s.opisZdjecia || "")}">`
        : `<svg viewBox="0 0 400 420" aria-label="Miejsce na zdjęcie" role="img" style="width:100%;height:100%">
             <rect width="400" height="420" fill="transparent"/>
             <g fill="none" stroke="rgba(0,0,0,.22)" stroke-width="7" stroke-linecap="round">
               <circle cx="200" cy="168" r="66"/><path d="M92 352c0-62 48-104 108-104s108 42 108 104"/>
             </g></svg>`;
      const zdjecieBlok = s.pokazZdjecie === false ? "" :
        `<div class="hero__portret ksztalt-${esc(s.ksztalt || "blob")}" ${zaczep(t, `data-gniazdo="zdjecie" data-sekcja-idx="${i}"`)}>${portret}</div>`;
      const akapity = s.akapity.map((a, j) =>
        pole(a, `sekcje.${i}.akapity.${j}`, t, "p")).join("");
      const przyciski = s.przyciski.length
        ? `<div class="przyciski">` + s.przyciski.map((p, j) =>
            `<a class="przycisk" href="${esc(p.cel)}">${pole(p.tekst, `sekcje.${i}.przyciski.${j}.tekst`, t)}</a>`).join("") + `</div>`
        : "";
      const klasy = ["karta", "hero"];
      if (s.pokazZdjecie === false) klasy.push("hero--bezZdjecia");
      else if (s.stronaZdjecia === "prawo") klasy.push("hero--odwrocony");
      return `<div class="obszar"><section class="${klasy.join(" ")}">${zdjecieBlok}<div>
        ${pole(s.tytul, `sekcje.${i}.tytul`, t, "h1", "hero__tytul")}
        ${pole(s.lead, `sekcje.${i}.lead`, t, "p", "hero__lead")}
        <div class="proza">${akapity}</div>${przyciski}</div></section></div>`;
    },

    filary(s, i, t) {
      const karty = s.karty.map((c, j) => `
        <article class="karta filar${s.ukladIkony === "gora" ? " filar--gora" : ""}"${zaczep(t, `data-karta="${i}.${j}"`)}>
          <div class="filar__godlo"${zaczep(t, `data-gniazdo="ikona" data-sciezka="sekcje.${i}.karty.${j}.ikona"`)}>
            ${ikona(c.ikona)}${pole(c.nazwa, `sekcje.${i}.karty.${j}.nazwa`, t, "span", "filar__nazwa")}
          </div>
          <div class="proza">${pole(c.tekst, `sekcje.${i}.karty.${j}.tekst`, t, "p")}</div>
        </article>`).join("");
      const pod = s.przyciskPod && s.przyciskPod.tekst
        ? `<div class="przyciski przyciski--srodek"><a class="przycisk" href="${esc(s.przyciskPod.cel)}">${pole(s.przyciskPod.tekst, `sekcje.${i}.przyciskPod.tekst`, t)}</a></div>` : "";
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} obszar">
        ${pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "sekcja__tytul" + (s.wyrownanieTytulu === "srodek" ? " sekcja__tytul--srodek" : ""))}
        ${karty}${pod}</section>`;
    },

    formy(s, i, t) {
      const karty = s.karty.map((c, j) => `
        <article class="karta forma"${zaczep(t, `data-karta="${i}.${j}"`)}>
          <span${zaczep(t, `data-gniazdo="ikona" data-sciezka="sekcje.${i}.karty.${j}.ikona"`)}>${ikona(c.ikona)}</span>
          ${pole(c.nazwa, `sekcje.${i}.karty.${j}.nazwa`, t, "h3", "forma__nazwa")}
          ${pole(c.tekst, `sekcje.${i}.karty.${j}.tekst`, t, "p")}
          ${c.przycisk && c.przycisk.tekst ? `<a class="przycisk" href="${esc(c.przycisk.cel)}">${pole(c.przycisk.tekst, `sekcje.${i}.karty.${j}.przycisk.tekst`, t)}</a>` : ""}
        </article>`).join("");
      const pod = (s.przyciskiPod || []).length
        ? `<div class="przyciski przyciski--srodek" style="margin-top:32px">` + s.przyciskiPod.map((p, j) =>
            `<a class="przycisk" href="${esc(p.cel)}">${pole(p.tekst, `sekcje.${i}.przyciskiPod.${j}.tekst`, t)}</a>`).join("") + `</div>` : "";
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} obszar">
        ${pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "sekcja__tytul" + (s.wyrownanieTytulu === "srodek" ? " sekcja__tytul--srodek" : ""))}
        <div class="formy formy--${s.kolumny || 2}">${karty}</div>${pod}</section>`;
    },

    tekst(s, i, t) {
      const akapity = s.akapity.map((a, j) => pole(a, `sekcje.${i}.akapity.${j}`, t, "p")).join("");
      const wnetrze = `${s.tytul ? pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "sekcja__tytul" + (s.wyrownanieTytulu === "srodek" ? " sekcja__tytul--srodek" : "")) : ""}
        <div class="proza${s.wyrownanie === "lewo" ? " proza--lewo" : ""}" style="max-width:${s.szerokoscTekstu || 68}ch">${akapity}</div>`;
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} obszar">${
        s.wKarcie ? `<div class="karta" style="padding:clamp(28px,4vw,48px)">${wnetrze}</div>` : wnetrze}</section>`;
    },

    cytat(s, i, t) {
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} cytat"><figure style="margin:0">
        ${pole(s.tresc, `sekcje.${i}.tresc`, t, "blockquote")}
        ${s.autor ? pole(s.autor, `sekcje.${i}.autor`, t, "figcaption") : ""}</figure></section>`;
    },

    galeria(s, i, t) {
      const zdj = (s.zdjecia || []).map((z, j) =>
        `<img src="${z}" alt=""${zaczep(t, `data-gniazdo="galeria" data-sekcja-idx="${i}" data-idx="${j}"`)}>`).join("");
      const puste = !zdj ? `<div class="mapa" style="aspect-ratio:4/3;margin:0">Galeria — dodaj zdjęcia w panelu po prawej.</div>` : "";
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} obszar">
        ${s.tytul ? pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "sekcja__tytul") : ""}
        <div class="galeria galeria--${s.kolumny || 3}">${zdj}</div>${puste}</section>`;
    },

    cta(s, i, t) {
      return `<section class="sekcja${ODSTEP[s.odstep || "zwykly"]} obszar" style="text-align:center">
        ${s.tytul ? pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "sekcja__tytul sekcja__tytul--srodek") : ""}
        <div class="przyciski przyciski--srodek">${(s.przyciski || []).map((p, j) =>
          `<a class="przycisk" href="${esc(p.cel)}">${pole(p.tekst, `sekcje.${i}.przyciski.${j}.tekst`, t)}</a>`).join("")}</div></section>`;
    },

    kontakt(s, i, t) {
      const kol = (s.kolumny || []).map((c, j) => {
        const wiersze = (c.wiersze || []).map((w, n) =>
          pole(w, `sekcje.${i}.kolumny.${j}.wiersze.${n}`, t, "p")).join("");
        const tabela = c.godziny && c.godziny.length
          ? `<table class="godziny"><tbody>` + c.godziny.map((g, n) =>
              `<tr><th scope="row">${pole(g.dzien, `sekcje.${i}.kolumny.${j}.godziny.${n}.dzien`, t)}</th>` +
              `<td>${pole(g.zakres, `sekcje.${i}.kolumny.${j}.godziny.${n}.zakres`, t)}</td></tr>`).join("") + `</tbody></table>`
          : "";
        return `<div class="kontakt__blok">${pole(c.naglowek, `sekcje.${i}.kolumny.${j}.naglowek`, t, "h3", "kontakt__naglowek")}${wiersze}${tabela}</div>`;
      }).join("");
      const mapa = s.mapa
        ? `<div class="mapa">${s.mapaHtml || "Mapa dojazdu — wklej kod osadzenia w panelu po prawej."}</div>` : "";
      return `<section class="kontakt" id="kontakt"><div class="obszar">
        ${pole(s.tytul, `sekcje.${i}.tytul`, t, "h2", "kontakt__tytul")}
        <div class="kontakt__siatka" style="--kol:${(s.kolumny || []).length || 3}">${kol}</div>${mapa}</div></section>`;
    },

    /* Swobodne płótno. Blok niesie miejsce na siatce (x, y, szerokość,
       wysokość w jednostkach), własne kolory i treść. „order" liczymy tu,
       przy składaniu — decyduje o kolejności na telefonie, gdzie siatka
       zamienia się w kolumnę. */
    plotno(s, i, t) {
      const kolejnosc = [...(s.bloki || [])]
        .map((b, j) => ({ j, y: b.y, x: b.x }))
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .reduce((mapa, w, n) => (mapa[w.j] = n, mapa), {});

      const bloki = (s.bloki || []).map((b, j) => {
        const styl = [
          "grid-column:" + (b.x + 1) + "/span " + b.w,
          "grid-row:" + (b.y + 1) + "/span " + b.h,
          "order:" + kolejnosc[j],
          "--min-tel:" + (b.h * 44) + "px",
          b.kolorTekstu ? "color:" + b.kolorTekstu : "",
          b.kolorTla ? "background:" + b.kolorTla + ";padding:14px;border-radius:var(--promien)" : "",
          b.wyrownanie ? "text-align:" + b.wyrownanie : "",
          (b.rodzaj === "naglowek" || b.rodzaj === "tekst") && b.wielkosc
            ? "font-size:" + Number(b.wielkosc).toFixed(2) + "rem" : "",
        ].filter(Boolean).join(";");

        let wnetrze;
        if (b.rodzaj === "zdjecie") {
          wnetrze = b.zdjecie
            ? '<img src="' + b.zdjecie + '" alt="' + esc(b.opis || "") + '" style="border-radius:var(--promien)">'
            : '<div class="plotno-puste">miejsce na zdjęcie</div>';
        } else if (b.rodzaj === "grafika") {
          wnetrze = ikona(b.ikona) || '<div class="plotno-puste">miejsce na grafikę</div>';
        } else if (b.rodzaj === "przycisk") {
          wnetrze = '<a class="przycisk" href="' + esc(b.cel || "#") + '">' +
                    pole(b.tresc, "sekcje." + i + ".bloki." + j + ".tresc", t) + "</a>";
        } else {
          wnetrze = pole(b.tresc, "sekcje." + i + ".bloki." + j + ".tresc", t, "div");
        }

        const zaczepy = zaczep(t, 'data-blok="' + i + "." + j + '"' +
          (b.rodzaj === "zdjecie"
            ? ' data-gniazdo="blok-zdjecie" data-sciezka="sekcje.' + i + ".bloki." + j + '.zdjecie"' : "") +
          (b.rodzaj === "grafika"
            ? ' data-gniazdo="ikona" data-sciezka="sekcje.' + i + ".bloki." + j + '.ikona"' : ""));

        return '<div class="plotno-blok plotno-blok--' + esc(b.rodzaj) + '" style="' + styl + '"' + zaczepy + ">" +
               wnetrze + "</div>";
      }).join("");

      return '<section class="sekcja' + ODSTEP[s.odstep || "zwykly"] + '">' +
        '<div class="plotno" style="--rzad:' + (s.rzad || 44) + "px;--luka:" + (s.luka ?? 14) +
        "px;min-height:" + ((s.wysokosc || 10) * (s.rzad || 44)) + 'px">' + bloki + "</div></section>";
    },

    cennik(s, i, t) {
      const pozycje = (s.pozycje || []).map((p, j) =>
        "<li>" + pole(p.nazwa, "sekcje." + i + ".pozycje." + j + ".nazwa", t, "span") +
        '<span class="cennik__kropki"></span>' +
        pole(p.kwota, "sekcje." + i + ".pozycje." + j + ".kwota", t, "span", "cennik__kwota") + "</li>").join("");
      const uwagi = (s.uwagi || []).map((u, j) =>
        pole(u, "sekcje." + i + ".uwagi." + j, t, "p")).join("");
      const tytul = s.tytul
        ? pole(s.tytul, "sekcje." + i + ".tytul", t, "h2",
               "sekcja__tytul" + (s.wyrownanieTytulu === "srodek" ? " sekcja__tytul--srodek" : "")) : "";
      return '<section class="sekcja' + ODSTEP[s.odstep || "zwykly"] + ' obszar">' + tytul +
        '<ul class="cennik">' + pozycje + "</ul>" +
        (uwagi ? '<div class="proza" style="max-width:68ch;margin:28px auto 0;color:var(--miekki);font-size:.95rem">' +
                 uwagi + "</div>" : "") + "</section>";
    },

    stopka(s, i, t) {
      return `<footer class="stopka">${pole(s.tresc, `sekcje.${i}.tresc`, t, "span")}</footer>`;
    },
  };

  /* Bierze JEDNĄ stronę, nie cały projekt — od wersji 2 projekt trzyma
     kilka stron, a ścieżki pól ("sekcje.2.tytul") liczone są względem
     strony, więc redaktor rozstrzyga je wobec strony bieżącej. */
  function html(strona, tryb) {
    return strona.sekcje.map((s, i) => {
      if (s.widoczna === false) return "";
      const rysuj = RYSUJ[s.typ];
      if (!rysuj) return "";
      let tresc = rysuj(s, i, tryb);
      if (s.tloSekcji)
        tresc = '<div class="pas" style="background:' + esc(s.tloSekcji) + '">' + tresc + '</div>';
      return tryb === "edytor"
        ? '<div data-sekcja="' + s.id + '" data-typ="' + s.typ + '">' + tresc + '</div>'
        : tresc;
    }).join("\n");
  }

  /* Gotowy, samodzielny plik — to jest to, co ląduje w repozytorium.
     Motyw idzie z projektu, treść i tytuł z wybranej strony. */
  function dokument(projekt, strona) {
    strona = strona || projekt.strony[0];
    const m = projekt.motyw;
    const tytulStrony = strona.tytul || projekt.meta.tytul;
    const opisStrony = strona.opis || projekt.meta.opis;
    return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tytulStrony)}</title>
<meta name="description" content="${esc(opisStrony)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(tytulStrony)}">
<meta property="og:description" content="${esc(opisStrony)}">
<meta property="og:locale" content="pl_PL">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/fonty.css">
<style>${css(m)}</style>
</head>
<body>
<a class="skip" href="#tresc">Przejdź do treści</a>
<main id="tresc">
${html(strona, "eksport")}
</main>
</body>
</html>
`;
  }

  return { css, html, dokument, ikona, esc };
})();
