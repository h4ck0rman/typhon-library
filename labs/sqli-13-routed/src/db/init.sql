CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ref_code VARCHAR(20) NOT NULL,
  subject VARCHAR(200),
  status VARCHAR(20),
  priority VARCHAR(20)
);

CREATE TABLE ticket_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flag_value VARCHAR(200)
);

INSERT INTO tickets (ref_code, subject, status, priority) VALUES
  ('TK-4821', 'Cannot access dashboard after update', 'open', 'high'),
  ('TK-4822', 'Password reset email not received', 'in-progress', 'medium'),
  ('TK-4823', 'Billing shows incorrect amount', 'open', 'high'),
  ('TK-4824', 'Feature request: dark mode', 'closed', 'low'),
  ('TK-4825', 'API rate limit too restrictive', 'open', 'medium');
