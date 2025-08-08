'use strict';

module.exports.render = function (context, modelIn) {
    const Template = require('dw/util/Template');
    const HashMap = require('dw/util/HashMap');
    const model = modelIn || new HashMap();
    
    return new Template('experience/components/commerce_assets/pageFooter').render(model).text;
};