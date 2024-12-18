// ==UserScript==
// @name         PIM ORNO Custom Price Box with Notatnik
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @description  Skrypt do modyfikacji wyświetlania cen na stronie https://b2b.orno.pl. Ukrywa oryginalne elementy ceny, dodaje nowe z niestandardowymi cenami i rabatami oraz notatnik z możliwością edycji, przeciągania i zapisywania ustawień lokalnie. Umożliwia użytkownikowi dostosowanie widoczności różnych cen oraz posiada funkcjonalność przeciągania i skalowania okienka ustawień oraz notatnika, a także zapamiętuje ich pozycję i rozmiar.
// @author       Pa-Jong
// @match        https://b2b.orno.pl/*
// @require      https://pa-jong.github.io/ornoB2Bpricebox/ornoB2Bcustomprice.user.js
// @updateURL    https://pa-jong.github.io/ornoB2Bpricebox/update.json
// @downloadURL  https://pa-jong.github.io/ornoB2Bpricebox/ornoB2Bcustomprice.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.onload = function() {
        console.log("Strona w pełni załadowana. Uruchamiam skrypt...");
        dodajOkienkoUstawien();
        uruchomSkrypt();
    };

    function dodajOkienkoUstawien() {
        // Sprawdź, czy są zapisane ustawienia pozycji i rozmiaru
        let savedX = localStorage.getItem('ustawieniaDivX') || '10px';
        let savedY = localStorage.getItem('ustawieniaDivY') || '200px';
        let savedWidth = localStorage.getItem('ustawieniaDivWidth') || '250px';
        let savedHeight = localStorage.getItem('ustawieniaDivHeight') || 'auto';

        // Stwórz pływające okienko ustawień
        let ustawieniaDiv = document.createElement('div');
        ustawieniaDiv.style.position = 'fixed';
        ustawieniaDiv.style.top = savedY;
        ustawieniaDiv.style.left = savedX;
        ustawieniaDiv.style.width = savedWidth;
        ustawieniaDiv.style.height = savedHeight;
        ustawieniaDiv.style.backgroundColor = '#f4f4f4';
        ustawieniaDiv.style.border = '1px solid #ccc';
        ustawieniaDiv.style.padding = '5px';
        ustawieniaDiv.style.padding = "25px 5px 5px 5px";
        ustawieniaDiv.style.zIndex = '1000';
        ustawieniaDiv.id = 'ustawieniaDiv';
        ustawieniaDiv.style.overflow = 'auto'; // Dodane, aby zawartość była przewijalna, jeśli zajmie dużo miejsca
        ustawieniaDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';

        ustawieniaDiv.innerHTML = `
            <label><input type="checkbox" id="pokazCenaKatalogowa" checked> Fabryczna</label><br>
            <label><input type="checkbox" id="pokazCenaZakupu"> Zakupu</label><br>
            <label><input type="checkbox" id="pokazCenaInternet" checked> Internet</label><br>
            <label><input type="checkbox" id="pokazCenaAllegro" checked> Allegro</label><br>
            <label><input type="checkbox" id="pokazCenyBrutto" checked> Pokaż brutto</label><br>
            <label><input type="checkbox" id="pokazNotatnik"> Notatnik</label><br>
        `;

        document.body.appendChild(ustawieniaDiv);

        // Przywróć zapisane stany checkboxów po dodaniu elementów do DOM
        const checkboxIds = [
            'pokazCenaKatalogowa',
            'pokazCenaZakupu',
            'pokazCenaInternet',
            'pokazCenaAllegro',
            'pokazCenyBrutto',
            'pokazNotatnik'
        ];

        checkboxIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = localStorage.getItem(id) === 'true'; // Przywracanie ustawień
                checkbox.addEventListener('change', function() {
                    localStorage.setItem(id, checkbox.checked); // Zapisywanie ustawień
                    if (id === 'pokazNotatnik') toggleNotatnik(); // Toggle notatnik
                    uruchomSkrypt(); // Ponowne uruchomienie skryptu po zmianie
                });
            }
        });

        // Dodaj przezroczysty kwadracik do skalowania
        let resizer = document.createElement('div');
        resizer.style.width = '15px';
        resizer.style.height = '15px';
        resizer.style.background = 'transparent';
        resizer.style.position = 'absolute';
        resizer.style.right = '0';
        resizer.style.bottom = '0';
        resizer.style.cursor = 'nwse-resize';
        ustawieniaDiv.appendChild(resizer);

        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();

            function onMouseMove(e) {
                ustawieniaDiv.style.width = `${e.clientX - ustawieniaDiv.getBoundingClientRect().left}px`;
                ustawieniaDiv.style.height = `${e.clientY - ustawieniaDiv.getBoundingClientRect().top}px`;
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', onMouseMove);
                localStorage.setItem('ustawieniaDivWidth', ustawieniaDiv.style.width);
                localStorage.setItem('ustawieniaDivHeight', ustawieniaDiv.style.height);
            }, { once: true });
        });

        // Dodaj funkcjonalność przeciągania
        let ustawieniaHeader = document.createElement('div');
        ustawieniaHeader.style.width = '100%';
        ustawieniaHeader.style.height = '20px';
        ustawieniaHeader.style.cursor = 'move';
        ustawieniaHeader.style.position = 'absolute';
        ustawieniaHeader.style.top = '0';
        ustawieniaHeader.style.left = '0';
        ustawieniaHeader.style.backgroundColor = '#ddd';
        ustawieniaHeader.style.display = 'flex';
        ustawieniaHeader.style.alignItems = 'center';
        ustawieniaHeader.style.padding = '0 5px';
        ustawieniaHeader.style.boxSizing = 'border-box';

        ustawieniaHeader.innerHTML = `<span style="flex-grow: 1; user-select: none;">Ustawienia</span>`;
        ustawieniaDiv.insertBefore(ustawieniaHeader, ustawieniaDiv.firstChild);

        ustawieniaHeader.addEventListener('mousedown', function(e) {
            e.preventDefault();
            let offsetX = e.clientX - ustawieniaDiv.getBoundingClientRect().left;
            let offsetY = e.clientY - ustawieniaDiv.getBoundingClientRect().top;

            function onMouseMove(e) {
                ustawieniaDiv.style.left = `${e.clientX - offsetX}px`;
                ustawieniaDiv.style.top = `${e.clientY - offsetY}px`;
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', onMouseMove);
                localStorage.setItem('ustawieniaDivX', ustawieniaDiv.style.left);
                localStorage.setItem('ustawieniaDivY', ustawieniaDiv.style.top);
            }, { once: true });
        });

        // Wywołaj toggleNotatnik w celu wstępnej konfiguracji
        toggleNotatnik();
    }

    function toggleNotatnik() {
        const isVisible = document.getElementById('pokazNotatnik').checked;
        if (isVisible) {
            if (!document.getElementById('notatnikDiv')) {
                dodajNotatnik();
            }
        } else {
            const notatnikDiv = document.getElementById('notatnikDiv');
            if (notatnikDiv) notatnikDiv.remove();
        }
    }

    function dodajNotatnik() {
        // Sprawdź, czy są zapisane ustawienia pozycji i rozmiaru
        let savedX = localStorage.getItem('notatnikDivX') || '300px';
        let savedY = localStorage.getItem('notatnikDivY') || '200px';
        let savedWidth = localStorage.getItem('notatnikDivWidth') || '250px';
        let savedHeight = localStorage.getItem('notatnikDivHeight') || '200px';
        let savedContent = localStorage.getItem('notatnikContent') || '';

        // Stwórz pływające okienko notatnika
        let notatnikDiv = document.createElement('div');
        notatnikDiv.style.position = 'fixed';
        notatnikDiv.style.top = savedY;
        notatnikDiv.style.left = savedX;
        notatnikDiv.style.width = savedWidth;
        notatnikDiv.style.height = savedHeight;
        notatnikDiv.style.backgroundColor = '#ffffff';
        notatnikDiv.style.border = '1px solid #ccc';
        notatnikDiv.style.zIndex = '1000';
        notatnikDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        notatnikDiv.style.resize = 'both';
        notatnikDiv.style.overflow = 'auto';
        notatnikDiv.id = 'notatnikDiv';

        // Nagłówek do przeciągania
        let naglowek = document.createElement('div');
        naglowek.style.width = '100%';
        naglowek.style.height = '25px';
        naglowek.style.cursor = 'move';
        naglowek.style.backgroundColor = '#ddd';
        naglowek.style.position = 'absolute';
        naglowek.style.top = '0';
        naglowek.style.left = '0';
        naglowek.style.display = 'flex';
        naglowek.style.alignItems = 'center';
        naglowek.style.padding = '0 5px';
        naglowek.style.boxSizing = 'border-box';
        naglowek.innerHTML = `<span style="flex-grow: 1; user-select: none;">Notatnik</span>`;
        notatnikDiv.appendChild(naglowek);

        // Edytowalny textarea do notatnika
        let textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = 'calc(100% - 25px)';
        textarea.style.boxSizing = 'border-box';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.padding = "25px 5px 5px 5px";
        textarea.value = savedContent;
        textarea.addEventListener('input', function() {
            localStorage.setItem('notatnikContent', textarea.value);
        });
        notatnikDiv.appendChild(textarea);

        // Dodaj funkcje przeciągania i skalowania
        naglowek.addEventListener('mousedown', function(e) {
            e.preventDefault();
            let offsetX = e.clientX - notatnikDiv.getBoundingClientRect().left;
            let offsetY = e.clientY - notatnikDiv.getBoundingClientRect().top;

            function onMouseMove(e) {
                notatnikDiv.style.left = `${e.clientX - offsetX}px`;
                notatnikDiv.style.top = `${e.clientY - offsetY}px`;
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function() {
                document.removeEventListener('mousemove', onMouseMove);
                localStorage.setItem('notatnikDivX', notatnikDiv.style.left);
                localStorage.setItem('notatnikDivY', notatnikDiv.style.top);
            }, { once: true });
        });

        // Obsługa skalowania przy użyciu natywnego resize
        notatnikDiv.addEventListener('mouseup', function() {
            localStorage.setItem('notatnikDivWidth', notatnikDiv.style.width);
            localStorage.setItem('notatnikDivHeight', notatnikDiv.style.height);
        });

        document.body.appendChild(notatnikDiv);
    }

    // Funkcja formatująca cenę
    function formatujCene(cena) {
        const cenaNum = Number(cena);
        if (!isNaN(cenaNum)) {
            return cenaNum.toFixed(2).replace('.', ',') + ' zł';
        } else {
            console.error('Podana cena nie jest liczbą:', cena);
            return cena;
        }
    }

    function uruchomSkrypt() {
        console.log("Uruchomienie skryptu modyfikującego wyświetlanie cen...");

        let priceBoxes = document.querySelectorAll('.price-box.price-final_price');

        // Usuń poprzednie elementy cen
        document.querySelectorAll('.custom-price-box').forEach(el => el.remove());

        priceBoxes.forEach((priceBox) => {
            console.log("Znaleziono element: .price-box.price-final_price");

            priceBox.style.display = 'none';
            console.log("Oryginalny div został ukryty.");

            let cenaKatalogowaElement = priceBox.querySelector('[data-price-type="catalogPrice"]');
            let cenaZakupuElement = priceBox.querySelector('[data-price-type="finalPrice"]');

            if (cenaKatalogowaElement && cenaZakupuElement) {
                let cenaKatalogowaNetto = parseFloat(cenaKatalogowaElement.getAttribute('data-price-amount'));
                let cenaZakupuNetto = parseFloat(cenaZakupuElement.getAttribute('data-price-amount'));
                let rabatZakupu = ((1 - (cenaZakupuNetto / cenaKatalogowaNetto)) * 100).toFixed(2);

                let rabatInternet = 0.33;
                let rabatAllegro = 0.30;
                let vat = 1.23;

                let cenaInternetNetto = cenaKatalogowaNetto * (1 - rabatInternet);
                let cenaAllegroNetto = cenaKatalogowaNetto * (1 - rabatAllegro);

                let cenaKatalogowaBrutto = cenaKatalogowaNetto * vat;
                let cenaZakupuBrutto = cenaZakupuNetto * vat;
                let cenaInternetBrutto = cenaInternetNetto * vat;
                let cenaAllegroBrutto = cenaAllegroNetto * vat;

                console.log("Cena katalogowa netto: ", cenaKatalogowaNetto);
                console.log("Cena zakupu netto: ", cenaZakupuNetto);
                console.log("Cena internet netto: ", cenaInternetNetto);
                console.log("Cena Allegro netto: ", cenaAllegroNetto);
                console.log("Rabat od ceny katalogowej do zakupu: ", rabatZakupu + "%");

                let pokazCenaKatalogowa = document.getElementById('pokazCenaKatalogowa').checked;
                let pokazCenaZakupu = document.getElementById('pokazCenaZakupu').checked;
                let pokazCenaInternet = document.getElementById('pokazCenaInternet').checked;
                let pokazCenaAllegro = document.getElementById('pokazCenaAllegro').checked;
                let pokazCenyBrutto = document.getElementById('pokazCenyBrutto').checked;

                let newPriceBox = document.createElement('div');
                newPriceBox.className = 'custom-price-box';
                newPriceBox.style.margin = '10px 0'; // Dodane dla lepszego odstępu
                newPriceBox.innerHTML = `
                    <table class="price-table" style="width: 100%; border-collapse: collapse;">
                        ${pokazCenaKatalogowa ? `
                            <tr>
                                <td style="padding: 5px;">Katalogowa</td>
                                <td style="padding: 5px; font-weight: bold;" data-price="${cenaKatalogowaNetto}">${formatujCene(cenaKatalogowaNetto)}</td>
                                ${pokazCenyBrutto ? `<td style="padding: 5px; font-weight: bold;" data-price="${cenaKatalogowaBrutto}">${formatujCene(cenaKatalogowaBrutto)}</td>` : ''}
                            </tr>
                        ` : '' }
                        ${pokazCenaZakupu ? `
                            <tr>
                                <td style="padding: 5px;">Zakupu (${rabatZakupu}%)</td>
                                <td style="padding: 5px; font-weight: bold;" data-price="${cenaZakupuNetto}">${formatujCene(cenaZakupuNetto)}</td>
                                ${pokazCenyBrutto ? `<td style="padding: 5px; font-weight: bold;" data-price="${cenaZakupuBrutto}">${formatujCene(cenaZakupuBrutto)}</td>` : ''}
                            </tr>
                        ` : '' }

                        ${pokazCenaInternet ? `
                            <tr>
                                <td style="padding: 5px;">Internet</td>
                                <td style="padding: 5px; font-weight: bold;" data-price="${cenaInternetNetto}">${formatujCene(cenaInternetNetto)}</td>
                                ${pokazCenyBrutto ? `<td style="padding: 5px; font-weight: bold;" data-price="${cenaInternetBrutto}">${formatujCene(cenaInternetBrutto)}</td>` : ''}
                            </tr>
                        ` : '' }
                        ${pokazCenaAllegro ? `
                            <tr>
                                <td style="padding: 5px;">Allegro</td>
                                <td style="padding: 5px; font-weight: bold;" data-price="${cenaAllegroNetto}">${formatujCene(cenaAllegroNetto)}</td>
                                ${pokazCenyBrutto ? `<td style="padding: 5px; font-weight: bold;" data-price="${cenaAllegroBrutto}">${formatujCene(cenaAllegroBrutto)}</td>` : ''}
                            </tr>
                        ` : '' }
                    </table>
                `;

                priceBox.parentElement.insertBefore(newPriceBox, priceBox);
                console.log("Nowy div z cenami został dodany.");

                // Dodaj nasłuchiwacz zdarzenia do kopiowania ceny
                dodajNasluchiwaczeCen(newPriceBox);
            } else {
                console.error("Nie udało się znaleźć elementów ceny (katalogowej lub zakupu).");
            }
        });
    }

    // Funkcja do dodawania nasłuchiwaczy do elementów cen
    function dodajNasluchiwaczeCen(priceBox) {
        priceBox.querySelectorAll('td[data-price]').forEach(priceElement => {
            priceElement.addEventListener('click', function () {
                const cena = priceElement.getAttribute('data-price');
                if (cena) {
                    navigator.clipboard.writeText(cena).then(() => { // Kopiowanie bez "zł"
                        console.log(`Cena ${formatujCene(cena)} skopiowana do schowka.`);
                        pokazPopup(formatujCene(cena)); // Wywołanie funkcji do wyświetlenia popup
                    }).catch(err => {
                        console.error('Nie udało się skopiować ceny: ', err);
                    });
                } else {
                    console.error('Cena jest null, nie można skopiować.');
                }
            });
        });
    }

    function pokazPopup(cena) {
        // Sprawdź, czy popup już istnieje
        if (document.getElementById('cenaPopup')) return;

        // Funkcja do wyświetlania popup
        let popup = document.createElement('div');
        popup.id = 'cenaPopup';
        popup.className = 'popup';
        popup.innerText = `Cena skopiowana: ${cena}`;
        popup.style.position = 'fixed';
        popup.style.top = '20px'; // Zmiana na górę strony
        popup.style.right = '20px';
        popup.style.backgroundColor = '#4CAF50';
        popup.style.color = 'white';
        popup.style.padding = '10px';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = '1001';
        popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }
})();
