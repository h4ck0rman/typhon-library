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

  // Seed the flag into the secrets table on startup
  try {
    await pool.query(
      "INSERT INTO secrets (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
      ["flag", FLAG]
    );
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query(
      "INSERT INTO secrets (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
      ["flag", FLAG]
    );
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #030712; color: #d1d5db; min-height: 100vh; }
    .header { background: #111827; border-bottom: 1px solid #1f2937; padding: 1rem 2rem; }
    .header h1 { color: #f59e0b; font-size: 1.3rem; }
    .header .tagline { color: #6b7280; font-size: 0.8rem; }
    .main { max-width: 600px; margin: 3rem auto; padding: 0 1rem; }
    .lookup-box { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 2rem; margin-bottom: 2rem; }
    .lookup-box h2 { color: #f59e0b; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .lookup-box p { color: #6b7280; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .lookup-box form { display: flex; gap: 0.75rem; }
    .lookup-box input[type="text"] { flex: 1; padding: 0.6rem 1rem; background: #030712; border: 1px solid #374151; border-radius: 6px; color: #d1d5db; font-size: 0.9rem; }
    .lookup-box input:focus { outline: none; border-color: #f59e0b; }
    .lookup-box button { padding: 0.6rem 1.5rem; background: #d97706; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .lookup-box button:hover { background: #b45309; }
    .result { padding: 1.25rem; border-radius: 8px; text-align: center; font-size: 0.95rem; font-weight: 500; }
    .result.found { background: #052e16; border: 1px solid #065f46; color: #34d399; }
    .result.not-found { background: #1c1917; border: 1px solid #44403c; color: #a8a29e; }
    .result.error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; }
    .info { color: #4b5563; font-size: 0.8rem; text-align: center; margin-top: 2rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Vaultline Industries</title>${PAGE_STYLE}</head><body>
    <div class="header">
      <h1>Vaultline Industries</h1>
      <span class="tagline">Employee Directory System</span>
    </div>
    <div class="main">
      <div class="lookup-box">
        <h2>Employee Lookup</h2>
        <p>Enter an employee ID to check if they exist in the directory.</p>
        <form method="GET" action="/lookup">
          <input type="text" name="id" placeholder="Employee ID (e.g. 1)">
          <button type="submit">Lookup</button>
        </form>
      </div>
      <p class="info">This system returns existence status only. Contact HR for full records.</p>
    </div>
  </body></html>`);
});

app.get("/lookup", async (req, res) => {
  const id = req.query.id || "";

  if (!id) {
    return res.redirect("/");
  }

  let resultHtml = "";

  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT id FROM employees WHERE id=${id}`;
    const [rows] = await pool.query(query);

    if (rows.length > 0) {
      resultHtml = `<div class="result found">Employee #${id} &mdash; FOUND</div>`;
    } else {
      resultHtml = `<div class="result not-found">Employee #${id} &mdash; NOT FOUND</div>`;
    }
  } catch {
    // Suppress error details to prevent error-based injection
    resultHtml = `<div class="result error">Invalid query.</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>Lookup - Vaultline Industries</title>${PAGE_STYLE}</head><body>
    <div class="header">
      <h1>Vaultline Industries</h1>
      <span class="tagline">Employee Directory System</span>
    </div>
    <div class="main">
      <div class="lookup-box">
        <h2>Employee Lookup</h2>
        <p>Enter an employee ID to check if they exist in the directory.</p>
        <form method="GET" action="/lookup">
          <input type="text" name="id" placeholder="Employee ID (e.g. 1)" value="${id}">
          <button type="submit">Lookup</button>
        </form>
      </div>
      ${resultHtml}
      <p class="info">This system returns existence status only. Contact HR for full records.</p>
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
