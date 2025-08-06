'use strict';

const server = require('server');
server.extend(module.superModule);

server.get('IncludePage', function (req, res, next) {
    const PageMgr = require('dw/experience/PageMgr');
    const pageId = req.querystring.pdid;
    const page = PageMgr.getPage(pageId);
    
    if (page && page.isVisible()) {
        const content = PageMgr.renderPage(page.ID, '');
        res.print(content);
    }
    next();
});

module.exports = server.exports();