CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  dob VARCHAR(20),
  condition_desc TEXT,
  doctor VARCHAR(100)
);

INSERT INTO patients (name, dob, condition_desc, doctor) VALUES
  ('John Mercer', '1985-03-14', 'Annual checkup - all clear', 'Dr. Sarah Kim'),
  ('Emily Torres', '1992-07-22', 'Follow-up for hypertension', 'Dr. James Okonkwo'),
  ('Robert Chang', '1978-11-03', 'Post-surgical recovery - knee', 'Dr. Maria Santos'),
  ('Lisa Nakamura', '1990-01-18', 'Routine blood work review', 'Dr. Sarah Kim');

-- Write the flag to a file on the MySQL server filesystem
-- The FLAG env var is set via docker-compose
SET @flag = (SELECT IFNULL(@@global.init_connect, ''));
