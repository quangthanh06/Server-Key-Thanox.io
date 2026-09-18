-- Admin settings table for dynamic configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO admin_settings (key, value, updated_at) VALUES
  ('step1_bypass_url', 'https://example.com/my-bypass', datetime('now')),
  ('daily_global_limit', '3000', datetime('now')),
  ('daily_ip_limit', '2', datetime('now')),
  ('key_duration', '86400', datetime('now')),
  ('brand_name', 'THANOX STORE', datetime('now')),
  ('site_title', 'GET.KEY // THANOX STORE', datetime('now')),
  ('announcement', '', datetime('now')),
  ('maintenance_mode', 'false', datetime('now'));
