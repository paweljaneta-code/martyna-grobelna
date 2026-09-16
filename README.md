# Strona — Martyna Grobelna

Statyczna strona wizytówka gabinetu psychoterapii. Czysty HTML i CSS,
bez builda i bez zależności — GitHub Pages serwuje pliki wprost z gałęzi `main`.

## Adres

<https://paweljaneta-code.github.io/martyna-grobelna/>

## Pliki

| Plik | Co to |
|---|---|
| `index.html` i podstrony | **pliki składane, nie pisane ręcznie** — patrz niżej |
| `redaktor.html` | narzędzie do składania strony klikaniem |
| `assets/ikony.js` | 60 grafik kreską, w sześciu grupach |
| `assets/kroje.js` | spis 14 rodzin pisma do wyboru |
| `assets/strona.js` | generator strony — wspólny dla podglądu i eksportu |
| `assets/projekt-domyslny.js` | punkt wyjścia redaktora |
| `assets/fonty/` | pliki krojów (self-hosted, licencja OFL) |
| `assets/` | zdjęcia i favicon |
| `.nojekyll` | wyłącza przetwarzanie Jekyllem po stronie GitHuba |

## Redaktor — składanie strony bez dotykania kodu

Otwórz **[`redaktor.html`](redaktor.html)** w przeglądarce
(<https://paweljaneta-code.github.io/martyna-grobelna/redaktor.html> albo plik
z dysku). To narzędzie do złożenia strony klikaniem.

Co się w nim da:

| Chcesz | Jak |
|---|---|
| zmienić dowolny tekst | kliknij w niego wprost w podglądzie i pisz |
| przejść na inną podstronę | spis **Strony** na samej górze lewej kolumny |
| dodać podstronę | przycisk **+ Nowa podstrona** |
| zmienić kolejność sekcji | przeciągnij za uchwyt ⠿ w lewej kolumnie |
| **przesunąć element** | zaznacz sekcję → **Zamień na swobodne płótno**, potem chwyć niebieskie kółko na bloku |
| **zmienić rozmiar elementu** | chwyć żółty róg bloku na płótnie |
| zmienić kolor sekcji albo bloku | pola koloru w panelu po prawej |
| ukryć sekcję bez kasowania | ikona oka przy jej nazwie |
| dodać sekcję | lista „+ Dodaj sekcję" pod spisem |
| zmienić grafikę | kliknij ją w podglądzie — otworzy się spis 60 rysunków |
| wgrać zdjęcie | kliknij miejsce na zdjęcie albo użyj panelu po prawej |
| zmienić kroje i kolory | zakładka **Motyw** po prawej (14 rodzin pisma) |
| zobaczyć telefon | przełącznik **Telefon / Tablet / Pulpit** u góry |
| cofnąć błąd | Ctrl+Z (Ctrl+Shift+Z ponawia) |

Praca zapisuje się sama w przeglądarce — zamknięcie karty jej nie kasuje.
Ale **zapis siedzi tylko na tym komputerze i w tej przeglądarce**, więc kiedy
skończysz, kliknij **Pobierz projekt**. Dostaniesz plik `projekt-strony.json`
z każdą decyzją: tekstami, krojami, kolorami, kolejnością sekcji i zdjęciami.
Ten plik odsyłasz — z niego widać dokładnie, jak ma wyglądać strona.

**Pobierz strony** daje komplet plików HTML do podmiany w repozytorium
(pobierają się jeden po drugim, z przerwą — przeglądarki blokują serię pobrań
wystrzeloną naraz).

### Swobodne płótno — jak to działa

**Zwykłe sekcje mają układ ustalony i nic się w nich nie przesuwa.** To nie
usterka: powitanie, filary i karty oferty mają wyglądać tak samo za każdym
razem. Kiedy chcesz elementy poprzestawiać, zaznacz sekcję i kliknij
**Zamień na swobodne płótno**.

Zamiana **zachowuje wygląd**, a nie tylko treść: biała karta zostaje kartą,
portret zostaje w swoim kształcie, nagłówek zachowuje krój, wielkość
i grubość, proza zostaje justowana, a pas tła pod kontaktem zostaje pasem.
Odtwarza je blok „panel" (biała karta pod treścią, w niższej warstwie)
oraz **rola** bloku — zapisana w nim informacja o tym, czym był w układzie
ustalonym. Zamiana zmienia więc sposób edycji, nie wygląd.

Dwie rzeczy, których nie da się przenieść co do piksela: odstępy pionowe
wynikają z siatki, a nie z przepływu tekstu, więc bywają o kilka pikseli
inne; portret dostaje proporcje z siatki zamiast stałego stosunku boków.

Sekcja **Swobodne płótno** trzyma bloki, które przesuwa się myszą: nagłówki,
teksty, miejsca na zdjęcia, grafiki i przyciski. Każdy ma własny kolor pisma,
własne tło, wyrównanie i wielkość. Uchwyty pokazują się po najechaniu na blok:
**niebieskie kółko** przesuwa, **żółty róg** zmienia rozmiar.

Bloki wolno na siebie nasunąć — płótno tego nie blokuje, bo bywa potrzebne.
Jeśli zrobisz to przez pomyłkę, cofa Ctrl+Z.

Bloki **przyciągają się do siatki dwunastu kolumn**, a nie stają w dowolnym
punkcie. To celowe. Canva projektuje na kartkę o stałym rozmiarze; strona musi
wyglądać dobrze od 360 px do 2560 px, a telefon to większość odwiedzin.
Przy dowolnych współrzędnych telefon dostaje układ w kawałkach.

Na ekranie węższym niż 760 px płótno przestaje być siatką i układa bloki
w jedną kolumnę — **od góry do dołu, a przy równej wysokości od lewej do
prawej**. Czyli kolejność na telefonie wynika z tego, gdzie postawisz bloki
na płótnie.

## Pułapka: plików HTML nie edytuje się ręcznie

`index.html`, `o-mnie.html`, `terapia-indywidualna.html`,
`terapia-partnerska.html` i `cennik.html` **powstają z projektu**, a nie są
pisane ręcznie. Poprawka wpisana wprost w plik zniknie przy najbliższej
przebudowie. Zmiany wprowadza się w redaktorze albo w
`assets/projekt-domyslny.js`, a potem:

```bash
node scripts/zbuduj-strony.mjs                      # z projektu domyślnego
node scripts/zbuduj-strony.mjs projekt-strony.json  # z pliku z redaktora
```

Z tego samego powodu nie ma osobnego `styl.css`: wygląd opisuje funkcja
`css()` w `assets/strona.js`, a redaktor i gotowa strona biorą go stamtąd.
Dwa arkusze stylów rozjechałyby się po tygodniu.

## Jak wprowadzać zmiany

Strona nie ma etapu budowania po stronie GitHuba — po przebudowie wystarczy:

```bash
git add -A && git commit -m "opis zmiany" && git push
```

GitHub Pages przebudowuje się w kilkanaście sekund do minuty. Podgląd lokalny —
wystarczy otworzyć `index.html` w przeglądarce, albo:

```bash
python3 -m http.server 8000
```

## Kroje pisma

Czternaście rodzin leży w `assets/fonty/` i jest serwowanych z tego
repozytorium, nie z CDN-u Google — wczytanie kroju z `fonts.gstatic.com`
wysyła adres IP każdej osoby odwiedzającej stronę na serwery Google, co przy
gabinecie psychoterapii jest zbędnym przetwarzaniem danych. Wszystkie są na
licencji SIL Open Font License 1.1, więc wolno je hostować u siebie.

Żeby dołożyć albo zdjąć rodzinę: dopisz ją w `scripts/pobierz-kroje.mjs`
i uruchom `node scripts/pobierz-kroje.mjs`. Skrypt przebudowuje
`assets/fonty.css` i `assets/kroje.js` — ręcznie ich nie edytuj.

## Kolory

Kolory obecnej strony stoją w zmiennych na górze `styl.css` (blok `:root`);
w redaktorze zmienia się je w zakładce Motyw.

## Czego jeszcze brakuje

Lista rzeczy do uzupełnienia: [`TRESCI.md`](TRESCI.md).
