const { Client } = require('pg');

const PG_URL = process.env.DATABASE_URL;

const MAPPING = {
  'users': 'User',
  'rooms': 'Room',
  'settings': 'Settings',
  'menuitems': 'MenuItem',
  'categories': 'Category',
  'orders': 'Order',
  'floors': 'Floor',
  'stocks': 'Stock',
  'storelogs': 'StoreLog',
  'tables': 'Table',
  'receptionrequests': 'ReceptionRequest',
  'fixedassets': 'FixedAsset',
  'transferrequests': 'TransferRequest',
  'vip1menuitems': 'Vip1MenuItem',
  'vip2menuitems': 'Vip2MenuItem',
  'dailyexpenses': 'DailyExpense',
  'operationalexpenses': 'OperationalExpense',
  'audit_logs': 'AuditLog',
  'services': 'Service',
  'batches': 'Batch'
};

async function normalize() {
  if (!PG_URL) {
    console.error("❌ DATABASE_URL missing");
    process.exit(1);
  }

  const pgClient = new Client({ 
    connectionString: PG_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pgClient.connect();
    console.log("🐘 Connected to PostgreSQL. Normalizing collection names...");

    for (const [oldName, newName] of Object.entries(MAPPING)) {
      const res = await pgClient.query(
        "UPDATE docs SET collection = $1 WHERE collection = $2",
        [newName, oldName]
      );
      if (res.rowCount > 0) {
        console.log(`✅ Normalized: ${oldName} -> ${newName} (${res.rowCount} records)`);
      }
    }

    console.log("\n🎉 Normalization complete! Your data is now perfectly aligned with the code.");
  } catch (err) {
    console.error("❌ Normalization failed:", err);
  } finally {
    await pgClient.end();
  }
}

normalize();
