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
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.4); }
    h1 { color: #60a5fa; font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #94a3b8; font-size: 0.875rem; margin-bottom: 2rem; }
    label { display: block; color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.375rem; }
    input[type="text"], input[type="password"] { width: 100%; padding: 0.625rem 0.875rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; font-size: 0.9rem; margin-bottom: 1rem; }
    input:focus { outline: none; border-color: #60a5fa; }
    button { width: 100%; padding: 0.625rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
    button:hover { background: #2563eb; }
    .error { background: #7f1d1d; border: 1px solid #991b1b; color: #fca5a5; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; }
    .flag-box { background: #064e3b; border: 1px solid #065f46; color: #6ee7b7; padding: 1rem; border-radius: 8px; margin-top: 1.5rem; font-family: monospace; word-break: break-all; }
    .welcome { color: #34d399; font-size: 1.1rem; margin-bottom: 0.5rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Nexus Corp Portal</title>${PAGE_STYLE}</head><body>
    <div class="container">
      <h1>Nexus Corp</h1>
      <p class="subtitle">Employee Portal &mdash; Authorized Access Only</p>
      <form method="POST" action="/login">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Enter username" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter password" required>
        <button type="submit">Sign In</button>
      </form>
    </div>
  </body></html>`);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const [rows] = await pool.query(query);

    if (rows.length > 0) {
      const user = rows[0];
      res.send(`<!DOCTYPE html><html><head><title>Dashboard - Nexus Corp</title>${PAGE_STYLE}</head><body>
        <div class="container">
          <h1>Nexus Corp</h1>
          <p class="welcome">Welcome back, ${user.username}!</p>
          <p class="subtitle">Role: ${user.role}</p>
          <div class="flag-box">&#127937; ${FLAG}</div>
        </div>
      </body></html>`);
    } else {
      res.send(`<!DOCTYPE html><html><head><title>Login Failed - Nexus Corp</title>${PAGE_STYLE}</head><body>
        <div class="container">
          <h1>Nexus Corp</h1>
          <p class="subtitle">Employee Portal</p>
          <div class="error">Invalid username or password.</div>
          <form method="POST" action="/login">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Enter username" required>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter password" required>
            <button type="submit">Sign In</button>
          </form>
        </div>
      </body></html>`);
    }
  } catch (err) {
    res.status(500).send(`<!DOCTYPE html><html><head><title>Error - Nexus Corp</title>${PAGE_STYLE}</head><body>
      <div class="container">
        <h1>Nexus Corp</h1>
        <div class="error">A database error occurred. Please try again.</div>
        <a href="/" style="color:#60a5fa;">Back to login</a>
      </div>
    </body></html>`);
  }
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
