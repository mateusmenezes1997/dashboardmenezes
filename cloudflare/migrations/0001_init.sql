-- Banco de dados do Dashboard Gestão Menezes na Cloudflare D1.
-- Os dados de vendas não são inicializados aqui: a importação precisa ser validada.
CREATE TABLE IF NOT EXISTS app_documents (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
