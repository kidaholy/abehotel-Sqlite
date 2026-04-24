// This is a bridge to run the Next.js standalone server on cPanel
// It points to the optimized production build created by 'npm run build'

process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.env.PORT || 3000;

// Import the standalone server
require('./.next/standalone/server.js');
