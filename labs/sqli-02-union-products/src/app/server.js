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

  // Seed the flag into the secret table on startup
  try {
    await pool.query(
      "INSERT INTO secret_flags (flag_name, flag_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag_value=VALUES(flag_value)",
      ["main", FLAG]
    );
  } catch {
    // Table may not be ready yet on first run; retry once
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query(
      "INSERT INTO secret_flags (flag_name, flag_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag_value=VALUES(flag_value)",
      ["main", FLAG]
    );
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #e4e4e7; min-height: 100vh; }
    .header { background: #18181b; border-bottom: 1px solid #27272a; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { color: #a78bfa; font-size: 1.4rem; }
    .header .tagline { color: #71717a; font-size: 0.8rem; }
    .main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .search-box { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; }
    .search-box form { display: flex; gap: 0.75rem; }
    .search-box input[type="text"] { flex: 1; padding: 0.6rem 1rem; background: #09090b; border: 1px solid #3f3f46; border-radius: 6px; color: #e4e4e7; font-size: 0.9rem; }
    .search-box input:focus { outline: none; border-color: #a78bfa; }
    .search-box button { padding: 0.6rem 1.5rem; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .search-box button:hover { background: #6d28d9; }
    .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .product-card { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 1.25rem; }
    .product-card h3 { color: #a78bfa; font-size: 1rem; margin-bottom: 0.5rem; }
    .product-card .desc { color: #a1a1aa; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .product-card .price { color: #34d399; font-weight: 600; font-size: 1.1rem; }
    .product-card .cat { color: #71717a; font-size: 0.75rem; margin-top: 0.5rem; }
    .no-results { color: #71717a; text-align: center; padding: 3rem; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; }
  </style>
`;

function renderProducts(products) {
  if (!products || products.length === 0) {
    return '<div class="no-results">No products found.</div>';
  }
  return '<div class="products">' + products.map((p) => `
    <div class="product-card">
      <h3>${p.name}</h3>
      <div class="desc">${p.description || ""}</div>
      <div class="price">$${p.price}</div>
      <div class="cat">${p.category || ""}</div>
    </div>
  `).join("") + "</div>";
}

app.get("/", async (req, res) => {
  const search = req.query.q || "";
  let html = `<!DOCTYPE html><html><head><title>ByteMart</title>${PAGE_STYLE}</head><body>
    <div class="header">
      <div><h1>ByteMart</h1><span class="tagline">Electronics for the future</span></div>
    </div>
    <div class="main">
      <div class="search-box">
        <form method="GET" action="/">
          <input type="text" name="q" placeholder="Search products..." value="${search}">
          <button type="submit">Search</button>
        </form>
      </div>`;

  if (search) {
    try {
      // VULNERABLE: User input concatenated directly into SQL query
      const query = `SELECT name, description, price, category FROM products WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`;
      const [rows] = await pool.query(query);
      html += renderProducts(rows);
    } catch (err) {
      html += `<div class="error">Search error: ${err.message}</div>`;
    }
  } else {
    try {
      const [rows] = await pool.query(
        "SELECT name, description, price, category FROM products"
      );
      html += renderProducts(rows);
    } catch {
      html += '<div class="no-results">Unable to load products.</div>';
    }
  }

  html += "</div></body></html>";
  res.send(html);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
