const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const FLAG = process.env.FLAG || "TYPHON{default_flag}";

let pool;
const webhookLogs = [];

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
    await pool.query("INSERT INTO oast_secrets (secret) VALUES (?)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO oast_secrets (secret) VALUES (?)", [FLAG]);
  }

  // Write flag to file on DB server for LOAD_FILE exfil path
  try {
    await pool.query(`SELECT '${FLAG}' INTO OUTFILE '/var/flag.txt'`);
  } catch {}
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #a3e635; min-height: 100vh; }
    .header { background: #111; border-bottom: 1px solid #1a1a1a; padding: 1rem 2rem; }
    .header h1 { color: #a3e635; font-size: 1.2rem; }
    .header .sub { color: #444; font-size: 0.75rem; }
    .main { max-width: 700px; margin: 2rem auto; padding: 0 1rem; }
    .box { background: #111; border: 1px solid #222; border-radius: 4px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .box h2 { color: #a3e635; font-size: 0.95rem; margin-bottom: 0.75rem; }
    .box p { color: #555; font-size: 0.8rem; margin-bottom: 1rem; }
    .box form { display: flex; gap: 0.5rem; }
    .box input { flex: 1; padding: 0.5rem; background: #0a0a0a; border: 1px solid #333; color: #a3e635; font-family: monospace; }
    .box button { padding: 0.5rem 1rem; background: #1a3a00; color: #a3e635; border: 1px solid #a3e635; font-family: monospace; cursor: pointer; }
    .result { padding: 0.75rem; background: #0a0a0a; border: 1px solid #222; font-size: 0.85rem; }
    .webhook-log { background: #0a0a0a; border: 1px solid #222; padding: 0.5rem; margin-top: 0.5rem; font-size: 0.8rem; color: #666; overflow-x: auto; }
    .webhook-log .entry { border-bottom: 1px solid #1a1a1a; padding: 0.25rem 0; }
    .error { color: #ef4444; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>ArcNet Inventory</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>[ArcNet]</h1><span class="sub">Inventory Management System</span></div>
    <div class="main">
      <div class="box">
        <h2>> inventory_lookup --sku &lt;ID&gt;</h2>
        <p>Query inventory by SKU ID number.</p>
        <form method="GET" action="/lookup">
          <input name="id" placeholder="SKU ID (e.g. 1)">
          <button type="submit">QUERY</button>
        </form>
      </div>
      <div class="box">
        <h2>> webhook_logs</h2>
        <p>View captured webhook requests at <a href="/webhook/logs" style="color:#a3e635;">/webhook/logs</a></p>
        <p>Send data to <span style="color:#a3e635;">/webhook/catch?data=YOUR_DATA</span></p>
      </div>
    </div>
  </body></html>`);
});

app.get("/lookup", async (req, res) => {
  const id = req.query.id || "";
  if (!id) return res.redirect("/");

  // Always return the same response — no in-band data channel
  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT name FROM inventory WHERE id=${id}`;
    await pool.query({ sql: query, timeout: 1000 }); // 1-second timeout kills SLEEP()
  } catch {
    // Suppress all errors
  }

  // Always the same output regardless of result
  res.send(`<!DOCTYPE html><html><head><title>ArcNet Inventory</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>[ArcNet]</h1><span class="sub">Inventory Management System</span></div>
    <div class="main">
      <div class="box">
        <h2>> inventory_lookup --sku ${id}</h2>
        <form method="GET" action="/lookup">
          <input name="id" placeholder="SKU ID" value="${id}">
          <button type="submit">QUERY</button>
        </form>
      </div>
      <div class="result">> Query processed. Results restricted to authorized terminals only.</div>
    </div>
  </body></html>`);
});

// Webhook catcher — simulates an external collaborator/listener
app.get("/webhook/catch", (req, res) => {
  const entry = {
    time: new Date().toISOString(),
    method: "GET",
    query: req.query,
    headers: { host: req.headers.host, "user-agent": req.headers["user-agent"] },
  };
  webhookLogs.push(entry);
  res.json({ status: "captured" });
});

app.post("/webhook/catch", express.text({ type: "*/*" }), (req, res) => {
  const entry = {
    time: new Date().toISOString(),
    method: "POST",
    body: req.body,
    query: req.query,
    headers: { host: req.headers.host, "content-type": req.headers["content-type"] },
  };
  webhookLogs.push(entry);
  res.json({ status: "captured" });
});

app.get("/webhook/logs", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Webhook Logs - ArcNet</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>[ArcNet]</h1><span class="sub">Webhook Capture Logs</span></div>
    <div class="main">
      <div class="box">
        <h2>> captured_requests (${webhookLogs.length})</h2>
        ${webhookLogs.length === 0 ? '<p>No requests captured yet.</p>' :
          webhookLogs.map((e) => `<div class="webhook-log"><div class="entry"><strong>${e.time}</strong> ${e.method} ${JSON.stringify(e.query || {})} ${e.body ? "BODY: " + e.body : ""}</div></div>`).join("")}
      </div>
      <div class="box"><p><a href="/" style="color:#a3e635;">&larr; Back to inventory</a></p></div>
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
