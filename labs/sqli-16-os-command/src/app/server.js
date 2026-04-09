const express = require("express");
const { Pool } = require("pg");

const app = express();
const FLAG = process.env.FLAG || "TYPHON{default_flag}";

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "typhon",
  database: process.env.DB_NAME || "app",
  max: 5,
});

async function initDb() {
  // Write the flag to a file on the DB server
  try {
    await pool.query(`COPY (SELECT '${FLAG}') TO '/var/flag.txt'`);
  } catch {
    // May already exist
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0c0a09; color: #d6d3d1; min-height: 100vh; }
    .header { background: #1c1917; border-bottom: 1px solid #292524; padding: 1rem 2rem; }
    .header h1 { color: #f97316; font-size: 1.3rem; }
    .header .sub { color: #57534e; font-size: 0.75rem; }
    .main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .search-box { background: #1c1917; border: 1px solid #292524; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    .search-box form { display: flex; gap: 0.5rem; }
    .search-box input { flex: 1; padding: 0.5rem 0.75rem; background: #0c0a09; border: 1px solid #44403c; border-radius: 6px; color: #d6d3d1; font-size: 0.85rem; }
    .search-box button { padding: 0.5rem 1rem; background: #c2410c; color: white; border: none; border-radius: 6px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; background: #1c1917; border-radius: 8px; overflow: hidden; }
    th { background: #292524; color: #a8a29e; font-size: 0.75rem; text-transform: uppercase; padding: 0.6rem 0.75rem; text-align: left; }
    td { padding: 0.6rem 0.75rem; border-bottom: 1px solid #292524; font-size: 0.85rem; }
    .healthy { color: #34d399; }
    .warning { color: #fbbf24; }
    .critical { color: #ef4444; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
  </style>
`;

app.get("/", async (req, res) => {
  const q = req.query.q || "";
  let tableHtml = "";

  try {
    let result;
    if (q) {
      // VULNERABLE: User input concatenated directly into SQL query — PostgreSQL supports stacked queries
      const query = `SELECT server_name, cpu_pct, mem_mb, status FROM metrics WHERE server_name ILIKE '%${q}%'`;
      result = await pool.query(query);
    } else {
      result = await pool.query("SELECT server_name, cpu_pct, mem_mb, status FROM metrics ORDER BY id");
    }

    tableHtml = `<table><tr><th>Server</th><th>CPU %</th><th>Memory (MB)</th><th>Status</th></tr>` +
      result.rows.map((r) => `<tr>
        <td>${r.server_name}</td>
        <td>${r.cpu_pct}%</td>
        <td>${r.mem_mb}</td>
        <td class="${r.status}">${r.status}</td>
      </tr>`).join("") + "</table>";
    if (result.rows.length === 0) tableHtml = '<p style="color:#57534e;text-align:center;padding:2rem;">No servers found.</p>';
  } catch (err) {
    tableHtml = `<div class="error">${err.message}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>SysForge</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>SysForge</h1><span class="sub">DevOps Monitoring Dashboard</span></div>
    <div class="main">
      <div class="search-box"><form method="GET"><input name="q" placeholder="Search servers..." value="${q}"><button type="submit">Search</button></form></div>
      ${tableHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
