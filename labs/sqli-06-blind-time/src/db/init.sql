CREATE TABLE hosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hostname VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  value VARCHAR(200)
);

INSERT INTO hosts (hostname, ip_address, status) VALUES
  ('web-prod-01', '10.0.1.10', 'active'),
  ('web-prod-02', '10.0.1.11', 'active'),
  ('db-primary', '10.0.2.10', 'active'),
  ('db-replica', '10.0.2.11', 'degraded'),
  ('cache-01', '10.0.3.10', 'active'),
  ('worker-01', '10.0.4.10', 'maintenance');
