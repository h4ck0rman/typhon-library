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
    await pool.query("INSERT INTO credentials (username, secret) VALUES (?, ?)", ["admin", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO credentials (username, secret) VALUES (?, ?)", ["admin", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Palatino', 'Georgia', serif; background: #1a1a2e; color: #e0def4; min-height: 100vh; }
    .header { background: #16213e; border-bottom: 1px solid #0f3460; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { color: #e94560; font-size: 1.4rem; }
    .header .tagline { color: #7f8c8d; font-size: 0.8rem; }
    .main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .search-box { background: #16213e; border: 1px solid #0f3460; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; }
    .search-box form { display: flex; gap: 0.75rem; }
    .search-box input { flex: 1; padding: 0.6rem 1rem; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 6px; color: #e0def4; font-size: 0.9rem; }
    .search-box input:focus { outline: none; border-color: #e94560; }
    .search-box button { padding: 0.6rem 1.5rem; background: #e94560; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .books { display: grid; gap: 1rem; }
    .book { background: #16213e; border: 1px solid #0f3460; border-radius: 8px; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; }
    .book h3 { color: #e94560; font-size: 1rem; }
    .book .author { color: #7f8c8d; font-size: 0.85rem; }
    .book .genre { color: #533483; font-size: 0.75rem; text-transform: uppercase; }
    .book .price { color: #48c9b0; font-weight: 600; font-size: 1.1rem; }
    .no-results { color: #7f8c8d; text-align: center; padding: 3rem; }
    .error { background: #2c0b0e; border: 1px solid #e94560; color: #f8b4b4; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.85rem; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
  </style>
`;

function renderBooks(books) {
  if (!books || books.length === 0) return '<div class="no-results">No books found.</div>';
  return '<div class="books">' + books.map((b) => `
    <div class="book">
      <div>
        <h3>${b.title}</h3>
        <div class="author">${b.author}</div>
        <div class="genre">${b.genre}</div>
      </div>
      <div class="price">$${b.price}</div>
    </div>
  `).join("") + "</div>";
}

app.get("/", async (req, res) => {
  const q = req.query.q || "";
  let contentHtml = "";

  if (q) {
    // Simple keyword filter blocks UNION but allows error-based techniques
    if (q.toLowerCase().includes("union")) {
      contentHtml = '<div class="error">Blocked: prohibited keyword detected.</div>';
    } else {
      try {
        // VULNERABLE: User input concatenated directly into SQL query
        const query = `SELECT title, author, genre, price FROM books WHERE title LIKE '%${q}%' OR author LIKE '%${q}%'`;
        const [rows] = await pool.query(query);
        contentHtml = renderBooks(rows);
      } catch (err) {
        // VULNERABLE: Full error message exposed to user
        contentHtml = `<div class="error">Database error:\n${err.message}</div>`;
      }
    }
  } else {
    try {
      const [rows] = await pool.query("SELECT title, author, genre, price FROM books ORDER BY id");
      contentHtml = renderBooks(rows);
    } catch {
      contentHtml = '<div class="no-results">Unable to load catalog.</div>';
    }
  }

  res.send(`<!DOCTYPE html><html><head><title>PageTurn Books</title>${PAGE_STYLE}</head><body>
    <div class="header"><div><h1>PageTurn Books</h1><span class="tagline">Curated reads for curious minds</span></div></div>
    <div class="main">
      <div class="search-box">
        <form method="GET" action="/"><input type="text" name="q" placeholder="Search books..." value="${q}"><button type="submit">Search</button></form>
      </div>
      ${contentHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
