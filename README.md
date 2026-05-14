# Projekt-jQuery
Ten dokument zawiera szczegółowy opis funkcji logicznych i pomocniczych zaimplementowanych w pliku `script.js`.

---

## Zarządzanie danymi i stanem

### `zapiszDane()`
* **Opis**: Synchronizuje aktualny stan tablicy `zadania` oraz licznik `kolejneId` z pamięcią przeglądarki `localStorage`.
* **Zastosowanie**: Wywoływana po każdej operacji modyfikującej dane (dodanie, edycja, usunięcie, zmiana kolumny).

---

## Renderowanie Interfejsu

### `zbudujKarte(zadanie)`
* **Argumenty**: Obiekt `zadania`.
* **Zwraca**: String zawierający strukturę HTML karty (Template Literal).
* **Opis**: Generuje wizualną reprezentację zadania, przypisując odpowiednie klasy CSS dla priorytetów oraz wstawiając zabezpieczone dane tekstowe.

### `renderujTablice()`
* **Opis**: Główna funkcja odświeżająca widok Kanban.
    1. Czyści listy zadań we wszystkich kolumnach.
    2. Iteruje po tablicy `zadania`.
    3. Dodaje karty do odpowiednich kontenerów z efektem `fadeIn()`.
    4. Reinicjuje mechanizm Drag & Drop oraz aktualizuje liczniki.

### `renderujPusteKolumny()`
* **Opis**: Sprawdza, czy kolumna jest pusta. Jeśli tak, wstawia komunikat "Brak zadań", poprawiając czytelność UI.

### `aktualizujLiczniki()`
* **Opis**: Przelicza liczbę zadań dla każdej z kolumn oraz sumuje statystyki globalne wyświetlane w górnym pasku (`#pasekStatystyk`).

---

## Integracja z DataTables

### `inicjujTabele()`
* **Opis**: Konfiguruje i renderuje zaawansowaną tabelę pod tablicą Kanban.
    * Używa `tabela.destroy()`, aby umożliwić przeładowanie danych bez błędów inicjalizacji.
    * Definiuje przyciski eksportu (CSV, PDF, Druk).
    * Ustawia polską lokalizację interfejsu.

---

## Interakcje i Zdarzenia

### `inicjujPrzeciaganie()`
* **Opis**: Konfiguruje wtyczkę **jQuery UI Touch Punch / Draggable & Droppable**.
    * `.draggable()`: Definiuje parametry przeciągania (klonowanie, przezroczystość, z-index).
    * `.droppable()`: Obsługuje zdarzenie `drop`. Pobiera ID karty, zmienia przypisaną kolumnę w danych i wywołuje pełne przerysowanie aplikacji.

### `otworzModal(zadanie)`
* **Argumenty**: Obiekt zadania (edycja) lub `null` (nowe zadanie).
* **Opis**: Przygotowuje formularz w oknie modalnym Bootstrapa. Resetuje walidację, czyści pola lub wypełnia je danymi istniejącego zadania.

---

## Funkcje Pomocnicze i Filtry

### `zabezpieczHtml(str)`
* **Argumenty**: String.
* **Zwraca**: String z zamienionymi znakami specjalnymi na encje HTML.
* **Opis**: Funkcja typu "Sanitize" zapobiegająca atakom XSS (Cross-Site Scripting) przy wstawianiu tekstu do DOM.

### Obsługa Wyszukiwarki (`#wyszukiwarka.on('keyup')`)
* **Opis**: Funkcja anonimowa filtrująca karty "w locie". Przeszukuje tekst wewnątrz kart i używa `.show()` / `.hide()` wraz z klasą `.podswietlona` do prezentacji wyników.

### Przełącznik Motywu (`#przyciskMotywu.on('click')`)
* **Opis**: Zarządza atrybutem `data-theme="dark/light"` na tagu `<html>`. Zmienia tekst przycisku i zapisuje preferencje w `localStorage`.

---

## jQuery UI Datepicker
* **Opis**: Inicjalizacja pola `#poleTerminu` z polskim formatem daty `dd.mm.yy` oraz możliwością szybkiej zmiany miesiąca i roku.
