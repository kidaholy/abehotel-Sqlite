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

  // Forcefully remove any hidden cPanel environment variables that intercept PG host resolution
  delete process.env.PGHOST;
  delete process.env.PGPORT;
  delete process.env.PGUSER;
  delete process.env.PGPASSWORD;
  delete process.env.PGDATABASE;

  const url = new URL(PG_URL);
  
  const possibleHosts = [
    '/var/run/postgresql',
    '/var/lib/pgsql',
    '/run/postgresql',
    '/tmp',
    '127.0.0.1',
    '69.72.244.65'
  ];

  let pgClient;
  let connected = false;

  for (const host of possibleHosts) {
    console.log(`   Trying host: ${host} ...`);
    try {
      pgClient = new Client({ 
        host: host,
        port: parseInt(url.port || '5432'),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: decodeURIComponent(url.pathname.substring(1)),
        ssl: false // Server strictly forbids SSL
      });
      
      await pgClient.connect();
      console.log(`   ✅ Successfully connected via: ${host}`);
      connected = true;
      break;
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
      if (pgClient) {
        await pgClient.end().catch(() => {});
      }
    }
  }

  if (!connected) {
    console.error("\n💥 ALL connection methods exhausted. See errors above.");
    process.exit(1);
  }

  try {
    console.log("🐘 Collection normalization starting...");

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
