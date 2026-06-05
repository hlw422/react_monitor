-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  role_id UUID REFERENCES roles(id),
  refresh_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Super Administrator', '["*"]'),
  ('operator', 'Operations Engineer', '["dashboard:read", "server:read", "server:write", "metric:read", "alert:read", "alert:write", "log:read"]'),
  ('developer', 'Developer', '["dashboard:read", "server:read", "metric:read", "log:read"]'),
  ('guest', 'Guest', '["dashboard:read"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password_hash, email, role_id, status) VALUES
  ('admin', '$2b$10$YourHashHere', 'admin@monitor.com', (SELECT id FROM roles WHERE name = 'admin'), 'active')
ON CONFLICT (username) DO NOTHING;
