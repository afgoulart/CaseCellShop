const http = require('http');
const fs = require('fs');
const path = require('path');
const { createServer: createNetServer } = require('net');

const DIST = path.join(__dirname, 'dist');
const PORT = 5173;
const API_HOST = 'localhost';
const API_PORT = 3001;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.map': 'application/json',
  '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  // proxy /api/* → backend
  if (req.url.startsWith('/api/')) {
    const opts = {
      hostname: API_HOST,
      port: API_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxy = http.request(opts, (pr) => {
      res.writeHead(pr.statusCode, pr.headers);
      pr.pipe(res);
    });
    proxy.on('error', () => {
      res.writeHead(502);
      res.end('Backend unavailable');
    });
    req.pipe(proxy);
    return;
  }

  // static files
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html');

  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Frontend: http://localhost:${PORT}`);
});
