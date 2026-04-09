const express = require("express");
const session = require("express-session");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "typhon-lab-secret", resave: false, saveUninitialized: false }));

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
    await pool.query("INSERT INTO vault_secrets (secret_name, secret_value) VALUES (?, ?)", ["master_key", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO vault_secrets (secret_name, secret_value) VALUES (?, ?)", ["master_key", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f9ff; color: #0f172a; min-height: 100vh; }
    .header { background: #0284c7; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { color: white; font-size: 1.3rem; }
    .header a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.85rem; margin-left: 1rem; }
    .header a:hover { color: white; }
    .main { max-width: 480px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border-radius: 10px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
    .card h2 { color: #0284c7; font-size: 1.15rem; margin-bottom: 0.5rem; }
    .card p { color: #64748b; font-size: 0.85rem; margin-bottom: 1.25rem; }
    label { display: block; color: #334155; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.3rem; }
    input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; margin-bottom: 0.9rem; }
    input:focus { outline: none; border-color: #0284c7; }
    button { width: 100%; padding: 0.6rem; background: #0284c7; color: white; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; }
    button:hover { background: #0369a1; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; }
    .success { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; }
    .flag-box { background: #064e3b; color: #6ee7b7; padding: 1rem; border-radius: 8px; font-family: monospace; margin-top: 1rem; word-break: break-all; }
    .nav { text-align: center; font-size: 0.85rem; color: #64748b; }
    .nav a { color: #0284c7; }
  </style>
`;

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.send(`<!DOCTYPE html><html><head><title>CloudVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>CloudVault</h1><div><a href="/login">Login</a><a href="/register">Register</a></div></div>
    <div class="main">
      <div class="card"><h2>Welcome to CloudVault</h2><p>Secure file hosting for teams. Log in or create an account to get started.</p>
        <a href="/login"><button>Sign In</button></a>
      </div>
    </div>
  </body></html>`);
});

app.get("/register", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Register - CloudVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>CloudVault</h1><div><a href="/login">Login</a></div></div>
    <div class="main">
      <div class="card"><h2>Create Account</h2><p>Join CloudVault today.</p>
        <form method="POST" action="/register">
          <label>Username</label><input type="text" name="username" required>
          <label>Email</label><input type="text" name="email" required>
          <label>Password</label><input type="password" name="password" required>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // SAFE: Registration uses parameterized queries
    await pool.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, password]);
    res.send(`<!DOCTYPE html><html><head><title>Registered - CloudVault</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>CloudVault</h1></div>
      <div class="main"><div class="card"><div class="success">Account created! You can now log in.</div><a href="/login"><button>Go to Login</button></a></div></div>
    </body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><title>Error - CloudVault</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>CloudVault</h1></div>
      <div class="main"><div class="card"><div class="error">Registration failed: ${err.message}</div><a href="/register"><button>Try Again</button></a></div></div>
    </body></html>`);
  }
});

app.get("/login", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Login - CloudVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>CloudVault</h1><div><a href="/register">Register</a></div></div>
    <div class="main">
      <div class="card"><h2>Sign In</h2>
        <form method="POST" action="/login">
          <label>Username</label><input type="text" name="username" required>
          <label>Password</label><input type="password" name="password" required>
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username=? AND password=?", [username, password]);
    if (rows.length > 0) {
      req.session.user = rows[0];
      return res.redirect("/dashboard");
    }
    res.send(`<!DOCTYPE html><html><head><title>Login Failed - CloudVault</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>CloudVault</h1></div>
      <div class="main"><div class="card"><div class="error">Invalid credentials.</div><a href="/login"><button>Try Again</button></a></div></div>
    </body></html>`);
  } catch {
    res.redirect("/login");
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const user = req.session.user;

  let flagHtml = "";
  if (user.role === "admin") {
    flagHtml = `<div class="flag-box">&#127937; ${FLAG}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>Dashboard - CloudVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>CloudVault</h1><div><a href="/reset">Reset Password</a><a href="/logout">Logout</a></div></div>
    <div class="main">
      <div class="card">
        <h2>Dashboard</h2>
        <p>Welcome, ${user.username}! Role: ${user.role}</p>
        ${flagHtml}
      </div>
    </div>
  </body></html>`);
});

app.get("/reset", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.send(`<!DOCTYPE html><html><head><title>Reset Password - CloudVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>CloudVault</h1><div><a href="/dashboard">Dashboard</a><a href="/logout">Logout</a></div></div>
    <div class="main">
      <div class="card"><h2>Reset Password</h2>
        <form method="POST" action="/reset">
          <label>New Password</label><input type="password" name="newPassword" required>
          <button type="submit">Update Password</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.post("/reset", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { newPassword } = req.body;
  const username = req.session.user.username;

  try {
    // VULNERABLE: Stored username from database is concatenated into UPDATE query
    // The username was safely inserted via parameterized INSERT, but is unsafely used here
    const query = `UPDATE users SET password='${newPassword}' WHERE username='${username}'`;
    await pool.query(query);

    res.send(`<!DOCTYPE html><html><head><title>Password Updated - CloudVault</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>CloudVault</h1></div>
      <div class="main"><div class="card"><div class="success">Password updated successfully.</div><a href="/dashboard"><button>Back to Dashboard</button></a></div></div>
    </body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><title>Error - CloudVault</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>CloudVault</h1></div>
      <div class="main"><div class="card"><div class="error">Reset failed: ${err.message}</div><a href="/reset"><button>Try Again</button></a></div></div>
    </body></html>`);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
