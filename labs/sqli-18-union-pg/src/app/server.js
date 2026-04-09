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
  try {
    await pool.query("INSERT INTO hidden_credentials (credential) VALUES ($1)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO hidden_credentials (credential) VALUES ($1)", [FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f4; color: #1c1917; min-height: 100vh; }
    .header { background: #2563eb; padding: 1.25rem 2rem; }
    .header h1 { color: white; font-size: 1.5rem; }
    .header .sub { color: rgba(255,255,255,0.7); font-size: 0.8rem; }
    .main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .search-box { background: white; border: 1px solid #e5e5e5; border-radius: 10px; padding: 1.25rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .search-box form { display: flex; gap: 0.5rem; }
    .search-box input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 0.9rem; }
    .search-box button { padding: 0.6rem 1.25rem; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .jobs { display: grid; gap: 1rem; }
    .job { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .job h3 { color: #2563eb; font-size: 1rem; margin-bottom: 0.3rem; }
    .job .company { color: #525252; font-weight: 500; }
    .job .meta { color: #a3a3a3; font-size: 0.8rem; margin-top: 0.4rem; }
    .job .salary { color: #16a34a; font-weight: 600; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
    .no-results { color: #a3a3a3; text-align: center; padding: 3rem; }
  </style>
`;

app.get("/", async (req, res) => {
  const q = req.query.q || "";
  let contentHtml = "";

  try {
    let result;
    if (q) {
      // VULNERABLE: User input concatenated directly into SQL query
      const query = `SELECT title, company, location, salary FROM jobs WHERE title ILIKE '%${q}%' OR company ILIKE '%${q}%'`;
      result = await pool.query(query);
    } else {
      result = await pool.query("SELECT title, company, location, salary FROM jobs ORDER BY id");
    }

    if (result.rows.length === 0) {
      contentHtml = '<div class="no-results">No jobs found matching your search.</div>';
    } else {
      contentHtml = '<div class="jobs">' + result.rows.map((j) => `
        <div class="job">
          <h3>${j.title}</h3>
          <div class="company">${j.company}</div>
          <div class="meta">${j.location} &bull; <span class="salary">${j.salary}</span></div>
        </div>`).join("") + "</div>";
    }
  } catch (err) {
    contentHtml = `<div class="error">${err.message}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>HireWave</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>HireWave</h1><span class="sub">Find your next role in tech</span></div>
    <div class="main">
      <div class="search-box"><form method="GET"><input name="q" placeholder="Search jobs..." value="${q}"><button type="submit">Search</button></form></div>
      ${contentHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
