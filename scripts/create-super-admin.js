const bcrypt = require("bcryptjs")
const Database = require("better-sqlite3")
const path = require("path")
const crypto = require("crypto")

const dbPath = path.join(__dirname, "..", "data", "abehotel.sqlite")
const db = new Database(dbPath)

async function run() {
  const email = "kidayos2014@gmail.com"
  const plainPassword = "12345678"
  
  const rows = db.prepare("SELECT id, doc FROM docs WHERE collection = 'User'").all()
  let existingUser = null;
  let existingId = null;
  
  for (const row of rows) {
    const parsed = JSON.parse(row.doc)
    if (parsed.email === email) {
      existingUser = parsed;
      existingId = row.id;
      break;
    }
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  
  const id = existingId || crypto.randomUUID()
  const now = new Date().toISOString()
  
  const userData = existingUser || {
    name: "Super Admin",
    email: email,
    role: "admin",
    isActive: true
  }
  
  userData.password = hashedPassword;
  userData.plainPassword = plainPassword;
  
  const stored = { ...userData, _id: id, createdAt: userData.createdAt || now, updatedAt: now }
  
  db.prepare("INSERT OR REPLACE INTO docs(collection, id, doc, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?)")
    .run("User", id, JSON.stringify(stored), stored.createdAt, stored.updatedAt)
    
  console.log("Super admin user created/updated successfully: " + email)
}

run().catch(console.error)
