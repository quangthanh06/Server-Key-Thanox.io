CREATE INDEX idx_sessions_ip ON sessions(client_ip_hash);
CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_sessions_status ON sessions(overall_status);
CREATE INDEX idx_keys_session ON keys(session_id);
CREATE INDEX idx_keys_status ON keys(status);
CREATE INDEX idx_rate_limits_ip_date ON rate_limits(ip_hash, date);
