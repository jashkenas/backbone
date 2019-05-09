const path = require('path');

module.exports = {
    entry: './index.js',
    mode: 'development',
    stats: 'verbose',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    }

};

