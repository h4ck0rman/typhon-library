CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  quantity INT
);

CREATE TABLE oast_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secret VARCHAR(200)
);

INSERT INTO inventory (sku, name, quantity) VALUES
  ('SKU-001', 'Server Rack Unit 42U', 12),
  ('SKU-002', 'Cat6 Patch Cable 3m', 340),
  ('SKU-003', 'UPS 1500VA', 8),
  ('SKU-004', 'SFP+ 10G Module', 45),
  ('SKU-005', 'PDU 16-port', 6);
