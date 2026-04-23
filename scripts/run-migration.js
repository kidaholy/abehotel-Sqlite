const { Client } = require('pg');
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://lidiyagizaw2007:holyunion@cluster0.lhifyl9.mongodb.net/abehotel";
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error("\n❌ ERROR: DATABASE_URL environment variable is missing!");
  console.log("Please run the script providing the URL like this:");
  console.log('DATABASE_URL="postgresql://username:pass@localhost:5432/dbname" node scripts/run-migration.js\n');
  process.exit(1);
}

async function migrate() {
  console.log("🐘 Connecting to Yegara PostgreSQL...");
  const pgClient = new Client({ connectionString: PG_URL });
  await pgClient.connect();

  console.log("🍃 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  const collections = await db.collections();

  let totalDocs = 0;

  for (const col of collections) {
    const colName = col.collectionName;
    if (colName === 'system.indexes' || colName.startsWith('system.')) continue;

    console.log(`\n📦 Migrating collection: ${colName}...`);
    const docs = await col.find({}).toArray();

    for (const doc of docs) {
      if (doc._id) {
        doc._id = doc._id.toString();
      }
      
      const now = new Date().toISOString();
      const createdAt = doc.createdAt || now;
      const updatedAt = doc.updatedAt || now;

      // Make sure the document has exactly matching timestamp fields if possible
      const storedDoc = { ...doc, id: doc._id, createdAt, updatedAt };

      await pgClient.query(`
        INSERT INTO docs(collection, id, doc, "createdAt", "updatedAt") 
        VALUES($1, $2, $3, $4, $5) 
        ON CONFLICT (collection, id) DO UPDATE 
        SET doc = EXCLUDED.doc, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"
      `, [colName, doc._id, JSON.stringify(storedDoc), createdAt, updatedAt]);

      totalDocs++;
    }
    console.log(`   ✅ Inserted ${docs.length} documents into ${colName}!`);
  }

  console.log(`\n🎉 MIGRATION COMPLETE! Transferred a total of ${totalDocs} documents flawlessly!`);
  
  await pgClient.end();
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
