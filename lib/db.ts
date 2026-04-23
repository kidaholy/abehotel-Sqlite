import { PgDocStore } from "./pg"

declare global {
  // eslint-disable-next-line no-var
  var __abehotel_pg_store: PgDocStore | undefined
}

function getConnectionString() {
  const fromEnv = process.env.DATABASE_URL
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()
  
  // High-reliability production fallback for Yegara
  if (process.env.NODE_ENV === 'production') {
    return "postgresql://abehotwe_abehotel:Holy123union@127.0.0.1:5432/abehotwe_abehotel_db"
  }
  
  return "postgresql://postgres:postgres@localhost:5432/abehotel"
}

export async function connectDB() {
  if (!global.__abehotel_pg_store) {
    const connStr = getConnectionString()
    global.__abehotel_pg_store = new PgDocStore(connStr)
  }
  return global.__abehotel_pg_store
}

export async function getStore() {
  return (await connectDB()) as PgDocStore
}

export function getStoreSync() {
  if (!global.__abehotel_pg_store) {
    const connStr = getConnectionString()
    global.__abehotel_pg_store = new PgDocStore(connStr)
  }
  return global.__abehotel_pg_store
}
