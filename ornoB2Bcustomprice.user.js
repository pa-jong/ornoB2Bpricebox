// ==UserScript==
// @name         PIM ORNO Custom Price Box
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Skrypt jest przeznaczony do modyfikacji wyświetlania cen na stronie https://b2b.orno.pl. Ukrywa oryginalne elementy ceny i dodaje nowe z niestandardowymi cenami i rabatami. Umożliwia użytkownikowi dostosowanie widoczności różnych cen (fabrycznej, zakupu, internetowej, allegro) oraz pokazanie cen brutto. Posiada funkcjonalność przeciągania i skalowania okienka ustawień oraz zapamiętuje jego pozycję i rozmiar. Jeśli masz dodatkowe pytania lub potrzebujesz modyfikacji, daj znać!
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
        let savedWidth = localStorage.getItem('ustawieniaDivWidth') || '200px';
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
        ustawieniaDiv.style.padding = '10px';
        ustawieniaDiv.style.zIndex = '1000';
        ustawieniaDiv.style.resize = 'both';
        ustawieniaDiv.style.overflow = 'hidden';
        ustawieniaDiv.id = 'ustawieniaDiv';

        ustawieniaDiv.innerHTML = `
            <strong>Ustawienia cen:</strong><br>
            <label><input type="checkbox" id="pokazCenaKatalogowa" checked> Fabryczna</label><br>
            <label><input type="checkbox" id="pokazCenaZakupu"> Zakupu</label><br>
            <label><input type="checkbox" id="pokazCenaInternet" checked> Internet</label><br>
            <label><input type="checkbox" id="pokazCenaAllegro" checked> Allegro</label><br>
            <label><input type="checkbox" id="pokazCenyBrutto" checked> Pokaż brutto</label><br>
        `;

        document.body.appendChild(ustawieniaDiv);

        // Dodaj funkcjonalność przeciągania
        ustawieniaDiv.addEventListener('mousedown', function(e) {
            if (e.target === ustawieniaDiv) {
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
                    localStorage.setItem('ustawieniaDivWidth', ustawieniaDiv.style.width);
                    localStorage.setItem('ustawieniaDivHeight', ustawieniaDiv.style.height);
                }, { once: true });
            }
        });

        // Nasłuchuj zmiany w checkboxach
        ustawieniaDiv.querySelectorAll('input[type=checkbox]').forEach(checkbox => {
            checkbox.addEventListener('change', uruchomSkrypt);
        });
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
        console.log("Uruchamianie głównej funkcji skryptu...");

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

                let pokazCenaKatalogowa = document.getElementById('pokazCenaKatalogowa').checked;
                let pokazCenaZakupu = document.getElementById('pokazCenaZakupu').checked;
                let pokazCenaInternet = document.getElementById('pokazCenaInternet').checked;
                let pokazCenaAllegro = document.getElementById('pokazCenaAllegro').checked;
                let pokazCenyBrutto = document.getElementById('pokazCenyBrutto').checked;

                let newPriceBox = document.createElement('div');
                newPriceBox.className = 'custom-price-box';
                newPriceBox.innerHTML = `
                    <table class="price-table">
                        ${pokazCenaKatalogowa ? `<tr><td>Katalogowa</td><td style="font-weight: bold;" data-price="${cenaKatalogowaNetto}">${formatujCene(cenaKatalogowaNetto)}</td>${pokazCenyBrutto ? `<td style="font-weight: bold;" data-price="${cenaKatalogowaBrutto}">${formatujCene(cenaKatalogowaBrutto)}</td>` : ''}</tr>` : ''}
                        ${pokazCenaZakupu ? `<tr><td>Zakupu</td><td style="font-weight: bold;" data-price="${cenaZakupuNetto}">${formatujCene(cenaZakupuNetto)}</td>${pokazCenyBrutto ? `<td style="font-weight: bold;" data-price="${cenaZakupuBrutto}">${formatujCene(cenaZakupuBrutto)}</td>` : ''}</tr>` : ''}
                        ${pokazCenaInternet ? `<tr><td>Internet</td><td style="font-weight: bold;" data-price="${cenaInternetNetto}">${formatujCene(cenaInternetNetto)}</td>${pokazCenyBrutto ? `<td style="font-weight: bold;" data-price="${cenaInternetBrutto}">${formatujCene(cenaInternetBrutto)}</td>` : ''}</tr>` : ''}
                        ${pokazCenaAllegro ? `<tr><td>Allegro</td><td style="font-weight: bold;" data-price="${cenaAllegroNetto}">${formatujCene(cenaAllegroNetto)}</td>${pokazCenyBrutto ? `<td style="font-weight: bold;" data-price="${cenaAllegroBrutto}">${formatujCene(cenaAllegroBrutto)}</td>` : ''}</tr>` : ''}
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
        // Funkcja do wyświetlania popup
        let popup = document.createElement('div');
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
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 3000);
    }
})();
