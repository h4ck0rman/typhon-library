CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  clearance VARCHAR(20)
);

CREATE TABLE secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  value VARCHAR(200)
);

INSERT INTO employees (name, department, clearance) VALUES
  ('Alice Chen', 'Engineering', 'L3'),
  ('Bob Martinez', 'Operations', 'L2'),
  ('Carol Wu', 'Security', 'L4'),
  ('Dave Okafor', 'Finance', 'L1'),
  ('Eve Laurent', 'Engineering', 'L3'),
  ('Frank Novak', 'Executive', 'L5');
