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
| `assets/` | zdjęcia i favicon |
| `.nojekyll` | wyłącza przetwarzanie Jekyllem po stronie GitHuba |

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

## Kolory i kroje

Wszystko stoi w zmiennych na górze `styl.css` (blok `:root`). Zmiana motywu to
podmiana kilku wartości, bez szukania po całym pliku.

## Czego jeszcze brakuje

Lista rzeczy do uzupełnienia: [`TRESCI.md`](TRESCI.md).
