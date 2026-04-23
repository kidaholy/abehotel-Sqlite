import { PgDocStore } from "./pg"

declare global {
  // eslint-disable-next-line no-var
  var __abehotel_pg_store: PgDocStore | undefined
}

function getConnectionString() {
  const fromEnv = process.env.DATABASE_URL
  // Local default for testing or local development
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()
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
