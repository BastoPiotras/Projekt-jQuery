$(function () {

  /* ==================================================================================
     DANE
  ================================================================================== */
  let zadania = JSON.parse(localStorage.getItem('kanban_zadania') || '[]');
  let kolejneId = parseInt(localStorage.getItem('kanban_kolejneId') || '1');
  let tabela;

  const nazwyKolumn    = { todo: 'Do zrobienia', inprogress: 'W toku', done: 'Gotowe' };
  const nazwyPriorytetu = { niski: 'Niski', sredni: 'Średni', wysoki: 'Wysoki' };

  function zapiszDane() {
    localStorage.setItem('kanban_zadania', JSON.stringify(zadania));
    localStorage.setItem('kanban_kolejneId', kolejneId);
  }

  /* ==================================================================================
     BUDOWANIE KARTY
  ================================================================================== */
  function zbudujKarte(zadanie) {
    const klasaPriorytetu   = 'priorytet-' + zadanie.priorytet;
    const etykietaPriorytetu = nazwyPriorytetu[zadanie.priorytet] || zadanie.priorytet;
    return `
      <div class="karta-zadania" data-id="${zadanie.id}" style="display:none">
        <div class="tytul-zadania">${zabezpieczHtml(zadanie.tytul)}</div>
        ${zadanie.opis ? `<div class="opis-zadania">${zabezpieczHtml(zadanie.opis)}</div>` : ''}
        <div class="meta-zadania">
          <span class="znacznik-priorytetu ${klasaPriorytetu}">${etykietaPriorytetu}</span>
          <div class="d-flex align-items-center gap-2">
            ${zadanie.data ? `<span class="data-zadania">📅 ${zadanie.data}</span>` : ''}
            <div class="akcje-karty">
              <button class="przycisk-edytuj" title="Edytuj">✏️</button>
              <button class="przycisk-usun" title="Usuń">🗑️</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ==================================================================================
     RENDEROWANIE TABLICY
  ================================================================================== */
  function renderujTablice() {
    ['todo', 'inprogress', 'done'].forEach(kolumna => {
      $('#lista-' + kolumna).empty();
    });

    zadania.forEach(zadanie => {
      const $karta = $(zbudujKarte(zadanie));
      $('#lista-' + zadanie.kolumna).append($karta);
      $karta.fadeIn(300);
    });

    inicjujPrzeciaganie();
    aktualizujLiczniki();
    renderujPusteKolumny();
  }

  function renderujPusteKolumny() {
    ['todo', 'inprogress', 'done'].forEach(kolumna => {
      const $lista = $('#lista-' + kolumna);
      $lista.find('.pusta-kolumna').remove();
      if ($lista.children('.karta-zadania').length === 0) {
        $lista.append('<div class="pusta-kolumna">Brak zadań</div>');
      }
    });
  }

  /* ==================================================================================
     DATATABLES
  ================================================================================== */
  function inicjujTabele() {
    if (tabela) { tabela.destroy(); }
    $('#cialoTabeli').empty();

    zadania.forEach((zadanie, i) => {
      const klasaPriorytetu   = 'priorytet-' + zadanie.priorytet;
      const etykietaPriorytetu = nazwyPriorytetu[zadanie.priorytet] || zadanie.priorytet;
      $('#cialoTabeli').append(`
        <tr>
          <td>${i + 1}</td>
          <td><strong>${zabezpieczHtml(zadanie.tytul)}</strong></td>
          <td>${zabezpieczHtml(zadanie.opis || '—')}</td>
          <td><span class="znacznik-priorytetu ${klasaPriorytetu}">${etykietaPriorytetu}</span></td>
          <td>${nazwyKolumn[zadanie.kolumna]}</td>
          <td>${zadanie.data || '—'}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary py-0 tbl-edytuj" data-id="${zadanie.id}" style="font-size:.75rem">Edytuj</button>
            <button class="btn btn-sm btn-outline-danger py-0 tbl-usun" data-id="${zadanie.id}" style="font-size:.75rem">Usuń</button>
          </td>
        </tr>`);
    });

    tabela = $('#tabelaZadan').DataTable({
      destroy: true,
      language: {
        url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pl.json',
        search: 'Szukaj:',
        lengthMenu: 'Pokaż _MENU_ wpisów',
        info: 'Pokazuje _START_ do _END_ z _TOTAL_ wpisów',
        paginate: { previous: '‹', next: '›' }
      },
      dom: 'Bfrtip',
      buttons: [
        { extend: 'csvHtml5',  text: '📥 CSV',    className: 'btn btn-sm btn-outline-secondary' },
        { extend: 'pdfHtml5',  text: '📄 PDF',    className: 'btn btn-sm btn-outline-secondary',
          customize: function(doc) { doc.defaultStyle.fontSize = 9; }
        },
        { extend: 'print',     text: '🖨️ Drukuj', className: 'btn btn-sm btn-outline-secondary' }
      ],
      columnDefs: [{ orderable: false, targets: 6 }],
      order: [[0, 'asc']],
      pageLength: 5
    });
  }

  /* ==================================================================================
     LICZNIKI I STATYSTYKI
  ================================================================================== */
  function aktualizujLiczniki() {
    ['todo', 'inprogress', 'done'].forEach(kolumna => {
      const liczba = zadania.filter(z => z.kolumna === kolumna).length;
      $('#licznik-' + kolumna).text(liczba);
    });
    $('#statWszystkich').text(zadania.length);
    $('#statDoZrobienia').text(zadania.filter(z => z.kolumna === 'todo').length);
    $('#statWToku').text(zadania.filter(z => z.kolumna === 'inprogress').length);
    $('#statGotowe').text(zadania.filter(z => z.kolumna === 'done').length);
  }

  /* ==================================================================================
     PRZECIĄGANIE I UPUSZCZANIE — jQuery UI
  ================================================================================== */
  function inicjujPrzeciaganie() {
    $('.karta-zadania').draggable({
      revert: 'invalid',
      containment: '#tablicaKanban',
      helper: 'clone',
      opacity: 0.85,
      zIndex: 9999,
      start: function() { $(this).addClass('przeciagana'); },
      stop:  function() { $(this).removeClass('przeciagana'); }
    });

    $('.lista-zadan').droppable({
      accept: '.karta-zadania',
      hoverClass: 'ui-droppable-hover',
      drop: function(e, ui) {
        const idZadania  = parseInt(ui.draggable.attr('data-id'));
        const nowaKolumna = $(this).attr('id').replace('lista-', '');
        const zadanie    = zadania.find(z => z.id === idZadania);
        if (zadanie && zadanie.kolumna !== nowaKolumna) {
          zadanie.kolumna = nowaKolumna;
          zapiszDane();
          renderujTablice();
          inicjujTabele();
        }
      }
    });
  }

  /* ==================================================================================
     MODAL I FORMULARZ
  ================================================================================== */
  const $modal = new bootstrap.Modal('#modalZadania');

  function otworzModal(zadanie) {
    $('#formularzZadania')[0].reset();
    $('#formularzZadania').validate().resetForm();
    $('.error').removeClass('error');

    if (zadanie) {
      $('#tytulModalu').text('Edytuj zadanie');
      $('#idEdycji').val(zadanie.id);
      $('#poleTytulu').val(zadanie.tytul);
      $('#poleOpisu').val(zadanie.opis);
      $('#polePriorytetu').val(zadanie.priorytet);
      $('#poleKolumny').val(zadanie.kolumna);
      $('#poleTerminu').val(zadanie.data);
    } else {
      $('#tytulModalu').text('Dodaj zadanie');
      $('#idEdycji').val('');
    }
    $modal.show();
  }

  /* Przyciski otwierające modal */
  $('#przyciskDodajZadanie').on('click', function() { otworzModal(null); });
  $('.przycisk-dodaj-karte').on('click', function() {
    otworzModal(null);
    $('#poleKolumny').val($(this).data('kolumna'));
  });

  /* ==================================================================================
     JQUERY VALIDATE — walidacja formularza
  ================================================================================== */
  $('#formularzZadania').validate({
    rules: {
      poleTytulu:    { required: true, minlength: 3 },
      polePriorytetu: { required: true },
      poleKolumny:   { required: true }
    },
    messages: {
      poleTytulu: {
        required:  'Tytuł jest wymagany.',
        minlength: 'Tytuł musi mieć co najmniej 3 znaki.'
      },
      polePriorytetu: { required: 'Wybierz priorytet.' },
      poleKolumny:    { required: 'Wybierz kolumnę.' }
    },
    errorPlacement: function(blad, element) {
      blad.insertAfter(element);
    },
    submitHandler: function() {}   /* blokujemy domyślne wysłanie formularza */
  });

  /* ==================================================================================
     ZAPISYWANIE ZADANIA
  ================================================================================== */
  $('#przyciskZapiszZadanie').on('click', function() {
    if (!$('#formularzZadania').valid()) return;

    const id        = parseInt($('#idEdycji').val()) || null;
    const tytul     = $('#poleTytulu').val().trim();
    const opis      = $('#poleOpisu').val().trim();
    const priorytet = $('#polePriorytetu').val();
    const kolumna   = $('#poleKolumny').val();
    const data      = $('#poleTerminu').val().trim();

    if (id) {
      /* Edycja istniejącego zadania */
      const zadanie = zadania.find(z => z.id === id);
      if (zadanie) { Object.assign(zadanie, { tytul, opis, priorytet, kolumna, data }); }
    } else {
      /* Dodanie nowego zadania */
      zadania.push({ id: kolejneId++, tytul, opis, priorytet, kolumna, data });
    }

    zapiszDane();
    $modal.hide();
    renderujTablice();
    inicjujTabele();
  });

  /* ==================================================================================
     USUWANIE I EDYCJA — przyciski na kartach
  ================================================================================== */
  $(document).on('click', '.przycisk-usun', function() {
    const id = parseInt($(this).closest('.karta-zadania').attr('data-id'));
    const $karta = $(this).closest('.karta-zadania');
    $karta.slideUp(300, function() {
      zadania = zadania.filter(z => z.id !== id);
      zapiszDane();
      renderujTablice();
      inicjujTabele();
    });
  });

  $(document).on('click', '.przycisk-edytuj', function() {
    const id = parseInt($(this).closest('.karta-zadania').attr('data-id'));
    otworzModal(zadania.find(z => z.id === id));
  });

  /* Przyciski w tabeli */
  $(document).on('click', '.tbl-edytuj', function() {
    otworzModal(zadania.find(z => z.id === parseInt($(this).data('id'))));
  });
  $(document).on('click', '.tbl-usun', function() {
    const id = parseInt($(this).data('id'));
    if (confirm('Usunąć to zadanie?')) {
      zadania = zadania.filter(z => z.id !== id);
      zapiszDane();
      renderujTablice();
      inicjujTabele();
    }
  });

  /* ==================================================================================
     EFEKT HOVER NA KARTACH — css() / addClass
  ================================================================================== */
  $(document).on('mouseenter', '.karta-zadania', function() {
    $(this).css('border-left', '3px solid var(--accent)');
  }).on('mouseleave', '.karta-zadania', function() {
    $(this).css('border-left', '');
  });

  /* ==================================================================================
     WYSZUKIWANIE NA ŻYWO — zdarzenie keyup
  ================================================================================== */
  $('#wyszukiwarka').on('keyup', function() {
    const fraza = $(this).val().toLowerCase().trim();
    $('.karta-zadania').each(function() {
      const tekst = $(this).text().toLowerCase();
      if (!fraza || tekst.includes(fraza)) {
        $(this).addClass('podswietlona').show();
      } else {
        $(this).removeClass('podswietlona').hide();
      }
    });
  });

  /* ==================================================================================
     PRZEŁĄCZNIK MOTYWU — toggleClass / addClass
  ================================================================================== */
  const czyciemny = () => $('html').attr('data-theme') === 'dark';

  $('#przyciskMotywu').on('click', function() {
    if (czyciemny()) {
      $('html').attr('data-theme', 'light');
      $(this).text('🌙 Ciemny');
    } else {
      $('html').attr('data-theme', 'dark');
      $(this).text('☀️ Jasny');
    }
    localStorage.setItem('kanban_motyw', $('html').attr('data-theme'));
  });

  /* Przywracanie zapisanego motywu */
  const zapisanyMotyw = localStorage.getItem('kanban_motyw');
  if (zapisanyMotyw) {
    $('html').attr('data-theme', zapisanyMotyw);
    $('#przyciskMotywu').text(zapisanyMotyw === 'dark' ? '☀️ Jasny' : '🌙 Ciemny');
  }

  /* ==================================================================================
     DATEPICKER — jQuery UI
  ================================================================================== */
  $('#poleTerminu').datepicker({
    dateFormat: 'dd.mm.yy',
    changeMonth: true,
    changeYear: true
  });

  /* ==================================================================================
     DANE PRZYKŁADOWE (jeśli localStorage jest pusty)
  ================================================================================== */
  if (zadania.length === 0) {
    zadania = [
      { id: kolejneId++, tytul: 'Zaprojektować UI dla pluginów', opis: 'Zrobić UI dla zaklętego kowadła',     priorytet: 'wysoki', kolumna: 'todo',       data: '20.05.2025' },
      { id: kolejneId++, tytul: 'Napisać do Ananim',            opis: 'Przypomnieć o pieniądze',              priorytet: 'sredni', kolumna: 'inprogress', data: '25.05.2025' },
      { id: kolejneId++, tytul: 'Test z niemieckiego',          opis: 'Nauczyć się na test',                  priorytet: 'niski',  kolumna: 'todo',       data: '30.05.2025' },
      { id: kolejneId++, tytul: 'Dodać mody na serwer mc',      opis: 'Zrobić specjalne itemy z efektami',    priorytet: 'wysoki', kolumna: 'done',       data: '15.05.2025' },
      { id: kolejneId++, tytul: 'README.md',                    opis: 'Dokumentacja projektu',                priorytet: 'niski',  kolumna: 'done',       data: '14.05.2025' },
    ];
    zapiszDane();
  }

  /* ==================================================================================
     INICJALIZACJA
  ================================================================================== */
  renderujTablice();
  inicjujTabele();

  /* ==================================================================================
     FUNKCJE POMOCNICZE
  ================================================================================== */
  function zabezpieczHtml(str) {
    return $('<div>').text(str || '').html();
  }

});
