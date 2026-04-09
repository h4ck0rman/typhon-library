CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  company VARCHAR(100),
  location VARCHAR(100),
  salary VARCHAR(50)
);

CREATE TABLE hidden_credentials (
  id SERIAL PRIMARY KEY,
  credential VARCHAR(200)
);

INSERT INTO jobs (title, company, location, salary) VALUES
  ('Senior Backend Engineer', 'Nexon Systems', 'San Francisco, CA', '$180k-$220k'),
  ('DevOps Lead', 'CloudPeak', 'Remote', '$160k-$200k'),
  ('Security Analyst', 'CyberVault Inc', 'Austin, TX', '$130k-$170k'),
  ('Full Stack Developer', 'StartGrid', 'New York, NY', '$140k-$180k'),
  ('ML Engineer', 'DataForge AI', 'Seattle, WA', '$190k-$240k'),
  ('Platform Engineer', 'InfraCore', 'Remote', '$155k-$195k');
