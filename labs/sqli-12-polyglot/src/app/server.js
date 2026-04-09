const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const FLAG = process.env.FLAG || "TYPHON{default_flag}";

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "typhon",
    database: process.env.DB_NAME || "app",
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    await pool.query("INSERT INTO analytics_keys (name, value) VALUES (?, ?)", ["api_key", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO analytics_keys (name, value) VALUES (?, ?)", ["api_key", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #cbd5e1; min-height: 100vh; }
    .header { background: #1e293b; padding: 1rem 2rem; border-bottom: 1px solid #334155; }
    .header h1 { color: #38bdf8; font-size: 1.3rem; }
    .header .sub { color: #64748b; font-size: 0.75rem; }
    .main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .filter-bar { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    .filter-bar h2 { color: #38bdf8; font-size: 0.95rem; margin-bottom: 0.75rem; }
    .filter-bar form { display: flex; gap: 0.5rem; }
    .filter-bar input { flex: 1; padding: 0.5rem 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #cbd5e1; font-size: 0.85rem; }
    .filter-bar button { padding: 0.5rem 1rem; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .section { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .section h3 { color: #38bdf8; font-size: 0.9rem; margin-bottom: 0.75rem; }
    table { width: 100%; border-collapse: collapse; }
    th { color: #64748b; font-size: 0.75rem; text-transform: uppercase; padding: 0.5rem; text-align: left; border-bottom: 1px solid #334155; }
    td { padding: 0.5rem; font-size: 0.85rem; border-bottom: 1px solid #1e293b; }
    .num { color: #38bdf8; font-weight: 600; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; word-break: break-all; }
  </style>
`;

app.get("/", async (req, res) => {
  const filter = req.query.filter || "";

  let section1 = "", section2 = "", section3 = "";

  if (filter) {
    // VULNERABLE: Same user input injected into 3 different query contexts
    // Context 1: String comparison
    try {
      const q1 = `SELECT page, region, view_count FROM page_views WHERE region='${filter}'`;
      const [rows] = await pool.query(q1);
      section1 = renderTable("By Region", ["Page", "Region", "Views"], rows.map((r) => [r.page, r.region, r.view_count]));
    } catch (err) {
      section1 = `<div class="section"><h3>By Region</h3><div class="error">${err.message}</div></div>`;
    }

    // Context 2: Numeric comparison
    try {
      const q2 = `SELECT page, view_count FROM page_views WHERE view_count > ${filter}`;
      const [rows] = await pool.query(q2);
      section2 = renderTable("High Traffic", ["Page", "Views"], rows.map((r) => [r.page, r.view_count]));
    } catch (err) {
      section2 = `<div class="section"><h3>High Traffic</h3><div class="error">${err.message}</div></div>`;
    }

    // Context 3: LIKE pattern
    try {
      const q3 = `SELECT page, source, view_count FROM page_views WHERE source LIKE '%${filter}%'`;
      const [rows] = await pool.query(q3);
      section3 = renderTable("By Source", ["Page", "Source", "Views"], rows.map((r) => [r.page, r.source, r.view_count]));
    } catch (err) {
      section3 = `<div class="section"><h3>By Source</h3><div class="error">${err.message}</div></div>`;
    }
  } else {
    try {
      const [rows] = await pool.query("SELECT page, region, view_count, source FROM page_views ORDER BY view_count DESC");
      section1 = renderTable("All Page Views", ["Page", "Region", "Views", "Source"], rows.map((r) => [r.page, r.region, r.view_count, r.source]));
    } catch {
      section1 = '<div class="section"><p>Unable to load data.</p></div>';
    }
  }

  res.send(`<!DOCTYPE html><html><head><title>DataPulse Analytics</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>DataPulse</h1><span class="sub">Real-time Analytics Dashboard</span></div>
    <div class="main">
      <div class="filter-bar">
        <h2>Filter Analytics</h2>
        <form method="GET"><input name="filter" placeholder="Filter by region, count, or source..." value="${filter}"><button type="submit">Apply</button></form>
      </div>
      ${section1}${section2}${section3}
    </div>
  </body></html>`);
});

function renderTable(title, headers, rows) {
  if (!rows.length) return `<div class="section"><h3>${title}</h3><p style="color:#64748b;">No results.</p></div>`;
  return `<div class="section"><h3>${title}</h3><table>
    <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    ${rows.map((r) => `<tr>${r.map((c, i) => `<td${i === r.length - 1 ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}
  </table></div>`;
}

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
