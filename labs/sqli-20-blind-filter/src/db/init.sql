CREATE TABLE coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  discount_pct INT,
  active TINYINT DEFAULT 1
);

CREATE TABLE promo_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  secret VARCHAR(200)
);

INSERT INTO coupons (code, discount_pct, active) VALUES
  ('SAVE10', 10, 1),
  ('DEAL20', 20, 1),
  ('MEGA50', 50, 0),
  ('FLASH15', 15, 1),
  ('VIP30', 30, 1);
