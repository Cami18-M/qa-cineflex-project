/**
 * CineFlex - Servidor estatico del frontend (sin dependencias)
 * Sirve la carpeta frontend/ para poder abrir la UI en el navegador
 * y ejecutar las pruebas de Selenium contra una URL HTTP estable.
 *
 * Uso:  node serve.js   (por defecto escucha en http://localhost:8080)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8081;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Solicitud invalida');
  }

  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, path.normalize(urlPath));

  // Evita recorrido de directorios (path traversal)
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Acceso denegado');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('No encontrado');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[CineFlex] Frontend disponible en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`[CineFlex] ERROR: el puerto ${PORT} ya esta en uso.`);
    console.error('Deten el proceso que lo ocupa o usa otro puerto:');
    console.error('  PowerShell: Get-NetTCPConnection -LocalPort ' + PORT + ' -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }');
    console.error('  o usa:     $env:PORT=8082; node serve.js');
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.error('[CineFlex] Error al iniciar el servidor:', err.message);
  process.exit(1);
});
