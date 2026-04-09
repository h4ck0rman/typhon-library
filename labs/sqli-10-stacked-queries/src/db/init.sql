CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  assigned_to VARCHAR(50)
);

CREATE TABLE system_secrets (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(50),
  key_value VARCHAR(200)
);

INSERT INTO users (username, password, role) VALUES
  ('admin', 'Zk8$mR3nW7xP', 'admin'),
  ('guest', 'guest', 'user');

INSERT INTO tasks (title, description, status, assigned_to) VALUES
  ('Fix login timeout', 'Users report session drops after 5 minutes', 'open', 'admin'),
  ('Update dependencies', 'npm audit shows 3 high-severity vulnerabilities', 'in-progress', 'guest'),
  ('Add rate limiting', 'API endpoints need rate limiting middleware', 'open', 'admin'),
  ('Write unit tests', 'Coverage is below 60% on auth module', 'open', 'guest'),
  ('Deploy v2.1 hotfix', 'Critical patch for payment processing', 'done', 'admin');
