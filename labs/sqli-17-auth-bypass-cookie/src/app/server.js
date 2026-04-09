const express = require("express");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

  // Seed admin's inbox with the flag
  try {
    await pool.query(
      "INSERT INTO mailbox (user_id, sender, subject, body) VALUES (1, ?, ?, ?)",
      ["security@sparkmail.io", "CONFIDENTIAL: System Credentials", `Access key: ${FLAG}`]
    );
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query(
      "INSERT INTO mailbox (user_id, sender, subject, body) VALUES (1, ?, ?, ?)",
      ["security@sparkmail.io", "CONFIDENTIAL: System Credentials", `Access key: ${FLAG}`]
    );
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fafafa; color: #1a1a1a; min-height: 100vh; }
    .header { background: #4f46e5; padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { color: white; font-size: 1.2rem; }
    .header a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.85rem; }
    .main { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border: 1px solid #e5e5e5; border-radius: 10px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card h2 { color: #4f46e5; font-size: 1.1rem; margin-bottom: 0.75rem; }
    label { display: block; color: #525252; font-size: 0.85rem; margin-bottom: 0.3rem; }
    input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d4d4d4; border-radius: 6px; font-size: 0.9rem; margin-bottom: 0.75rem; }
    button { width: 100%; padding: 0.6rem; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .email { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
    .email .from { color: #737373; font-size: 0.8rem; }
    .email .subject { font-weight: 600; margin: 0.25rem 0; }
    .email .body { color: #525252; font-size: 0.9rem; margin-top: 0.5rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem; }
  </style>
`;

// Middleware to check for remember_token cookie
async function checkRememberToken(req, res, next) {
  const token = req.cookies.remember_token;
  if (token) {
    try {
      // VULNERABLE: Cookie value concatenated directly into SQL query
      const query = `SELECT s.user_id, u.username, u.role FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token='${token}'`;
      const [rows] = await pool.query(query);
      if (rows.length > 0) {
        req.user = rows[0];
      }
    } catch {
      // Suppress errors
    }
  }
  next();
}

app.use(checkRememberToken);

app.get("/", (req, res) => {
  if (req.user) return res.redirect("/inbox");
  res.send(`<!DOCTYPE html><html><head><title>SparkMail</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>SparkMail</h1></div>
    <div class="main">
      <div class="card">
        <h2>Sign In</h2>
        <form method="POST" action="/login">
          <label>Username</label><input name="username" placeholder="alice">
          <label>Password</label><input type="password" name="password" placeholder="alice123">
          <button type="submit">Sign In</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Login is SAFE — uses parameterized queries
    const [rows] = await pool.query("SELECT * FROM users WHERE username=? AND password=?", [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      // Get the user's session token
      const [sessions] = await pool.query("SELECT token FROM sessions WHERE user_id=?", [user.id]);
      if (sessions.length > 0) {
        res.cookie("remember_token", sessions[0].token, { httpOnly: false });
      }
      return res.redirect("/inbox");
    }
  } catch {}
  res.send(`<!DOCTYPE html><html><head><title>Login Failed - SparkMail</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>SparkMail</h1></div>
    <div class="main"><div class="card"><div class="error">Invalid credentials.</div><a href="/"><button>Try Again</button></a></div></div>
  </body></html>`);
});

app.get("/inbox", async (req, res) => {
  if (!req.user) return res.redirect("/");

  let emailsHtml = "";
  try {
    const [emails] = await pool.query("SELECT sender, subject, body FROM mailbox WHERE user_id=? ORDER BY id DESC", [req.user.user_id]);
    emailsHtml = emails.map((e) => `
      <div class="email">
        <div class="from">From: ${e.sender}</div>
        <div class="subject">${e.subject}</div>
        <div class="body">${e.body}</div>
      </div>`).join("");
    if (!emailsHtml) emailsHtml = '<p style="color:#737373;">Your inbox is empty.</p>';
  } catch {}

  res.send(`<!DOCTYPE html><html><head><title>Inbox - SparkMail</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>SparkMail</h1><a href="/logout">Logout</a></div>
    <div class="main">
      <div class="card">
        <h2>Inbox — ${req.user.username} (${req.user.role})</h2>
        ${emailsHtml}
      </div>
    </div>
  </body></html>`);
});

app.get("/logout", (req, res) => {
  res.clearCookie("remember_token");
  res.redirect("/");
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
