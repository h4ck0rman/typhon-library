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

  try {
    await pool.query("INSERT INTO internal_keys (key_name, key_value) VALUES (?, ?)", ["api_secret", FLAG]);
  } catch {
    await new Promise((r) => setTimeout(r, 2000));
    await pool.query("INSERT INTO internal_keys (key_name, key_value) VALUES (?, ?)", ["api_secret", FLAG]);
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #fdf2f8; color: #1f2937; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #ec4899, #f97316); padding: 1.5rem 2rem; }
    .header h1 { color: white; font-size: 1.5rem; }
    .header .tagline { color: rgba(255,255,255,0.8); font-size: 0.8rem; }
    .main { max-width: 560px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .card h2 { color: #ec4899; font-size: 1.2rem; margin-bottom: 0.5rem; }
    .card p { color: #6b7280; font-size: 0.85rem; margin-bottom: 1.5rem; }
    label { display: block; color: #374151; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.3rem; }
    input, textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; margin-bottom: 1rem; font-family: inherit; }
    input:focus, textarea:focus { outline: none; border-color: #ec4899; }
    textarea { min-height: 100px; resize: vertical; }
    button { width: 100%; padding: 0.65rem; background: #ec4899; color: white; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
    button:hover { background: #db2777; }
    .success { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .feedback-display { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-top: 1rem; }
    .feedback-display .label { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; }
    .feedback-display .value { color: #1f2937; margin-bottom: 0.75rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 1rem; border-radius: 6px; font-size: 0.85rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>GlowBox Feedback</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>GlowBox</h1><span class="tagline">Monthly curated subscription boxes</span></div>
    <div class="main">
      <div class="card">
        <h2>Share Your Feedback</h2>
        <p>We'd love to hear about your latest box! Your feedback helps us curate better experiences.</p>
        <form method="POST" action="/submit">
          <label for="name">Your Name</label>
          <input type="text" id="name" name="name" placeholder="Jane Doe" required>
          <label for="email">Email Address</label>
          <input type="text" id="email" name="email" placeholder="jane@example.com" required>
          <label for="message">Your Feedback</label>
          <textarea id="message" name="message" placeholder="Tell us what you think..." required></textarea>
          <button type="submit">Submit Feedback</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.post("/submit", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // VULNERABLE: User input concatenated directly into INSERT statement
    const query = `INSERT INTO feedback (name, email, message) VALUES ('${name}', '${email}', '${message}')`;
    await pool.query(query);

    // Fetch the just-inserted feedback to display back
    const [rows] = await pool.query("SELECT name, email, message FROM feedback ORDER BY id DESC LIMIT 1");
    const fb = rows[0];

    res.send(`<!DOCTYPE html><html><head><title>Thank You - GlowBox</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>GlowBox</h1><span class="tagline">Monthly curated subscription boxes</span></div>
      <div class="main">
        <div class="card">
          <div class="success">Thank you for your feedback!</div>
          <h2>Your Submission</h2>
          <div class="feedback-display">
            <div class="label">Name</div>
            <div class="value">${fb.name}</div>
            <div class="label">Email</div>
            <div class="value">${fb.email}</div>
            <div class="label">Message</div>
            <div class="value">${fb.message}</div>
          </div>
        </div>
      </div>
    </body></html>`);
  } catch (err) {
    res.send(`<!DOCTYPE html><html><head><title>Error - GlowBox</title>${PAGE_STYLE}</head><body>
      <div class="header"><h1>GlowBox</h1></div>
      <div class="main">
        <div class="card">
          <div class="error">Something went wrong: ${err.message}</div>
          <br><a href="/" style="color:#ec4899;">Try again</a>
        </div>
      </div>
    </body></html>`);
  }
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
