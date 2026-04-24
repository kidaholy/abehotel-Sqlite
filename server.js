// Import path to handle directory changes
const path = require('path');

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.PORT || 3000;

// Change working directory to the standalone folder
process.chdir(path.join(__dirname, '.next', 'standalone'));

// Boot the standalone server
require('./server.js');
