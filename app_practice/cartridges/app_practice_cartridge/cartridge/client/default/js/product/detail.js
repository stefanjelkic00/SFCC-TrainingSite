'use strict';

var base = require('base/product/detail');

module.exports = {
    // Postojeće base funkcionalnosti
    availability: base.availability,
    addToCart: base.addToCart,
    updateAttributesAndDetails: base.updateAttributesAndDetails,
    showSpinner: base.showSpinner,
    updateAttribute: base.updateAttribute,
    updateAddToCart: base.updateAddToCart,
    updateAvailability: base.updateAvailability,
    sizeChart: base.sizeChart,
    copyProductLink: base.copyProductLink,
    focusChooseBonusProductModal: base.focusChooseBonusProductModal,
    
    // Store Finder funkcionalnost
    storeFinderInit: function() {
        var map = null;
        var markers = [];
        var infoWindow = null;
        var storesData = []; // Čuva podatke o prodavnicama
        
        // Funkcija za inicijalizaciju mape
        function initMap() {
            // Proveri da li Google Maps postoji
            if (typeof google === 'undefined' || !google.maps) {
                console.error('Google Maps API nije učitan');
                $('#storeFinderMap').html('<div class="alert alert-warning m-3">Maps are not available.</div>');
                return;
            }
            
            // Centar mape (Beograd)
            var center = { lat: 44.7866, lng: 20.4489 };
            
            // Kreiraj mapu
            map = new google.maps.Map(document.getElementById('storeFinderMap'), {
                zoom: 10,
                center: center
            });
            
            infoWindow = new google.maps.InfoWindow();
            console.log('Mapa uspešno učitana!');
        }
        
        // Dodaj markere na mapu
        function addMarkers(stores) {
            // Očisti postojeće markere
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];
            
            // Sačuvaj podatke o prodavnicama
            storesData = stores;
            
            var bounds = new google.maps.LatLngBounds();
            
            stores.forEach(function(store, index) {
                var position = {
                    lat: parseFloat(store.latitude),
                    lng: parseFloat(store.longitude)
                };
                
                // Kreiraj marker
                var marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: store.name,
                    label: {
                        text: (index + 1).toString(),
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 15,
                        fillColor: '#28a745', // Zeleno jer ima proizvod na stanju
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2
                    }
                });
                
                // Info window sadržaj
                var infoContent = '<div style="padding: 10px;">' +
                    '<h5 style="margin: 0 0 10px 0;">' + store.name + '</h5>' +
                    '<p style="margin: 5px 0;">' + store.address1 + '<br>' +
                    store.city + ', ' + store.postalCode + '</p>' +
                    (store.phone ? '<p style="margin: 5px 0;">Phone: <a href="tel:' + store.phone + '">' + store.phone + '</a></p>' : '') +
                    '<p style="margin: 10px 0; font-weight: bold; color: #28a745;">Available: ' + store.availableQuantity + ' items</p>' +
                    '</div>';
                
                // Klik na marker - prikaži samo info window
                marker.addListener('click', function() {
                    infoWindow.setContent(infoContent);
                    infoWindow.open(map, marker);
                });
                
                markers.push(marker);
                bounds.extend(position);
            });
            
            // Prilagodi mapu da prikaže sve markere
            if (stores.length > 0) {
                map.fitBounds(bounds);
            }
        }
        
        // Prikaži listu prodavnica
        function displayStores(stores) {
            var productName = $('#modalProductName').text();
            var html = '<h4>Stores with "' + productName + '" in stock:</h4>';
            
            if (stores.length === 0) {
                html = '<div class="alert alert-info">No stores have this product in stock in the selected area.</div>';
            } else {
                stores.forEach(function(store, index) {
                    html += '<div class="store-item" data-index="' + index + '" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; cursor: pointer; position: relative;">' +
                        '<span style="position: absolute; top: 10px; right: 15px; background: #28a745; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">In Stock: ' + store.availableQuantity + '</span>' +
                        '<strong>' + (index + 1) + '. ' + store.name + '</strong><br>' +
                        store.address1 + '<br>';
                    
                    if (store.city) html += store.city + ', ';
                    if (store.postalCode) html += store.postalCode + '<br>';
                    if (store.phone) html += 'Phone: ' + store.phone;
                    
                    html += '</div>';
                });
            }
            
            $('#storesResultsList').html(html);
            $('.stores-list-section').show(); // Prikaži sekciju
        }
        
        // Event Handlers
        
        // Otvori modal
        $(document).on('click', '.store-finder-btn', function(e) {
            e.preventDefault();
            
            var productName = $(this).data('product-name');
            $('#modalProductName').text(productName);
            $('#storeFinderModal').show();
            
            // Inicijalizuj mapu nakon što se modal prikaže
            setTimeout(function() {
                if (!map) {
                    initMap();
                }
            }, 300);
        });
        
        // Zatvori modal
        $(document).on('click', '.close-modal, .modal-overlay', function() {
            $('#storeFinderModal').hide();
            // Očisti pretragu
            $('#zipCodeInput').val('');
            $('#storesResultsList').empty();
            $('.stores-list-section').hide();
            $('.search-error').hide();
            $('.search-success').hide();
        });
        
        // Spreči zatvaranje kada se klikne na sadržaj modala
        $(document).on('click', '.modal-content', function(e) {
            e.stopPropagation();
        });
        
        // Pretraži prodavnice - KORISTI NOVI KONTROLER SA INVENTORY PROVEROM
        $(document).on('click', '.search-stores-btn', function() {
            var zipCode = $('#zipCodeInput').val().trim();
            var productId = $('#storeFinderProductId').val();
            
            if (!zipCode) {
                $('.search-error .error-message').text('Please enter a ZIP code');
                $('.search-error').show();
                return;
            }
            
            // Sakrij poruke
            $('.search-error').hide();
            $('.search-success').hide();
            $('.search-loading').show();
            $('.stores-list-section').hide();
            
            // Poziv ka NOVOM kontroleru koji proverava inventory
            $.ajax({
                url: '/on/demandware.store/Sites-RefArch-Site/default/Stores-InventorySearch',
                method: 'GET',
                data: {
                    productId: productId,
                    postalCode: zipCode,
                    radius: 50
                },
                success: function(response) {
                    $('.search-loading').hide();
                    
                    if (response.stores && response.stores.length > 0) {
                        // Prikaži uspešnu poruku
                        $('.search-success .success-message').text('Found ' + response.stores.length + ' store(s) with this product in stock');
                        $('.search-success').show();
                        
                        // Prikaži prodavnice na mapi
                        addMarkers(response.stores);
                        
                        // Prikaži listu prodavnica
                        displayStores(response.stores);
                    } else {
                        $('.search-error .error-message').text('No stores have this product in stock in the selected area. Try a different ZIP code.');
                        $('.search-error').show();
                    }
                },
                error: function(xhr) {
                    $('.search-loading').hide();
                    
                    var errorMsg = 'Error searching for stores. Please try again.';
                    if (xhr.responseJSON && xhr.responseJSON.error) {
                        errorMsg = xhr.responseJSON.error;
                    }
                    
                    $('.search-error .error-message').text(errorMsg);
                    $('.search-error').show();
                    console.error('Store search error:', xhr);
                }
            });
        });
        
        // Enter key za pretragu
        $(document).on('keypress', '#zipCodeInput', function(e) {
            if (e.which === 13) {
                $('.search-stores-btn').click();
            }
        });
        
        // Klik na prodavnicu u listi - otvori info window
        $(document).on('click', '.store-item', function() {
            var index = $(this).data('index');
            
            // Selektuj prodavnicu
            $('.store-item').css('background-color', 'white');
            $(this).css('background-color', '#e7f1ff');
            
            // Otvori info window na mapi
            if (markers[index]) {
                google.maps.event.trigger(markers[index], 'click');
            }
        });
    }
};