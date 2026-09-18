CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  proxy_type TEXT,
  step1_status TEXT NOT NULL DEFAULT 'pending',
  step2_status TEXT NOT NULL DEFAULT 'pending',
  overall_status TEXT NOT NULL DEFAULT 'created',
  step1_token_hash TEXT,
  step1_nonce TEXT,
  step2_flow_id TEXT,
  step2_state TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  client_ip_hash TEXT NOT NULL,
  user_agent_hash TEXT
);

CREATE TABLE keys (
  id TEXT PRIMARY KEY,
  key_value TEXT NOT NULL,
  proxy_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE rate_limits (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(ip_hash, date)
);
