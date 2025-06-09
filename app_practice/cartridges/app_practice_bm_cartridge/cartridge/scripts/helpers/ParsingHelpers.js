'use strict';

function safeJsonParse(jsonString, defaultValue) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return defaultValue !== undefined ? defaultValue : null;
    }
}

module.exports = {
    safeJsonParse: safeJsonParse
};