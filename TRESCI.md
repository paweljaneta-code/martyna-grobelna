# Co trzeba uzupełnić

Wszystkie teksty na stronie są **zastępcze**. W plikach HTML oznaczono je
komentarzami `<!-- TEKST ZASTĘPCZY -->` i `<!-- DANE ZASTĘPCZE -->`.
Szybkie znalezienie wszystkich miejsc:

```bash
grep -rn "ZASTĘPCZ" *.html
```

## Dane, bez których strona nie może pójść w świat

- [ ] **Adres e-mail** — dziś wszędzie stoi `kontakt@example.com`
      (`index.html` w dwóch miejscach, stopka każdej podstrony).
- [ ] **Adres gabinetu** — dziś `ul. Przykładowa 1, 00-000 Warszawa`.
- [ ] **Godziny przyjęć** — tabela w sekcji „Kontakt".
- [ ] **Kwoty w cenniku** — dziś `000 zł` w czterech pozycjach.
- [ ] **Zdjęcie portretowe** — `assets/portret.svg` to zastępnik.
      Wstaw `assets/portret.jpg` (proporcje mniej więcej kwadratowe,
      około 800 × 840 px, do 300 kB) i popraw `src` w `index.html`.

## Teksty do napisania

- [ ] Akapit powitalny w hero (`index.html`).
- [ ] Trzy akapity w sekcji „Jak pracuję?" — różnorodność, nurty, struktura.
      **Nurty wymienione w tekście są przykładowe** (ACT, CFT, MI, IBCT) —
      podmień na te, w których Martyna naprawdę pracuje.
- [ ] Opisy obu form spotkań na stronie głównej i na podstronach.
- [ ] Cała podstrona `o-mnie.html`: wykształcenie, doświadczenie, superwizja,
      nazwa towarzystwa, którego kodeksu etycznego dotyczy zapis.
- [ ] Czas trwania i częstotliwość spotkań — w opisach stoją wartości typowe
      (50 min indywidualnie, 80 min para), nie ustalone.

## Rzeczy do rozstrzygnięcia

- [ ] **Formy gramatyczne.** Teksty są pisane w pierwszej osobie czasu
      teraźniejszego, czyli bez rodzaju („pracuję", „zapraszam") — celowo.
      Rodzaj pojawia się wyłącznie w dwóch miejscach: „psycholożką
      i psychoterapeutką" (hero oraz `o-mnie.html`). Jeśli Martyna woli inne
      formy, to dwie linie do zmiany.
- [ ] **Mapa dojazdu** — miejsce zostawione puste. Osadzenie Google Maps wciąga
      skrypty śledzące; decyzja należy do właścicielki strony.
- [ ] **Wersja angielska** — wzorzec ma przełącznik `PL`. Tutaj go nie ma.
      Dołożenie oznacza drugi komplet plików w katalogu `en/`.
- [ ] **Polityka prywatności** — potrzebna, jeśli dojdzie formularz kontaktowy,
      mapa Google albo jakakolwiek analityka. Przy samym adresie e-mail nie.
- [ ] **Własna domena** — patrz sekcja niżej.

## Własna domena, kiedy przyjdzie pora

1. W katalogu repozytorium: `echo "www.domena.pl" > CNAME`, commit, push.
2. U rejestratora domeny rekord `CNAME` dla `www` → `paweljaneta-code.github.io`.
3. Dla domeny bez `www` — cztery rekordy `A` na adresy GitHuba:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. W repozytorium: Settings → Pages → Custom domain → wpisz domenę,
   a po propagacji DNS zaznacz „Enforce HTTPS".
