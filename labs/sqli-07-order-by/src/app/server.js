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
    await pool.query("INSERT INTO flag_store (value) VALUES (?)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO flag_store (value) VALUES (?)", [FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #1a0533, #0d1b2a); padding: 1.5rem 2rem; text-align: center; }
    .header h1 { color: #c084fc; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 3px; }
    .header .tagline { color: #6b7280; font-size: 0.8rem; margin-top: 0.25rem; }
    .main { max-width: 850px; margin: 2rem auto; padding: 0 1rem; }
    table { width: 100%; border-collapse: collapse; background: #111; border-radius: 8px; overflow: hidden; }
    th { background: #1a0533; color: #c084fc; padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
    th a { color: #c084fc; text-decoration: none; }
    th a:hover { color: #e9d5ff; }
    td { padding: 0.65rem 1rem; border-bottom: 1px solid #222; font-size: 0.9rem; }
    tr:hover { background: #1a1a1a; }
    .rank { color: #c084fc; font-weight: 600; }
    .username { color: #22d3ee; }
    .score { color: #fbbf24; font-weight: 600; }
    .kd { color: #6b7280; }
    .tier { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .tier.Diamond { background: #1e3a5f; color: #7dd3fc; }
    .tier.Platinum { background: #1a3329; color: #6ee7b7; }
    .tier.Gold { background: #3d2e00; color: #fbbf24; }
    .tier.Silver { background: #27272a; color: #a1a1aa; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
  </style>
`;

app.get("/", async (req, res) => {
  const sort = req.query.sort || "score";
  const dir = req.query.dir || "DESC";

  let tableHtml = "";
  try {
    // VULNERABLE: sort parameter injected directly into ORDER BY clause
    const query = `SELECT username, score, kills, deaths, rank_tier FROM players ORDER BY ${sort} ${dir === "ASC" ? "ASC" : "DESC"}`;
    const [rows] = await pool.query(query);

    tableHtml = `<table>
      <tr>
        <th>#</th>
        <th><a href="/?sort=username&dir=${sort === "username" && dir !== "ASC" ? "ASC" : "DESC"}">Player</a></th>
        <th><a href="/?sort=score&dir=${sort === "score" && dir !== "ASC" ? "ASC" : "DESC"}">Score</a></th>
        <th><a href="/?sort=kills&dir=${sort === "kills" && dir !== "ASC" ? "ASC" : "DESC"}">Kills</a></th>
        <th><a href="/?sort=deaths&dir=${sort === "deaths" && dir !== "ASC" ? "ASC" : "DESC"}">Deaths</a></th>
        <th>Tier</th>
      </tr>` + rows.map((r, i) => `
      <tr>
        <td class="rank">${i + 1}</td>
        <td class="username">${r.username}</td>
        <td class="score">${r.score.toLocaleString()}</td>
        <td>${r.kills}</td>
        <td class="kd">${r.deaths}</td>
        <td><span class="tier ${r.rank_tier}">${r.rank_tier}</span></td>
      </tr>`).join("") + "</table>";
  } catch (err) {
    tableHtml = `<div class="error">Query error: ${err.message}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>FragZone Leaderboard</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>FragZone</h1><span class="tagline">Season 7 Leaderboard</span></div>
    <div class="main">${tableHtml}</div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
