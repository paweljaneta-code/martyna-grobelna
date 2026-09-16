import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

// Rodziny do wyboru w edytorze. „rodzaj" steruje stosem zapasowym, gdyby
// plik kroju się nie wczytał, i grupowaniem w liście wyboru.
const RODZINY = [
  { nazwa: "Poppins",            rodzaj: "bezszeryfowy", wagi: "400;500;600;700" },
  { nazwa: "Inter",              rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "Work Sans",          rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "DM Sans",            rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "Outfit",             rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "Montserrat",         rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "Karla",              rodzaj: "bezszeryfowy", wagi: "400;600;700" },
  { nazwa: "EB Garamond",        rodzaj: "szeryfowy",    wagi: "400;500;600;700", kursywa: true },
  { nazwa: "Lora",               rodzaj: "szeryfowy",    wagi: "400;600;700",     kursywa: true },
  { nazwa: "Cormorant Garamond", rodzaj: "szeryfowy",    wagi: "400;600;700" },
  { nazwa: "Libre Baskerville",  rodzaj: "szeryfowy",    wagi: "400;700",         kursywa: true },
  { nazwa: "Source Serif 4",     rodzaj: "szeryfowy",    wagi: "400;600;700" },
  { nazwa: "Playfair Display",   rodzaj: "szeryfowy",    wagi: "400;600;700" },
  { nazwa: "Caveat",             rodzaj: "odreczny",     wagi: "400;700" },
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const CHCEMY = new Set(["latin", "latin-ext"]); // polskie znaki siedzą w latin-ext

const zapytanie = RODZINY.map(r => {
  const rodzina = r.nazwa.replace(/ /g, "+");
  if (r.kursywa) {
    const proste = r.wagi.split(";").map(w => `0,${w}`).join(";");
    return `family=${rodzina}:ital,wght@${proste};1,400`;
  }
  return `family=${rodzina}:wght@${r.wagi}`;
}).join("&");

const css = execFileSync("curl", ["-sSfL", "-A", UA, "--max-time", "60",
  `https://fonts.googleapis.com/css2?${zapytanie}&display=swap`], { encoding: "utf8" });

rmSync("assets/fonty", { recursive: true, force: true });
mkdirSync("assets/fonty", { recursive: true });

const bloki = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
const reguly = [];
const znalezione = new Set();
let bajty = 0;

for (const [, subset, blok] of bloki) {
  if (!CHCEMY.has(subset)) continue;
  const rodzina = /font-family:\s*'([^']+)'/.exec(blok)[1];
  const styl = /font-style:\s*(\w+)/.exec(blok)[1];
  const waga = /font-weight:\s*(\d+)/.exec(blok)[1];
  const url = /url\((https:\/\/[^)]+)\)/.exec(blok)[1];
  const zakres = /unicode-range:\s*([^;]+);/.exec(blok)[1].trim();

  const slug = rodzina.toLowerCase().replace(/\s+/g, "-");
  const plik = `${slug}-${waga}${styl === "italic" ? "-i" : ""}-${subset}.woff2`;
  execFileSync("curl", ["-sSfL", url, "-o", `assets/fonty/${plik}`, "--max-time", "60"]);
  bajty += Number(execFileSync("stat", ["-c", "%s", `assets/fonty/${plik}`], { encoding: "utf8" }).trim());
  znalezione.add(rodzina);

  reguly.push(`@font-face{font-family:"${rodzina}";font-style:${styl};font-weight:${waga};` +
              `font-display:swap;src:url("fonty/${plik}") format("woff2");unicode-range:${zakres}}`);
}

const naglowek = `/* ==========================================================================
   Kroje pisma serwowane z tego repozytorium, nie z CDN-u Google.
   Powód: wczytanie kroju z fonts.gstatic.com wysyła adres IP każdej osoby
   odwiedzającej stronę na serwery Google. Przy stronie gabinetu
   psychoterapii to zbędne przetwarzanie danych.

   PLIK JEST GENEROWANY przez scripts/pobierz-kroje.mjs — nie edytuj ręcznie.
   Wszystkie rodziny są na licencji SIL Open Font License 1.1, więc wolno je
   hostować u siebie, także komercyjnie.
   ========================================================================== */

`;
writeFileSync("assets/fonty.css", naglowek + reguly.join("\n") + "\n");

const brakujace = RODZINY.filter(r => !znalezione.has(r.nazwa)).map(r => r.nazwa);
writeFileSync("assets/kroje.js",
`/* Spis krojów do wyboru w redaktorze. GENEROWANY — patrz scripts/pobierz-kroje.mjs. */
window.KX_KROJE = ${JSON.stringify(
  RODZINY.filter(r => znalezione.has(r.nazwa)).map(r => ({
    nazwa: r.nazwa,
    rodzaj: r.rodzaj,
    zapasowy: r.rodzaj === "szeryfowy" ? "Georgia, serif"
            : r.rodzaj === "odreczny" ? "cursive"
            : "system-ui, sans-serif",
  })), null, 2)};
`);

console.log(`Rodzin pobranych: ${znalezione.size} z ${RODZINY.length}`);
if (brakujace.length) console.log("NIE POBRANO:", brakujace.join(", "));
console.log(`Plików woff2: ${reguly.length}, razem ${(bajty / 1048576).toFixed(2)} MB`);
