CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(200) NOT NULL
);

CREATE TABLE mailbox (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sender VARCHAR(100),
  subject VARCHAR(200),
  body TEXT
);

INSERT INTO users (username, password, role) VALUES
  ('admin', 'Qm7!xKz3Rv$w', 'admin'),
  ('alice', 'alice123', 'user');

INSERT INTO sessions (user_id, token) VALUES
  (1, 'a8f5f167f44f4964e6c998dee827110c'),
  (2, 'b2d7c5f8a3e1490d87c6f12a45e8d90b');

INSERT INTO mailbox (user_id, sender, subject, body) VALUES
  (2, 'noreply@sparkmail.io', 'Welcome to SparkMail', 'Thanks for signing up, Alice! Enjoy your new inbox.'),
  (2, 'promo@deals.com', 'Flash Sale This Weekend', 'Don''t miss out on 50% off everything!');
