'use strict';

const path = require('path');
const ExtractTextPlugin = require('sgmf-scripts')['extract-text-webpack-plugin'];
const sgmfScripts = require('sgmf-scripts');

module.exports = sgmfScripts.createWebpackConfig({
    mode: 'development',
    cartridges: [
        path.resolve('./cartridges/app_practice_cartridge')
    ],
    alias: {
        'app_storefront_base': path.resolve(
            './node_modules/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/js'
        )
    }
});