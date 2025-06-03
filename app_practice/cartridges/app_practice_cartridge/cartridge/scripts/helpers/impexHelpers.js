/**
 * IMPEX Helper - Utility functions for IMPEX directory operations
 * Path: app_practice_cartridge/cartridge/scripts/helpers/impexHelpers.js
 */
'use strict';

const Logger = require('dw/system/Logger');
const File = require('dw/io/File');

const logger = Logger.getLogger('impexHelpers', 'impexHelpers');

/**
 * Ensures that the specified IMPEX directory exists, creating it if necessary
 * @param {string} impexPath - The path relative to IMPEX root directory
 * @returns {File|null} The directory File object or null if creation failed
 */
function ensureImpexPath(impexPath) {
    try {
        const directory = new File(`${File.IMPEX}${File.SEPARATOR}${impexPath}`);
        
        if (!directory.exists()) {
            const created = directory.mkdirs();
            if (!created) {
                logger.error(`Failed to create IMPEX directory: ${directory.getFullPath()}`);
                return null;
            }
            logger.info(`Created IMPEX directory: ${directory.getFullPath()}`);
        }
        
        return directory;
        
    } catch (error) {
        logger.error(`Error ensuring IMPEX path: ${error.message}`);
        return null;
    }
}

module.exports = {
    ensureImpexPath: ensureImpexPath
};