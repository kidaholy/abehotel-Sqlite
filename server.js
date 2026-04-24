// cPanel Phusion Passenger Bridge for Next.js with Error Logging
const path = require('path');
const fs = require('fs');

// Log errors to a file we can read
const logFile = path.join(__dirname, 'startup-error.log');
const log = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
  console.error(msg);
};

try {
  log('Starting Next.js Bridge...');
  
  // Ensure we are in the correct directory
  process.chdir(__dirname);
  log(`Current directory: ${process.cwd()}`);

  // Set Prisma to binary for shared hosting
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  log('Prisma engine type set to binary');

  // Check if standalone server exists
  const standaloneServer = path.join(__dirname, '.next/standalone/server.js');
  if (!fs.existsSync(standaloneServer)) {
    throw new Error(`Standalone server NOT found at ${standaloneServer}`);
  }

  log('Loading standalone server...');
  require(standaloneServer);
  log('Standalone server required successfully');

} catch (err) {
  log(`CRITICAL STARTUP ERROR: ${err.message}`);
  log(err.stack);
  process.exit(1);
}
