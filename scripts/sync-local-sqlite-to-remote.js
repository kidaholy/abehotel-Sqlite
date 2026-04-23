const Database = require('better-sqlite3');
const { Client } = require('pg');

const SQLite_PATH = 'data/abehotel.sqlite';
const PG_URL = 'postgresql://abehotwe_abehotel:Holy123union@127.0.0.1:5432/abehotwe_abehotel_db'; // This script should be run on the server if possible, or we need to use a remote connection.

// Since we want to run this LOCALLY to push to REMOTE:
// We need the remote connection string. 
// However, the user is on Windows and Yegara might reject remote connections.
// But we can try!

async function migrate() {
  console.log("📂 Opening Local SQLite...");
  const db = new Database(SQLite_PATH);
  
  console.log("🐘 Connecting to Yegara PostgreSQL (Remote)...");
  // We use the public IP or a remote-access enabled URL if available.
  // Given the previous 401/404 errors, let's assume we can try to connect to the public IP.
  const pgClient = new Client({
    connectionString: "postgresql://abehotwe_abehotel:Holy123union@69.72.244.65:5432/abehotwe_abehotel_db",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log("✅ Connected to Yegara!");

    const rows = db.prepare("SELECT * FROM docs").all();
    console.log(`📦 Found ${rows.length} documents in SQLite. Starting upload...`);

    // Clear the destination first to ensure we have the LATEST data only
    console.log("🧹 Clearing old data from Yegara docs table...");
    await pgClient.query("DELETE FROM docs");

    for (const row of rows) {
      await pgClient.query(`
        INSERT INTO docs(collection, id, doc, "createdAt", "updatedAt")
        VALUES($1, $2, $3, $4, $5)
      `, [row.collection, row.id, row.doc, row.createdAt, row.updatedAt]);
    }

    console.log(`\n🎉 SUCCESS! ${rows.length} documents successfully synchronised from your local machine to Yegara!`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    console.log("\nTIP: If it says 'ECONNREFUSED' or 'Timeout', Yegara's firewall is blocking outside connections.");
    console.log("In that case, we will need to upload the SQLite file to cPanel and run the migration there!");
  } finally {
    db.close();
    await pgClient.end();
  }
}

migrate();
