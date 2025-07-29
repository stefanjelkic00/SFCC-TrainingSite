'use strict';

const server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    const Site = require('dw/system/Site');
    const URLUtils = require('dw/web/URLUtils');
    const useExternalAuth = Site.getCurrent().getCustomPreferenceValue('useExternalAuthentication');
    
    const target = req.querystring.rurl || 1;
    const actionUrl = useExternalAuth 
        ? URLUtils.url('Account-ExternalLogin', 'rurl', target) 
        : URLUtils.url('Account-Login', 'rurl', target);
    
    res.setViewData({
        actionUrl: actionUrl
    });
    
    next();
});

module.exports = server.exports();