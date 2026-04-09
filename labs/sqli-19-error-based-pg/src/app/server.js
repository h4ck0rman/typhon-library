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
    await pool.query("INSERT INTO admin_config (config_key, config_value) VALUES ($1, $2)", ["master_secret", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO admin_config (config_key, config_value) VALUES ($1, $2)", ["master_secret", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fafaf9; color: #1c1917; min-height: 100vh; }
    .header { background: #374151; padding: 1rem 2rem; }
    .header h1 { color: #fbbf24; font-size: 1.3rem; }
    .header .sub { color: #9ca3af; font-size: 0.75rem; }
    .main { max-width: 700px; margin: 2rem auto; padding: 0 1rem; }
    .lookup { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .lookup h2 { color: #374151; font-size: 1rem; margin-bottom: 0.75rem; }
    .lookup form { display: flex; gap: 0.5rem; }
    .lookup input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; }
    .lookup button { padding: 0.5rem 1rem; background: #374151; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .item { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; }
    .item h3 { color: #374151; margin-bottom: 0.5rem; }
    .item .field { display: flex; margin-bottom: 0.35rem; }
    .item .label { color: #6b7280; font-size: 0.8rem; width: 100px; }
    .item .value { font-size: 0.9rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; word-break: break-all; }
    .not-found { color: #6b7280; text-align: center; padding: 2rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>PartsBin</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>PartsBin</h1><span class="sub">Warehouse Inventory System</span></div>
    <div class="main">
      <div class="lookup">
        <h2>Item Lookup</h2>
        <form method="GET" action="/item">
          <input name="id" placeholder="Item ID (e.g. 1)">
          <button type="submit">Search</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.get("/item", async (req, res) => {
  const id = req.query.id || "";
  if (!id) return res.redirect("/");

  let resultHtml = "";

  // Simple keyword filter blocks UNION but not error-based
  if (id.toLowerCase().includes("union")) {
    resultHtml = '<div class="error">Blocked: prohibited keyword.</div>';
  } else {
    try {
      // VULNERABLE: User input concatenated directly into SQL query
      const query = `SELECT part_number, description, quantity, location FROM warehouse_items WHERE id=${id}`;
      const result = await pool.query(query);

      if (result.rows.length > 0) {
        const item = result.rows[0];
        resultHtml = `<div class="item">
          <h3>${item.part_number}</h3>
          <div class="field"><span class="label">Description</span><span class="value">${item.description}</span></div>
          <div class="field"><span class="label">Quantity</span><span class="value">${item.quantity}</span></div>
          <div class="field"><span class="label">Location</span><span class="value">${item.location}</span></div>
        </div>`;
      } else {
        resultHtml = '<div class="not-found">Item not found.</div>';
      }
    } catch (err) {
      // VULNERABLE: Full error message exposed to user
      resultHtml = `<div class="error">Database error:\n${err.message}</div>`;
    }
  }

  res.send(`<!DOCTYPE html><html><head><title>Item Lookup - PartsBin</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>PartsBin</h1><span class="sub">Warehouse Inventory System</span></div>
    <div class="main">
      <div class="lookup">
        <h2>Item Lookup</h2>
        <form method="GET" action="/item">
          <input name="id" placeholder="Item ID" value="${id}">
          <button type="submit">Search</button>
        </form>
      </div>
      ${resultHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
