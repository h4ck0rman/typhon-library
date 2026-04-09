CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  spec TEXT,
  price DECIMAL(10,2),
  category VARCHAR(50)
);

CREATE TABLE waf_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flag_name VARCHAR(50),
  flag_value VARCHAR(200)
);

INSERT INTO products (name, spec, price, category) VALUES
  ('NovaBlade Laptop 16', 'M3 Pro, 18GB RAM, 512GB SSD', 1999.99, 'laptops'),
  ('QuantumBuds Pro', 'ANC, Spatial Audio, 30hr battery', 249.99, 'audio'),
  ('HyperDock Station', 'Thunderbolt 4, 3x4K output', 329.99, 'accessories'),
  ('CyberLens Monitor 27"', '4K IPS, HDR1000, 160Hz', 699.99, 'monitors'),
  ('NovaWatch Ultra', 'Titanium, GPS, 60hr battery', 799.99, 'wearables'),
  ('StealthPad Tablet', '13" OLED, M2 chip, 1TB', 1299.99, 'tablets');
