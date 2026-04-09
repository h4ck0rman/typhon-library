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
    await pool.query("INSERT INTO promo_secrets (secret) VALUES (?)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO promo_secrets (secret) VALUES (?)", [FLAG]);
  }
}

// WAF: blocks spaces, common keywords, and comment-based termination
const BLOCKED_PATTERNS = [
  / /,            // literal spaces
  /\bunion\b/i,   // UNION keyword
  /\bselect\b/i,  // SELECT keyword
  /\bfrom\b/i,    // FROM keyword
  /--/,           // single-line comment
  /#/,            // hash comment
];

function wafCheck(input) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) return false;
  }
  return true;
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fef3c7; color: #1c1917; min-height: 100vh; }
    .header { background: #f59e0b; padding: 1.25rem 2rem; }
    .header h1 { color: white; font-size: 1.5rem; }
    .header .sub { color: rgba(255,255,255,0.8); font-size: 0.8rem; }
    .main { max-width: 500px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 1.5rem; }
    .card h2 { color: #b45309; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card p { color: #78716c; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .card form { display: flex; gap: 0.5rem; }
    .card input { flex: 1; padding: 0.6rem 0.75rem; border: 2px solid #fbbf24; border-radius: 8px; font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .card input:focus { outline: none; border-color: #f59e0b; }
    .card button { padding: 0.6rem 1.25rem; background: #f59e0b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .result { text-align: center; padding: 1.5rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; }
    .result.valid { background: #ecfdf5; border: 2px solid #6ee7b7; color: #065f46; }
    .result.invalid { background: #fef2f2; border: 2px solid #fecaca; color: #991b1b; }
    .result.blocked { background: #fefce8; border: 2px solid #fde68a; color: #92400e; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>DealZone</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>DealZone</h1><span class="sub">The best coupons on the internet</span></div>
    <div class="main">
      <div class="card">
        <h2>Validate Coupon</h2>
        <p>Check if your coupon code is valid and active.</p>
        <form method="GET" action="/validate">
          <input name="code" placeholder="COUPON CODE">
          <button type="submit">Check</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.get("/validate", async (req, res) => {
  const code = req.query.code || "";
  if (!code) return res.redirect("/");

  let resultHtml = "";

  if (!wafCheck(code)) {
    resultHtml = '<div class="result blocked">BLOCKED — Suspicious input detected</div>';
  } else {
    try {
      // VULNERABLE: User input concatenated directly into SQL query
      const query = `SELECT id FROM coupons WHERE code='${code}' AND active=1`;
      const [rows] = await pool.query(query);

      if (rows.length > 0) {
        resultHtml = '<div class="result valid">VALID COUPON</div>';
      } else {
        resultHtml = '<div class="result invalid">INVALID COUPON</div>';
      }
    } catch {
      // Suppress errors — no error-based channel
      resultHtml = '<div class="result invalid">INVALID COUPON</div>';
    }
  }

  res.send(`<!DOCTYPE html><html><head><title>Validate - DealZone</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>DealZone</h1><span class="sub">The best coupons on the internet</span></div>
    <div class="main">
      <div class="card">
        <h2>Validate Coupon</h2>
        <form method="GET" action="/validate">
          <input name="code" placeholder="COUPON CODE" value="${code}">
          <button type="submit">Check</button>
        </form>
      </div>
      ${resultHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
