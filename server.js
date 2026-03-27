const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://sekawan-bf.com',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api',
    },
    logLevel: 'info',
  })
);

app.listen(PORT, () => {
  console.log(`[Proxy Server] Running on http://localhost:${PORT}`);
  console.log(`[Proxy Server] Proxying /api/* to https://sekawan-bf.com/api/*`);
});
