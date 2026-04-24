const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  const logMsg = `Request received at ${new Date().toISOString()} for ${req.url}\n`;
  
  try {
    fs.appendFileSync(path.join(__dirname, 'test_connection.log'), logMsg);
  } catch (e) {}

  res.end('Node.js Startup Test: Successful! Your server IS running this file.');
});

server.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
