CREATE TABLE metrics (
  id SERIAL PRIMARY KEY,
  server_name VARCHAR(50) NOT NULL,
  cpu_pct DECIMAL(5,2),
  mem_mb INT,
  status VARCHAR(20)
);

INSERT INTO metrics (server_name, cpu_pct, mem_mb, status) VALUES
  ('app-server-01', 42.5, 2048, 'healthy'),
  ('app-server-02', 78.3, 3584, 'warning'),
  ('db-primary', 23.1, 8192, 'healthy'),
  ('cache-redis-01', 15.8, 1024, 'healthy'),
  ('worker-queue', 91.2, 4096, 'critical'),
  ('lb-frontend', 33.7, 512, 'healthy');

-- Write the flag to a file accessible to postgres user
-- Uses environment variable passed via docker-compose
DO $$
BEGIN
  EXECUTE format('COPY (SELECT %L) TO ''/var/flag.txt''', current_setting('server_version'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
