# Migração Cloudflare — Dashboard Gestão Menezes

Branch: `cloudflare-migracao` (não alterar a branch `acessos-gestao-menezes`).

## Cloudflare Workers Builds

- GitHub: `mateusmenezes1997/dashboardmenezes`.
- Production branch no Cloudflare: `cloudflare-migracao`.
- Build command: `npm run build`.
- Deploy command: `npx wrangler deploy`.
- Preview command: `npx wrangler preview`.
- Wrangler: `wrangler.jsonc` já contém o binding `DB` para `gestao-menezes-db`.
- Arquivos estáticos: pasta temporária `.cloudflare-public` gerada pelo build. Nunca expor `api/`, `lib/`, `package.json` ou variáveis secretas como assets.

## Antes de permitir que consultores usem o site

1. Em Worker > Settings > Variables and Secrets, criar **Secrets**, nunca plain text, para: `SESSION_SECRET`, `PASSWORD_GESTOR`, `PASSWORD_TRAINEE`, `PASSWORD_CONSULTOR`. Usar senhas novas e longas; não compartilhar no chat nem colocar no GitHub.
2. Verificar `GET /api/health` (precisa indicar `databaseBound: true` e `configured: true`).
3. Recuperar backup **validado** dos dados da Vercel Blob e importar somente por login de gestor. O D1 começa vazio: nenhuma venda é importada automaticamente.
4. Validar totais, números de cotas, consultores, líderes, ranking e acessos.
5. Testar registro e exclusão de uma venda de demonstração. Não apagar ou substituir a base original na Vercel.
6. Apenas após isso compartilhar o novo endereço com a equipe.

O Worker monta automaticamente a tabela `app_documents` quando um endpoint `/api/*` for chamado. A migração SQL equivalente fica em `cloudflare/migrations/0001_init.sql`.

**Atenção:** o registro único de estado tem um limite deliberado de 1,85 MB. Se um backup crescer além disso, migrar o esquema para tabelas normalizadas antes de importar. O limite máximo de texto por linha do D1 no plano gratuito é 2 MB.
