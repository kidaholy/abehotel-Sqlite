const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'production.log');

// Ultra-robust logging
function writeSync(msg) {
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  writeSync(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  writeSync(`UNHANDLED REJECTION: ${reason}`);
});

// Redirect console
console.log = (...args) => writeSync(`LOG: ${args.join(' ')}`);
console.error = (...args) => writeSync(`ERR: ${args.join(' ')}`);

console.log('--- Bridge Server Bootstrap ---');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.PORT || 3000;

const standaloneDir = path.join(__dirname, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('CRITICAL: .next/standalone folder not found. Did you run npm run build?');
  process.exit(1);
}

try {
  process.chdir(standaloneDir);
  console.log('Working directory changed to:', process.cwd());
  
  if (!fs.existsSync('./server.js')) {
    console.error('CRITICAL: standalone/server.js missing!');
    process.exit(1);
  }

  console.log('Requiring standalone server...');
  require('./server.js');
} catch (err) {
  console.error('BOOT ERROR:', err);
}
