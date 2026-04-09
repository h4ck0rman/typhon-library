const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.urlencoded({ extended: true }));

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
    await pool.query("INSERT INTO ticket_secrets (flag_value) VALUES (?)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO ticket_secrets (flag_value) VALUES (?)", [FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fafaf9; color: #1c1917; min-height: 100vh; }
    .header { background: #1c1917; padding: 1rem 2rem; }
    .header h1 { color: #f97316; font-size: 1.3rem; }
    .header .sub { color: #78716c; font-size: 0.75rem; }
    .main { max-width: 650px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border: 1px solid #e7e5e4; border-radius: 10px; padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .card h2 { color: #f97316; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card p { color: #78716c; font-size: 0.85rem; margin-bottom: 1.25rem; }
    label { display: block; color: #44403c; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.3rem; }
    input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d6d3d1; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #f97316; }
    button { width: 100%; padding: 0.6rem; background: #f97316; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    button:hover { background: #ea580c; }
    .ticket { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1.25rem; }
    .ticket h3 { font-size: 1rem; margin-bottom: 0.5rem; }
    .ticket .meta { color: #78716c; font-size: 0.8rem; }
    .ticket .meta span { margin-right: 1rem; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .badge.high { background: #fef2f2; color: #dc2626; }
    .badge.medium { background: #fffbeb; color: #d97706; }
    .badge.low { background: #f0fdf4; color: #16a34a; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; font-family: monospace; white-space: pre-wrap; }
    .not-found { color: #78716c; text-align: center; padding: 2rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>TicketHub</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>TicketHub</h1><span class="sub">Support Ticket Portal</span></div>
    <div class="main">
      <div class="card">
        <h2>Lookup Ticket</h2>
        <p>Enter your ticket reference code to view details.</p>
        <form method="GET" action="/ticket">
          <label>Reference Code</label>
          <input type="text" name="ref" placeholder="e.g. TK-4821">
          <button type="submit">Lookup</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.get("/ticket", async (req, res) => {
  const ref = req.query.ref || "";
  if (!ref) return res.redirect("/");

  let resultHtml = "";

  try {
    // STAGE 1: Find ticket ID by reference code (VULNERABLE)
    const query1 = `SELECT id FROM tickets WHERE ref_code='${ref}'`;
    const [rows1] = await pool.query(query1);

    if (rows1.length === 0) {
      resultHtml = '<div class="not-found">No ticket found with that reference code.</div>';
    } else {
      const ticketId = rows1[0].id;

      // STAGE 2: Fetch ticket details using the ID from stage 1 (ALSO VULNERABLE — uses result directly)
      const query2 = `SELECT id, ref_code, subject, status, priority FROM tickets WHERE id=${ticketId}`;
      const [rows2] = await pool.query(query2);

      if (rows2.length > 0) {
        const t = rows2[0];
        resultHtml = `<div class="ticket">
          <h3>${t.subject}</h3>
          <div class="meta">
            <span>Ref: ${t.ref_code}</span>
            <span>Status: ${t.status}</span>
            <span class="badge ${t.priority}">${t.priority}</span>
          </div>
        </div>`;
      } else {
        resultHtml = '<div class="not-found">Ticket details not found.</div>';
      }
    }
  } catch (err) {
    resultHtml = `<div class="error">Error: ${err.message}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>Ticket Details - TicketHub</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>TicketHub</h1><span class="sub">Support Ticket Portal</span></div>
    <div class="main">
      <div class="card">
        <h2>Ticket Lookup</h2>
        <form method="GET" action="/ticket">
          <input type="text" name="ref" placeholder="Reference code" value="${ref}">
          <button type="submit">Lookup</button>
        </form>
      </div>
      ${resultHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
