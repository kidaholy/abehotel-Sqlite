// cPanel Phusion Passenger Bridge for Next.js
const path = require('path');

// Ensure we are in the correct directory
process.chdir(__dirname);

// Next.js standalone build output is in .next/standalone
// We need to point to its server.js
// Note: PRISMA_CLIENT_ENGINE_TYPE is set to binary for shared hosting compatibility if needed
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';

// Load the standalone server
require('./.next/standalone/server.js');
