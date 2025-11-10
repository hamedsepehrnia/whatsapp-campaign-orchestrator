const isDevelopment = process.env.NODE_ENV === 'development';

exports.logInfo = (...args) => {
    if (isDevelopment) {
        console.log('[INFO]', ...args);
    }
};

exports.logError = (...args) => {
    console.error('[ERROR]', ...args);
};

exports.logWarning = (...args) => {
    console.warn('[WARN]', ...args);
};


