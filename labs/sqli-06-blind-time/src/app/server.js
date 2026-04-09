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
    await pool.query("INSERT INTO config (name, value) VALUES (?, ?)", ["flag", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO config (name, value) VALUES (?, ?)", ["flag", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #0c0c0c; color: #00ff41; min-height: 100vh; }
    .header { background: #111; border-bottom: 1px solid #222; padding: 1rem 2rem; }
    .header h1 { color: #00ff41; font-size: 1.2rem; }
    .header .tagline { color: #555; font-size: 0.75rem; }
    .main { max-width: 600px; margin: 3rem auto; padding: 0 1rem; }
    .check-box { background: #111; border: 1px solid #222; border-radius: 4px; padding: 1.5rem; margin-bottom: 2rem; }
    .check-box h2 { color: #00ff41; font-size: 0.95rem; margin-bottom: 1rem; }
    .check-box form { display: flex; gap: 0.75rem; }
    .check-box input { flex: 1; padding: 0.5rem 0.75rem; background: #0c0c0c; border: 1px solid #333; color: #00ff41; font-family: monospace; font-size: 0.9rem; }
    .check-box input:focus { outline: none; border-color: #00ff41; }
    .check-box button { padding: 0.5rem 1.25rem; background: #003b00; color: #00ff41; border: 1px solid #00ff41; font-family: monospace; cursor: pointer; }
    .result { background: #111; border: 1px solid #222; padding: 1rem; border-radius: 4px; font-size: 0.85rem; }
    .result .line { margin: 0.25rem 0; }
    .prompt { color: #555; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>IronGrid Monitor</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>[IronGrid Systems]</h1><span class="tagline">Infrastructure Health Monitor v3.1</span></div>
    <div class="main">
      <div class="check-box">
        <h2>> host_check --id &lt;HOST_ID&gt;</h2>
        <form method="GET" action="/check">
          <input type="text" name="id" placeholder="Enter host ID">
          <button type="submit">CHECK</button>
        </form>
      </div>
      <div class="result">
        <div class="line"><span class="prompt">$</span> Awaiting input...</div>
      </div>
    </div>
  </body></html>`);
});

app.get("/check", async (req, res) => {
  const id = req.query.id || "";
  if (!id) return res.redirect("/");

  // Always show the same response regardless of query result
  // The only side channel is time (SLEEP injection)
  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT id FROM hosts WHERE id=${id}`;
    await pool.query(query);
  } catch {
    // Suppress all errors — no information leakage via errors
  }

  // Always return the exact same response
  res.send(`<!DOCTYPE html><html><head><title>IronGrid Monitor</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>[IronGrid Systems]</h1><span class="tagline">Infrastructure Health Monitor v3.1</span></div>
    <div class="main">
      <div class="check-box">
        <h2>> host_check --id &lt;HOST_ID&gt;</h2>
        <form method="GET" action="/check">
          <input type="text" name="id" placeholder="Enter host ID" value="${id}">
          <button type="submit">CHECK</button>
        </form>
      </div>
      <div class="result">
        <div class="line"><span class="prompt">$</span> host_check --id ${id}</div>
        <div class="line"><span class="prompt">></span> Status: OK</div>
        <div class="line"><span class="prompt">></span> Check completed.</div>
      </div>
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
