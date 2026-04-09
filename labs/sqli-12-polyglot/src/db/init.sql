CREATE TABLE page_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(100),
  region VARCHAR(50),
  view_count INT,
  source VARCHAR(100)
);

CREATE TABLE analytics_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  value VARCHAR(200)
);

INSERT INTO page_views (page, region, view_count, source) VALUES
  ('/dashboard', 'us-east', 14520, 'organic-search'),
  ('/pricing', 'us-west', 8340, 'direct'),
  ('/features', 'eu-west', 6780, 'social-media'),
  ('/about', 'ap-south', 3210, 'referral'),
  ('/docs', 'us-east', 11200, 'organic-search'),
  ('/blog', 'eu-central', 5670, 'social-media'),
  ('/contact', 'us-west', 2100, 'direct');
