-- Schema para Cloudflare D1 (SQLite)

-- Tabla de boosts
CREATE TABLE IF NOT EXISTS boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT NOT NULL,
  pair_symbol TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  status TEXT DEFAULT 'pre',
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Tabla de whitelist
CREATE TABLE IF NOT EXISTS whitelist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_boosts_status ON boosts(status);
CREATE INDEX IF NOT EXISTS idx_boosts_created ON boosts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON whitelist(wallet_address);
