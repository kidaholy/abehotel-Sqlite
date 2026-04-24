const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'production.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Redirect console to file
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  const msg = `[${new Date().toISOString()}] LOG: ${args.join(' ')}\n`;
  logStream.write(msg);
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const msg = `[${new Date().toISOString()}] ERR: ${args.join(' ')}\n`;
  logStream.write(msg);
  originalError.apply(console, args);
};

console.log('--- Bridge Server Bootstrap ---');
console.log('Current __dirname:', __dirname);

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.PORT || 3000;

try {
  const standaloneDir = path.join(__dirname, '.next', 'standalone');
  
  if (!fs.existsSync(standaloneDir)) {
    console.error('CRITICAL: Standalone directory missing at:', standaloneDir);
  } else {
    process.chdir(standaloneDir);
    console.log('In standalone directory:', process.cwd());
    
    if (!fs.existsSync('./server.js')) {
      console.error('CRITICAL: standalone/server.js missing!');
    } else {
      console.log('Booting Next.js Standalone Server...');
      require('./server.js');
    }
  }
} catch (err) {
  console.error('FATAL EXCEPTION:', err);
}
