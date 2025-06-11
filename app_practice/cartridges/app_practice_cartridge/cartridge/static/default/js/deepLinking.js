'use strict';

(function () {
    function setup() {
        if (typeof $ === 'undefined') return setTimeout(setup, 100);
        
        const originalAjax = $.ajax;
        $.ajax = function(options) {
            const originalSuccess = options.success;
            options.success = function(response) {
                if (originalSuccess) originalSuccess.apply(this, arguments);
                
                if (options.url && options.url.includes('refinementColor')) {
                    setTimeout(function() {
                        const urlParams = new URL(options.url, window.location.origin).searchParams;
                        let colorValue = null;
                        
                        const prefValues = ['prefv1', 'prefv2', 'prefv3', 'prefv4', 'prefv5'];
                        for (let i = 0; i < prefValues.length; i++) {
                            if (urlParams.get('prefn' + (i + 1)) === 'refinementColor') {
                                colorValue = urlParams.get(prefValues[i]);
                                break;
                            }
                        }
                        
                        const basePath = window.location.pathname.replace(/\/color\/[^\/\?]+/g, '').replace(/\/+$/, '');
                        const newPath = colorValue ? basePath + '/color/' + encodeURIComponent(colorValue) : basePath;
                        
                        if (newPath !== window.location.pathname && newPath) {
                            window.history.replaceState({}, '', newPath);
                        }
                    }, 150);
                }
            };
            return originalAjax.call(this, options);
        };
    }
    
    setup();
})();