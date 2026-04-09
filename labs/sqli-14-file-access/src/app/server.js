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

  // Write flag to a file on the DB server using SELECT INTO OUTFILE
  try {
    await pool.query(`SELECT '${FLAG}' INTO OUTFILE '/var/flag.txt'`);
  } catch {
    // File may already exist from a previous run
  }
}

const PAGE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; }
    .header { background: #0f766e; padding: 1rem 2rem; }
    .header h1 { color: white; font-size: 1.3rem; }
    .header .sub { color: rgba(255,255,255,0.7); font-size: 0.75rem; }
    .main { max-width: 650px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .card h2 { color: #0f766e; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .card p { color: #64748b; font-size: 0.85rem; margin-bottom: 1.25rem; }
    .search-form { display: flex; gap: 0.5rem; }
    .search-form input { flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; }
    .search-form button { padding: 0.6rem 1rem; background: #0f766e; color: white; border: none; border-radius: 6px; cursor: pointer; }
    .patient { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 1.25rem; }
    .patient h3 { color: #0f766e; margin-bottom: 0.5rem; }
    .patient .field { margin-bottom: 0.5rem; }
    .patient .label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
    .patient .value { color: #0f172a; font-size: 0.9rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; font-family: monospace; white-space: pre-wrap; }
    .not-found { color: #64748b; text-align: center; padding: 2rem; }
  </style>
`;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>MedVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>MedVault</h1><span class="sub">Patient Records Portal</span></div>
    <div class="main">
      <div class="card">
        <h2>Patient Lookup</h2>
        <p>Enter a patient ID to view their record.</p>
        <form class="search-form" method="GET" action="/patient">
          <input type="text" name="id" placeholder="Patient ID (e.g. 1)">
          <button type="submit">Lookup</button>
        </form>
      </div>
    </div>
  </body></html>`);
});

app.get("/patient", async (req, res) => {
  const id = req.query.id || "";
  if (!id) return res.redirect("/");

  let resultHtml = "";

  try {
    // VULNERABLE: User input concatenated directly into SQL query
    const query = `SELECT name, dob, condition_desc, doctor FROM patients WHERE id=${id}`;
    const [rows] = await pool.query(query);

    if (rows.length > 0) {
      const p = rows[0];
      resultHtml = `<div class="patient">
        <h3>${p.name}</h3>
        <div class="field"><div class="label">Date of Birth</div><div class="value">${p.dob}</div></div>
        <div class="field"><div class="label">Condition</div><div class="value">${p.condition_desc}</div></div>
        <div class="field"><div class="label">Attending Physician</div><div class="value">${p.doctor}</div></div>
      </div>`;
    } else {
      resultHtml = '<div class="not-found">No patient found with that ID.</div>';
    }
  } catch (err) {
    resultHtml = `<div class="error">Error: ${err.message}</div>`;
  }

  res.send(`<!DOCTYPE html><html><head><title>Patient Record - MedVault</title>${PAGE_STYLE}</head><body>
    <div class="header"><h1>MedVault</h1><span class="sub">Patient Records Portal</span></div>
    <div class="main">
      <div class="card">
        <h2>Patient Lookup</h2>
        <form class="search-form" method="GET" action="/patient">
          <input type="text" name="id" placeholder="Patient ID" value="${id}">
          <button type="submit">Lookup</button>
        </form>
      </div>
      ${resultHtml}
    </div>
  </body></html>`);
});

initDb().then(() => {
  app.listen(80, () => console.log("Lab running on port 80"));
});
