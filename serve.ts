// The Velvet Vault — serve.ts: a tiny static server for local play-testing.
// Serves game/ at http://localhost:8080 (Node 22, standard library only).
// Not part of the entry's hand-in; the game itself needs no server at all
// beyond any static host.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const port = Number(process.env.PORT ?? 8080);

createServer((request, response) => {
  const path = normalize(join(root, decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)));
  const file = statSync(path, { throwIfNoEntry: false })?.isDirectory() ? join(path, 'index.html') : path;
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  console.log(`The Velvet Vault at http://localhost:${port}`);
});
