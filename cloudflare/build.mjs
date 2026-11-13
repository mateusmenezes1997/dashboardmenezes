// Publica somente os arquivos de interface. Nunca disponibilize api/, lib/ ou segredos.
import { readdirSync, statSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const out = join(root, '.cloudflare-public');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const allowed = /\.(?:html|css|js|svg|webmanifest)$/i;
for (const name of readdirSync(root)) {
  const path = join(root, name);
  if (!statSync(path).isFile() || !allowed.test(name)) continue;
  copyFileSync(path, join(out, name));
}
console.log('Arquivos públicos copiados para', out);
