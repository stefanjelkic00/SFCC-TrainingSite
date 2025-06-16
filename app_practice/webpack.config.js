const path = require('path');

module.exports = [{
    mode: 'development',
    name: 'js',
    entry: {
        'js/search': './cartridges/app_practice_cartridge/cartridge/client/default/js/search/search.js'
        //                                                         ^^^^^^ ^^^^^^^ (dodao sam 'c' i 'ult')
    },
    output: {
        path: path.resolve('./cartridges/app_practice_cartridge/cartridge/static/default/'),
        filename: '[name].js'
    },
    resolve: {
        alias: {
            'app_storefront_base': path.resolve(__dirname, '../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default')
        }
    }
}];