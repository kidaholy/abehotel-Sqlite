import { PgDocStore } from "./pg"

declare global {
  // eslint-disable-next-line no-var
  var __abehotel_pg_store: PgDocStore | undefined
}

function getConnectionString() {
  const fromEnv = process.env.DATABASE_URL
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()

  // Build from standard PG* variables when DATABASE_URL is not set.
  const host = process.env.PGHOST
  const port = process.env.PGPORT || "5432"
  const user = process.env.PGUSER
  const password = process.env.PGPASSWORD
  const database = process.env.PGDATABASE
  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
  }

  // In production, fail fast to avoid silently reading the wrong database.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing PostgreSQL configuration. Set DATABASE_URL (or PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE).")
  }

  return "postgresql://postgres:postgres@127.0.0.1:5432/abehotel"
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
