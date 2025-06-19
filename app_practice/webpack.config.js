'use strict';

const path = require('path');
const webpack = require('sgmf-scripts').webpack;
const jsFiles = require('sgmf-scripts').createJsPath();

const customJsFiles = Object.assign({}, jsFiles, {
    'app_practice_cartridge/js/search': path.resolve('./cartridges/app_practice_cartridge/cartridge/client/default/js/search.js')
});

module.exports = [{
    mode: 'development',
    name: 'js',
    entry: customJsFiles,
    output: {
        path: path.resolve('./cartridges/app_practice_cartridge/cartridge/static'),
        filename: '[name].js'
    },
    resolve: {
        alias: {
            'app_storefront_base': path.resolve('../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js')
        }
    }
}];