// Simple proxy server untuk development
const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_DOMAIN = 'sekawan-bf.com';
const PROXY_PORT = 3001;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only proxy /api/ requests
  if (!req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const targetPath = req.url;
  const targetUrl = `https://${TARGET_DOMAIN}${targetPath}`;

  console.log(`[Proxy] ${req.method} ${targetPath} -> ${targetUrl}`);

  const options = {
    hostname: TARGET_DOMAIN,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_DOMAIN,
    },
  };

  // Forward authorization header
  if (req.headers.authorization) {
    options.headers.authorization = req.headers.authorization;
  }

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`[Proxy Response] ${proxyRes.statusCode} for ${targetPath}`);
    
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error] ${targetPath}:`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }));
  });

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`[Proxy Server] Listening on http://localhost:${PROXY_PORT}`);
  console.log(`[Proxy Server] Forwarding /api/* to https://${TARGET_DOMAIN}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Proxy Error] Port ${PROXY_PORT} already in use`);
  } else {
    console.error(`[Proxy Error]`, err);
  }
  process.exit(1);
});
