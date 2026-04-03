/**
 * 静态文件服务器 - 大健康门店管理平台
 * 监听端口: 8080
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/admin-page.html';

  const filePath = path.join(ROOT, urlPath);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🌐 大健康门店管理平台 - 前端服务已启动');
  console.log(`📍 监听端口: ${PORT}`);
  console.log('='.repeat(50));
  console.log('📊 可用页面：');
  console.log(`  管理后台  → http://localhost:${PORT}/admin-page.html`);
  console.log(`  基础测试  → http://localhost:${PORT}/test-page.html`);
  console.log(`  完整功能  → http://localhost:${PORT}/full-test.html`);
  console.log(`  登录测试  → http://localhost:${PORT}/test-login.html`);
  console.log('='.repeat(50));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请先关闭占用该端口的程序`);
  } else {
    console.error('服务器错误:', err);
  }
  process.exit(1);
});
