CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE vault_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secret_name VARCHAR(50),
  secret_value VARCHAR(200)
);

INSERT INTO users (username, password, email, role) VALUES
  ('admin', 'Xt7$kL9mN2pQ', 'admin@cloudvault.io', 'admin'),
  ('demo', 'demo123', 'demo@cloudvault.io', 'user');
