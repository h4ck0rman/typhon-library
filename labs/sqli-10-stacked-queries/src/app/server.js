const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "typhon-lab-secret", resave: false, saveUninitialized: false }));

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
    await pool.query("INSERT INTO system_secrets (key_name, key_value) VALUES ($1, $2)", ["flag", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO system_secrets (key_name, key_value) VALUES ($1, $2)", ["flag", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #111827; color: #e5e7eb; min-height: 100vh; }
    .header { background: #1f2937; border-bottom: 1px solid #374151; padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { color: #10b981; font-size: 1.2rem; }
    .header .nav a { color: #9ca3af; text-decoration: none; font-size: 0.85rem; margin-left: 1rem; }
    .header .nav a:hover { color: #e5e7eb; }
    .main { max-width: 750px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { color: #10b981; font-size: 1.1rem; margin-bottom: 1rem; }
    .search-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .search-form input { flex: 1; padding: 0.5rem 0.75rem; background: #111827; border: 1px solid #374151; border-radius: 6px; color: #e5e7eb; font-size: 0.85rem; }
    .search-form button { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .task { border-bottom: 1px solid #374151; padding: 0.75rem 0; }
    .task:last-child { border: none; }
    .task h3 { font-size: 0.95rem; color: #e5e7eb; }
    .task .meta { color: #6b7280; font-size: 0.8rem; margin-top: 0.25rem; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .badge.open { background: #1e3a5f; color: #7dd3fc; }
    .badge.in-progress { background: #3d2e00; color: #fbbf24; }
    .badge.done { background: #052e16; color: #6ee7b7; }
    label { display: block; color: #9ca3af; font-size: 0.85rem; margin-bottom: 0.3rem; }
    input { width: 100%; padding: 0.5rem 0.75rem; background: #111827; border: 1px solid #374151; border-radius: 6px; color: #e5e7eb; font-size: 0.85rem; margin-bottom: 0.75rem; }
    button { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .error { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem; }
    .flag-box { background: #064e3b; border: 1px solid #065f46; color: #6ee7b7; padding: 1rem; border-radius: 8px; font-family: monospace; word-break: break-all; }
    .role-badge { color: #10b981; font-size: 0.8rem; }
  </style>
`;

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.send(`<!DOCTYPE html><html><head><title>TaskForge</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>TaskForge</h1></div>
    <div class="main"><div class="card"><h2>Sign In</h2>
      <form method="POST" action="/login">
        <label>Username</label><input name="username" value="guest">
        <label>Password</label><input type="password" name="password" value="guest">
        <button type="submit">Login</button>
      </form>
    </div></div>
  </body></html>`);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE username=$1 AND password=$2", [username, password]);
    if (rows.length > 0) {
      req.session.user = rows[0];
      return res.redirect("/dashboard");
    }
  } catch {}
  res.send(`<!DOCTYPE html><html><head><title>Login Failed</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>TaskForge</h1></div>
    <div class="main"><div class="card"><div class="error">Invalid credentials.</div><a href="/"><button>Try Again</button></a></div></div>
  </body></html>`);
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.user) return res.redirect("/");

  // Re-fetch user to get updated role
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [req.session.user.id]);
    if (rows.length > 0) req.session.user = rows[0];
  } catch {}

  const user = req.session.user;
  const search = req.query.q || "";

  let tasksHtml = "";
  try {
    let result;
    if (search) {
      // VULNERABLE: User input concatenated directly into SQL query - allows stacked queries
      const query = `SELECT title, description, status, assigned_to FROM tasks WHERE title ILIKE '%${search}%' OR description ILIKE '%${search}%'`;
      result = await pool.query(query);
    } else {
      result = await pool.query("SELECT title, description, status, assigned_to FROM tasks ORDER BY id");
    }
    tasksHtml = result.rows.map((t) => `
      <div class="task">
        <h3>${t.title} <span class="badge ${t.status}">${t.status}</span></h3>
        <div class="meta">${t.description || ""} &mdash; Assigned: ${t.assigned_to}</div>
      </div>`).join("");
    if (!tasksHtml) tasksHtml = '<div class="task"><div class="meta">No tasks found.</div></div>';
  } catch (err) {
    tasksHtml = `<div class="error">${err.message}</div>`;
  }

  let secretsHtml = "";
  if (user.role === "admin") {
    try {
      const { rows } = await pool.query("SELECT key_name, key_value FROM system_secrets");
      secretsHtml = `<div class="card"><h2>System Secrets (Admin Only)</h2>` +
        rows.map((s) => `<div class="flag-box">${s.key_name}: ${s.key_value}</div>`).join("") +
        `</div>`;
    } catch {}
  }

  res.send(`<!DOCTYPE html><html><head><title>Dashboard - TaskForge</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>TaskForge</h1><div class="nav"><span class="role-badge">${user.username} (${user.role})</span><a href="/logout">Logout</a></div></div>
    <div class="main">
      <div class="card">
        <h2>Tasks</h2>
        <form class="search-form" method="GET" action="/dashboard">
          <input name="q" placeholder="Search tasks..." value="${search}">
          <button type="submit">Search</button>
        </form>
        ${tasksHtml}
      </div>
      ${secretsHtml}
    </div>
  </body></html>`);
});

app.get("/logout", (req, res) => { req.session.destroy(); res.redirect("/"); });

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
