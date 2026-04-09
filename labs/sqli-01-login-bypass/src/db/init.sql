CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user'
);

INSERT INTO users (username, password, role) VALUES
  ('admin', 'S3cur3P@ssw0rd!2024', 'admin'),
  ('jsmith', 'password123', 'user'),
  ('analyst', 'Welcome1!', 'user');
