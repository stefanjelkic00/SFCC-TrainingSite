const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        search: './cartridges/app_practice_cartridge/cartridge/client/default/js/search.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'cartridges/app_practice_cartridge/cartridge/static/default/js'),
    },
    module: {
        rules: []
    },
    resolve: {
        alias: {
            'base': path.resolve(__dirname, '../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js'),
            'app_storefront_base': path.resolve(__dirname, '../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js')
        }
    }
};