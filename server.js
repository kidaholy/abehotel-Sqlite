const path = require('path');
const fs = require('fs');

console.log('--- Starting Bridge Server ---');
console.log('Current __dirname:', __dirname);
console.log('Target standalone path:', path.join(__dirname, '.next', 'standalone'));

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.PORT || 3000;

try {
  const standaloneDir = path.join(__dirname, '.next', 'standalone');
  
  if (!fs.existsSync(standaloneDir)) {
    console.error('ERROR: Standalone directory not found at:', standaloneDir);
  } else {
    process.chdir(standaloneDir);
    console.log('Changed working directory to:', process.cwd());
    
    if (!fs.existsSync('./server.js')) {
      console.error('ERROR: standalone/server.js not found!');
    } else {
      console.log('Requiring standalone server...');
      require('./server.js');
    }
  }
} catch (err) {
  console.error('CRITICAL ERROR in bridge server:', err);
}
