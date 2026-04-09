CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50)
);

CREATE TABLE secret_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flag_name VARCHAR(50),
  flag_value VARCHAR(200)
);

INSERT INTO products (name, description, price, category) VALUES
  ('Quantum Laptop Pro', '16-inch display, 32GB RAM, 1TB SSD', 1299.99, 'laptops'),
  ('NeonBuds X', 'Wireless noise-cancelling earbuds', 149.99, 'audio'),
  ('HyperDrive SSD 2TB', 'NVMe external storage, USB-C', 189.99, 'storage'),
  ('MechForce Keyboard', 'RGB mechanical keyboard, Cherry MX', 129.99, 'peripherals'),
  ('UltraWide Monitor 34"', 'Curved QHD display, 144Hz', 449.99, 'monitors'),
  ('PhantomMouse Elite', 'Wireless gaming mouse, 25K DPI', 79.99, 'peripherals'),
  ('CloudRouter AX6000', 'Wi-Fi 6E mesh router', 299.99, 'networking'),
  ('PixelPad Tablet', '11-inch OLED, 256GB', 599.99, 'tablets');
