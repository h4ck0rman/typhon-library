CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100),
  genre VARCHAR(50),
  price DECIMAL(8,2)
);

CREATE TABLE credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  secret VARCHAR(200)
);

INSERT INTO books (title, author, genre, price) VALUES
  ('The Midnight Algorithm', 'Elena Vasquez', 'thriller', 14.99),
  ('Quantum Gardens', 'Hiroshi Tanaka', 'sci-fi', 18.50),
  ('Rust and Ruin', 'Amara Osei', 'dystopian', 12.99),
  ('Silent Protocols', 'Viktor Petrov', 'thriller', 16.00),
  ('The Memory Broker', 'Lena Fischer', 'mystery', 13.75),
  ('Orbits of Deceit', 'Carlos Mendez', 'sci-fi', 19.99);
