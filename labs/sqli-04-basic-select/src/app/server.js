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
    await pool.query("INSERT INTO admin_notes (note) VALUES (?)", [FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO admin_notes (note) VALUES (?)", [FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #fafaf9; color: #1c1917; min-height: 100vh; }
    .header { background: #1c1917; padding: 1rem 2rem; }
    .header h1 { color: #fbbf24; font-size: 1.5rem; letter-spacing: -0.5px; }
    .header .tagline { color: #a8a29e; font-size: 0.75rem; }
    .main { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    .article-list { list-style: none; }
    .article-list li { border-bottom: 1px solid #e7e5e4; padding: 1.25rem 0; }
    .article-list a { color: #1c1917; text-decoration: none; font-size: 1.15rem; font-weight: 600; }
    .article-list a:hover { color: #b45309; }
    .article-list .meta { color: #78716c; font-size: 0.8rem; margin-top: 0.25rem; }
    .article { background: white; border: 1px solid #e7e5e4; border-radius: 8px; padding: 2rem; }
    .article h2 { font-size: 1.6rem; margin-bottom: 0.5rem; }
    .article .byline { color: #78716c; font-size: 0.85rem; margin-bottom: 1.5rem; }
    .article .body { line-height: 1.7; color: #44403c; }
    .back { display: inline-block; color: #b45309; text-decoration: none; margin-bottom: 1.5rem; font-size: 0.9rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 1rem; border-radius: 6px; }
  </style>
`;

app.get("/", async (req, res) => {
  let articlesHtml = "";
  try {
    const [rows] = await pool.query("SELECT id, title, author FROM articles ORDER BY id DESC");
    articlesHtml = '<ul class="article-list">' + rows.map((r) =>
      `<li><a href="/article?id=${r.id}">${r.title}</a><div class="meta">By ${r.author}</div></li>`
    ).join("") + "</ul>";
  } catch {
    articlesHtml = '<p>Unable to load articles.</p>';
  }

  res.send(`<!DOCTYPE html><html><head><title>PulseWire News</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>PulseWire News</h1><span class="tagline">Breaking stories, delivered fast</span></div>
    <div class="main">${articlesHtml}</div>
  </body></html>`);
});

app.get("/article", async (req, res) => {
  const id = req.query.id || "";
  if (!id) return res.redirect("/");

  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT title, content, author FROM articles WHERE id=${id}`;
    const [rows] = await pool.query(query);

    if (rows.length > 0) {
      const a = rows[0];
      res.send(`<!DOCTYPE html><html><head><title>${a.title} - PulseWire</title>${PAGE_STYLE}</head><body>
        <div class="header"><h1>PulseWire News</h1><span class="tagline">Breaking stories, delivered fast</span></div>
        <div class="main">
          <a class="back" href="/">&larr; Back to headlines</a>
          <div class="article">
            <h2>${a.title}</h2>
            <div class="byline">By ${a.author}</div>
            <div class="body">${a.content}</div>
          </div>
        </div>
      </body></html>`);
    } else {
      res.send(`<!DOCTYPE html><html><head><title>Not Found - PulseWire</title>${PAGE_STYLE}</head><body>
        <div class="header"><h1>PulseWire News</h1></div>
        <div class="main"><a class="back" href="/">&larr; Back</a><div class="error">Article not found.</div></div>
      </body></html>`);
    }
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><title>Error - PulseWire</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>PulseWire News</h1></div>
      <div class="main"><a class="back" href="/">&larr; Back</a><div class="error">Database error: ${err.message}</div></div>
    </body></html>`);
  }
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
