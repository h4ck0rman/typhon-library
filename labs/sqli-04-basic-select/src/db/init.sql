CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  author VARCHAR(100)
);

CREATE TABLE admin_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note TEXT
);

INSERT INTO articles (title, content, author) VALUES
  ('Global Markets Rally on Tech Earnings', 'Major tech companies exceeded expectations in Q3, pushing indices to new highs. Analysts cite strong cloud revenue and AI investments as key drivers.', 'Sarah Mitchell'),
  ('New Cybersecurity Framework Released', 'NIST has published an updated cybersecurity framework addressing supply chain risks and zero-trust architectures for critical infrastructure.', 'James Park'),
  ('Renewable Energy Investment Hits Record', 'Global investment in renewable energy surpassed $500B for the first time, with solar and wind leading the charge across emerging markets.', 'Anika Patel'),
  ('Space Tourism Enters Commercial Phase', 'Two private companies announced regular orbital flights beginning next quarter, marking a new era in civilian space travel.', 'Marcus Rivera');
