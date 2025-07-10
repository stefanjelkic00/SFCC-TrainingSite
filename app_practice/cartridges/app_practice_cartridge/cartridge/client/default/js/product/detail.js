'use strict';

const baseDetail = require('base/product/detail');

const storeFinder = {
    map: null,
    markers: [],
    infoWindow: null,
    storesData: [],

    initializeMap: function () {
        const $mapCanvas = $('#storeFinderMap');
        
        if (!$mapCanvas.data('has-google-api')) {
            $mapCanvas.html('<div class="alert alert-warning m-3">Maps are not available.</div>');
            return;
        }

        const center = { lat: 44.7866, lng: 20.4489 };

        this.map = new google.maps.Map($mapCanvas[0], {
            scrollwheel: false,
            zoom: 8,
            center: center
        });

        this.infoWindow = new google.maps.InfoWindow();
    },

    createInfoWindowHtml: function(store) {
        return `
            <div class="store-info-window" style="padding: 10px;">
                <h5 class="store-name" style="margin: 0 0 10px 0;">${store.name}</h5>
                <div class="store-address" style="margin: 5px 0;">
                    ${store.address1}<br/>
                    ${store.city ? store.city + ', ' : ''}
                    ${store.postalCode || ''}
                </div>
                ${store.phone ? 
                    '<div class="store-phone" style="margin: 5px 0;">Phone: <a href="tel:' + store.phone + '">' + store.phone + '</a></div>' 
                    : ''
                }
                ${store.availableQuantity ? 
                    '<div class="store-availability" style="margin: 10px 0; font-weight: bold; color: #28a745;">Available: ' + store.availableQuantity + ' items</div>'
                    : ''
                }
            </div>
        `;
    },

    updateMapMarkers: function (stores) {
        this.markers.forEach(function(marker) {
            marker.setMap(null);
        });
        this.markers = [];
        this.storesData = stores;

        const bounds = new google.maps.LatLngBounds();
        const self = this;

        stores.forEach(function (store, index) {
            const position = {
                lat: parseFloat(store.latitude),
                lng: parseFloat(store.longitude)
            };

            const marker = new google.maps.Marker({
                position: position,
                map: self.map,
                title: store.name,
                icon: {
                    path: 'M13.5,30.1460153 L16.8554555,25.5 L20.0024287,25.5 C23.039087,25.5 25.5,' +
                        '23.0388955 25.5,20.0024287 L25.5,5.99757128 C25.5,2.96091298 23.0388955,0.5 ' +
                        '20.0024287,0.5 L5.99757128,0.5 C2.96091298,0.5 0.5,2.96110446 0.5,5.99757128 ' +
                        'L0.5,20.0024287 C0.5,23.039087 2.96110446,25.5 5.99757128,25.5 L10.1445445,' +
                        '25.5 L13.5,30.1460153 Z',
                    fillColor: '#0070d2',
                    fillOpacity: 1,
                    scale: 1.1,
                    strokeColor: 'white',
                    strokeWeight: 1,
                    anchor: new google.maps.Point(13, 30),
                    labelOrigin: new google.maps.Point(12, 12)
                },
                label: {
                    text: (index + 1).toString(),
                    color: 'white',
                    fontSize: '16px'
                }
            });

            marker.addListener('click', function () {                
                const infoWindowContent = self.createInfoWindowHtml(store);
                self.infoWindow.setContent(infoWindowContent);
                self.infoWindow.open(self.map, marker);
                
                $('.js-store-item').removeClass('active');
                $('.js-store-item[data-index="' + index + '"]').addClass('active');
            });

            self.markers.push(marker);
            bounds.extend(position);
        });

        if (stores.length > 0) {
            this.map.fitBounds(bounds);
        }
    },

    renderStoresList: function(storesHtml) {
        const $resultsDiv = $('#storesResultsList');
        $resultsDiv.html(storesHtml);
    },

    updateStoresResults: function (data) {
        const hasResults = data.stores && data.stores.length > 0;

        $('.search-error').toggle(!hasResults);
        $('.search-success').toggle(hasResults);
        
        if (!hasResults) {
            $('.search-error .error-message').text('No stores have this product in stock in the selected area. Try a different ZIP code.');
        } else {
            $('.search-success .success-message').text('Found ' + data.stores.length + ' store(s) with this product in stock');
        }

        if (hasResults) {
            this.renderStoresList(data.storesResultsHtml);
            this.updateMapMarkers(data.stores);
        }

        $('.js-stores-list-section').toggle(hasResults);
    },

    searchStores: function () {
        const zipCode = $('#zipCodeInput').val().trim();
        const productId = $('#storeFinderProductId').val();
        const radius = $('#radius').val() || 50;

        if (!zipCode) {
            $('.search-error .error-message').text('Please enter a ZIP code');
            $('.search-error').show();
            $('.search-success').hide();
            return;
        }

        $('.search-error, .search-success').hide();
        $.spinner().start();

        const self = this;

        $.ajax({
            url: '/on/demandware.store/Sites-RefArch-Site/default/Stores-InventorySearch',
            type: 'GET',
            data: {
                productId: productId,
                postalCode: zipCode,
                radius: radius
            },
            dataType: 'json',
            success: function (data) {
                $.spinner().stop();
                self.updateStoresResults(data);
            },
            error: function (xhr) {
                $.spinner().stop();
                let errorMsg = 'Error searching for stores. Please try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }

                $('.search-error .error-message').text(errorMsg);
                $('.search-error').show();
                $('.search-success').hide();
            }
        });
    }
};

baseDetail.storeFinderInit = function() {
    const self = storeFinder;
    
    if (typeof google !== 'undefined' && google.maps) {
        $('#storeFinderMap').data('has-google-api', true);
    } else {
        $('#storeFinderMap').data('has-google-api', false);
    }
    
    $('body').on('click', '.js-store-finder-btn', function (e) {
        e.preventDefault();
        
        const $button = $(e.currentTarget);
        $('#modalProductName').text($button.data('product-name'));
        $('#storeFinderProductId').val($button.data('product-id'));
        $('#storeFinderModal').show();

        setTimeout(function () {
            if (!self.map) {
                self.initializeMap();
            }
        }, 300);
    });

    $('body').on('click', '.close-modal, .modal-overlay', function () {
        $('#storeFinderModal').hide();
        $('#zipCodeInput').val('');
        $('#storesResultsList').empty();
        $('.js-stores-list-section, .search-error, .search-success').hide();
        
        self.markers.forEach(function(marker) {
            marker.setMap(null);
        });
        self.markers = [];
    });

    $('body').on('click', '.modal-content', function (e) {
        e.stopPropagation();
    });

    $('body').on('click', '.js-search-stores-btn', function () {
        self.searchStores();
    });

    $('body').on('keypress', '#zipCodeInput', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            self.searchStores();
        }
    });

    $('body').on('click', '.js-store-item', function (e) {
        const $storeItem = $(e.currentTarget);
        const index = $storeItem.data('index');

        $('.js-store-item').removeClass('active');
        $storeItem.addClass('active');

        if (self.markers[index]) {
            google.maps.event.trigger(self.markers[index], 'click');
        }
    });
};

module.exports = baseDetail;