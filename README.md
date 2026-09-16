# Strona — Martyna Grobelna

Statyczna strona wizytówka gabinetu psychoterapii. Czysty HTML i CSS,
bez builda i bez zależności — GitHub Pages serwuje pliki wprost z gałęzi `main`.

## Adres

<https://paweljaneta-code.github.io/martyna-grobelna/>

## Pliki

| Plik | Co to |
|---|---|
| `index.html` | strona główna: hero, „jak pracuję", „formy spotkań", kontakt |
| `o-mnie.html` | rozwinięcie wizytówki — wykształcenie, doświadczenie |
| `terapia-indywidualna.html` | opis formy spotkań |
| `terapia-partnerska.html` | opis formy spotkań |
| `cennik.html` | ceny i zasady odwoływania |
| `styl.css` | jeden arkusz dla wszystkich podstron |
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
| zmienić kolejność sekcji | przeciągnij za uchwyt ⠿ w lewej kolumnie |
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

**Pobierz stronę** daje gotowy `index.html`, którym można podmienić obecny
plik w repozytorium.

### Czego redaktor świadomie nie robi

Nie pozwala przeciągać elementów w dowolne miejsce, jak w Canvie. Canva
projektuje na kartkę o stałym rozmiarze, a strona musi wyglądać dobrze od
360 px do 2560 px szerokości. Swobodne pozycjonowanie daje układ, który
rozpada się na telefonie — a telefon to większość odwiedzin. Stąd kontrola
nad kolejnością, stroną zdjęcia, wyrównaniem i odstępami zamiast nad
współrzędnymi.

## Jak wprowadzać zmiany

Strona nie ma etapu budowania, więc każda zmiana jest natychmiastowa:

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
