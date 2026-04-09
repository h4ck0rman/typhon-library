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
    multipleStatements: false,
  });

  try {
    await pool.query("INSERT INTO waf_secrets (flag_name, flag_value) VALUES (?, ?)", ["ctf", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO waf_secrets (flag_name, flag_value) VALUES (?, ?)", ["ctf", FLAG]);
  }
}

// WAF: blocks common SQL keywords (but can be bypassed with inline comments, etc.)
const BLOCKED_PATTERNS = [
  /\bunion\b/i,
  /\bselect\b/i,
  /\bfrom\b/i,
  /\bwhere\b/i,
  /\band\b/i,
  /\bor\b/i,
  /--/,
  /#/,
];

function wafCheck(input) {
  // Strip inline comments before checking — WAIT, that would make it secure.
  // The WAF naively checks the raw input without stripping comments first.
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return false;
    }
  }
  return true;
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #09090b; color: #e4e4e7; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #18181b, #27272a); padding: 1.25rem 2rem; border-bottom: 1px solid #3f3f46; }
    .header h1 { color: #22d3ee; font-size: 1.4rem; }
    .header .sub { color: #71717a; font-size: 0.75rem; }
    .main { max-width: 850px; margin: 2rem auto; padding: 0 1rem; }
    .search-bar { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
    .search-bar form { display: flex; gap: 0.5rem; }
    .search-bar input { flex: 1; padding: 0.6rem 0.75rem; background: #09090b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; font-size: 0.9rem; }
    .search-bar button { padding: 0.6rem 1.25rem; background: #0891b2; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .waf-blocked { background: #7f1d1d; border: 1px solid #991b1b; color: #fca5a5; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; }
    .waf-blocked strong { display: block; font-size: 1rem; margin-bottom: 0.25rem; }
    .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
    .product { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 1.25rem; }
    .product h3 { color: #22d3ee; font-size: 0.95rem; margin-bottom: 0.4rem; }
    .product .spec { color: #a1a1aa; font-size: 0.8rem; margin-bottom: 0.5rem; }
    .product .price { color: #34d399; font-weight: 600; }
    .product .cat { color: #52525b; font-size: 0.75rem; margin-top: 0.5rem; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
  </style>
`;

function renderProducts(rows) {
  if (!rows.length) return '<p style="color:#71717a;text-align:center;padding:2rem;">No products found.</p>';
  return '<div class="products">' + rows.map((p) => `
    <div class="product">
      <h3>${p.name}</h3>
      <div class="spec">${p.spec || ""}</div>
      <div class="price">$${p.price}</div>
      <div class="cat">${p.category || ""}</div>
    </div>`).join("") + "</div>";
}

app.get("/", async (req, res) => {
  const q = req.query.q || "";
  let contentHtml = "";

  if (q) {
    if (!wafCheck(q)) {
      contentHtml = `<div class="waf-blocked"><strong>WAF BLOCKED</strong>Suspicious input detected. Your request has been denied.</div>`;
    } else {
      try {
        // VULNERABLE: User input concatenated into query (WAF is the only "protection")
        const query = `SELECT name, spec, price, category FROM products WHERE name LIKE '%${q}%' OR spec LIKE '%${q}%'`;
        const [rows] = await pool.query(query);
        contentHtml = renderProducts(rows);
      } catch (err) {
        contentHtml = `<div class="error">${err.message}</div>`;
      }
    }
  } else {
    try {
      const [rows] = await pool.query("SELECT name, spec, price, category FROM products ORDER BY id");
      contentHtml = renderProducts(rows);
    } catch {
      contentHtml = '<p style="color:#71717a;">Unable to load products.</p>';
    }
  }

  res.send(`<!DOCTYPE html><html><head><title>NovaTech</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>NovaTech</h1><span class="sub">Premium Tech Catalog | Protected by NovaShield WAF</span></div>
    <div class="main">
      <div class="search-bar"><form method="GET"><input name="q" placeholder="Search catalog..." value="${q}"><button type="submit">Search</button></form></div>
      ${contentHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
