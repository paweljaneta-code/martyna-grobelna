/* Składa pliki HTML strony z projektu.
 *
 * Bez argumentu bierze projekt domyślny (assets/projekt-domyslny.js).
 * Z argumentem — plik projekt-strony.json pobrany z redaktora:
 *
 *     node scripts/zbuduj-strony.mjs ~/Pobrane/projekt-strony.json
 *
 * To jedyna droga, którą powstają index.html i podstrony. Nie edytuj ich
 * ręcznie — najbliższa przebudowa i tak je nadpisze.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const tu = dirname(fileURLToPath(import.meta.url));
const korzen = resolve(tu, "..");
const wymagaj = createRequire(import.meta.url);

globalThis.window = {};
wymagaj(join(korzen, "assets/ikony.js"));
wymagaj(join(korzen, "assets/strona.js"));

const zPliku = process.argv[2];
let projekt;
if (zPliku) {
  projekt = JSON.parse(readFileSync(resolve(zPliku), "utf8"));
} else {
  wymagaj(join(korzen, "assets/projekt-domyslny.js"));
  projekt = globalThis.window.KX_PROJEKT_DOMYSLNY;
}

/* Projekt w starym kształcie (jedna lista sekcji) też ma prawo wejść. */
if (!Array.isArray(projekt.strony) && Array.isArray(projekt.sekcje)) {
  projekt = { ...projekt, strony: [{ id: "glowna", nazwa: "Strona główna",
    plik: "index.html", tytul: "", opis: "", sekcje: projekt.sekcje }] };
}

let razem = 0;
for (const strona of projekt.strony) {
  const dokument = globalThis.window.KX_STRONA.dokument(projekt, strona);
  writeFileSync(join(korzen, strona.plik), dokument);
  razem += dokument.length;
  console.log(`  ${strona.plik.padEnd(28)} ${String(dokument.length).padStart(7)} znaków`);
}
console.log(`Złożono ${projekt.strony.length} stron, razem ${(razem / 1024).toFixed(1)} kB.`);
