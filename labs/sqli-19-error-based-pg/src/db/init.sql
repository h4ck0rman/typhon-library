CREATE TABLE warehouse_items (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(20) NOT NULL,
  description VARCHAR(200),
  quantity INT,
  location VARCHAR(20)
);

CREATE TABLE admin_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(50),
  config_value VARCHAR(200)
);

INSERT INTO warehouse_items (part_number, description, quantity, location) VALUES
  ('WH-1001', 'Steel Bolts M8x40 (box/100)', 5400, 'A-12'),
  ('WH-1002', 'Copper Wire 2.5mm (100m)', 230, 'B-03'),
  ('WH-1003', 'Hydraulic Cylinder HC-200', 18, 'C-07'),
  ('WH-1004', 'Ball Bearing 6205-2RS', 1240, 'A-15'),
  ('WH-1005', 'Rubber Gasket Set (50pc)', 890, 'D-01'),
  ('WH-1006', 'Stainless Steel Pipe DN50', 45, 'E-09');
