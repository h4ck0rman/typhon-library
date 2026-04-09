CREATE TABLE players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  kills INT NOT NULL,
  deaths INT NOT NULL,
  rank_tier VARCHAR(20)
);

CREATE TABLE flag_store (
  id INT AUTO_INCREMENT PRIMARY KEY,
  value VARCHAR(200)
);

INSERT INTO players (username, score, kills, deaths, rank_tier) VALUES
  ('xShadowKill', 48750, 892, 234, 'Diamond'),
  ('N3onBl4st', 45200, 810, 298, 'Diamond'),
  ('VoidWalker', 42100, 756, 312, 'Platinum'),
  ('CyberPh0enix', 39800, 698, 345, 'Platinum'),
  ('DarkMatter99', 37500, 654, 367, 'Gold'),
  ('PixelStorm', 34200, 612, 389, 'Gold'),
  ('BinaryGhost', 31000, 567, 412, 'Silver'),
  ('ZeroDay_X', 28400, 523, 434, 'Silver');
