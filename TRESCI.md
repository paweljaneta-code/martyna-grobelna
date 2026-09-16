# Co trzeba uzupełnić

Wszystkie teksty są **zastępcze**. Uzupełnia się je w redaktorze:

**<https://paweljaneta-code.github.io/martyna-grobelna/redaktor.html>**

> **Nie edytuj plików HTML ręcznie.** `index.html` i podstrony są składane
> z projektu przez `scripts/zbuduj-strony.mjs`; poprawka wpisana wprost
> w plik zniknie przy najbliższej przebudowie.

Po skończeniu kliknij **Pobierz projekt** — plik `projekt-strony.json`
niesie każdą decyzję i to jego się odsyła.

## Dane, bez których strona nie może pójść w świat

- [ ] **Adres e-mail** — dziś wszędzie stoi `kontakt@example.com`
      (sekcja Kontakt na stronie głównej oraz stopka każdej podstrony).
- [ ] **Adres gabinetu** — dziś `ul. Przykładowa 1, 00-000 Warszawa`.
- [ ] **Godziny przyjęć** — trzecia kolumna sekcji Kontakt.
- [ ] **Kwoty w cenniku** — dziś `000 zł` w czterech pozycjach.
- [ ] **Zdjęcie portretowe** — w sekcji Powitanie na stronie głównej
      i w bloku zdjęcia na płótnie podstrony „O mnie".

## Teksty do napisania

- [ ] Akapit powitalny na stronie głównej.
- [ ] Trzy karty „Jak pracuję?" — różnorodność, nurty, struktura.
      **Nurty są przykładowe** (ACT, CFT, MI, IBCT): podmień na te,
      w których Martyna naprawdę pracuje.
- [ ] Opisy obu form spotkań — na stronie głównej i na ich podstronach.
- [ ] Cała podstrona „O mnie": wykształcenie, doświadczenie, superwizja,
      nazwa towarzystwa, którego kodeksu etycznego dotyczy zapis.
- [ ] Czas trwania i częstotliwość spotkań — wartości w opisach
      (50 min indywidualnie, 80 min para) są typowe, nie ustalone.

## Rzeczy do rozstrzygnięcia

- [ ] **Formy gramatyczne.** Teksty są pisane w pierwszej osobie czasu
      teraźniejszego, czyli bez rodzaju („pracuję", „zapraszam") — celowo.
      Rodzaj pada tylko w dwóch miejscach: „psycholożką i psychoterapeutką"
      w powitaniu oraz „psycholożka i psychoterapeutka" na podstronie
      „O mnie". Jeśli Martyna woli inne formy, to dwie poprawki.
- [ ] **Mapa dojazdu** — miejsce zostawione puste. Osadzenie Google Maps
      wciąga skrypty śledzące; decyzja należy do właścicielki strony.
      Kod osadzenia wkleja się w panelu sekcji Kontakt.
- [ ] **Wersja angielska** — wzorzec miał przełącznik `PL`. Tutaj go nie ma.
- [ ] **Polityka prywatności** — potrzebna, jeśli dojdzie formularz
      kontaktowy, mapa Google albo jakakolwiek analityka. Przy samym
      adresie e-mail nie.
- [ ] **Własna domena** — patrz niżej.

## Własna domena, kiedy przyjdzie pora

1. W katalogu repozytorium: `echo "www.domena.pl" > CNAME`, commit, push.
2. U rejestratora rekord `CNAME` dla `www` → `paweljaneta-code.github.io`.
3. Dla domeny bez `www` — cztery rekordy `A` na adresy GitHuba:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. Settings → Pages → Custom domain, a po propagacji DNS zaznacz
   „Enforce HTTPS".
