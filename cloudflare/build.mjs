// Publica somente os arquivos de interface. Nunca disponibilize api/, lib/ ou segredos.
import { readdirSync, statSync, copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
// Arquivo público de diagnóstico para distinguir código novo de deploy antigo.
// Não contém senhas, dados de clientes ou estado da aplicação.
writeFileSync(join(out, 'deploy-version.json'), JSON.stringify({
  product: 'dashboard-menezes',
  release: 'ranking-premium-v4-celebration-fix-20261113',
  branch: 'cloudflare-migracao',
  builtAt: new Date().toISOString(),
  commit: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || null
}, null, 2));
console.log('Arquivos públicos copiados para', out);
