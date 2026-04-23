import { Pool } from "pg"
import { randomUUID } from "crypto"

type SortSpec = Record<string, 1 | -1>
type Projection = Record<string, 0 | 1>

type Query =
  | Record<string, any>
  | { $or: Query[] }

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof RegExp) && !(v instanceof Date)
}

function getValuesAtPath(obj: any, path: string): any[] {
  const parts = path.split(".")
  let current: any[] = [obj]

  for (const part of parts) {
    const next: any[] = []
    for (const c of current) {
      if (c == null) continue
      const v = (c as any)[part]
      if (Array.isArray(v)) next.push(...v)
      else next.push(v)
    }
    current = next
  }

  return current
}

function matchValue(v: any, cond: any): boolean {
  if (isPlainObject(cond)) {
    if ("$ne" in cond) return v !== cond.$ne
    if ("$in" in cond) {
      const arr: any[] = Array.isArray(cond.$in) ? cond.$in : []
      return arr.some((c) => {
        if (c instanceof RegExp) return typeof v === "string" && c.test(v)
        return v === c
      })
    }
    if ("$gte" in cond || "$lte" in cond) {
      const dv = v instanceof Date ? v.getTime() : new Date(v).getTime()
      if ("$gte" in cond) {
        const t = cond.$gte instanceof Date ? cond.$gte.getTime() : new Date(cond.$gte).getTime()
        if (!(dv >= t)) return false
      }
      if ("$lte" in cond) {
        const t = cond.$lte instanceof Date ? cond.$lte.getTime() : new Date(cond.$lte).getTime()
        if (!(dv <= t)) return false
      }
      return true
    }
    return false
  }

  if (cond instanceof RegExp) return typeof v === "string" && cond.test(v)
  return v === cond
}

function matchDoc(doc: any, query: Query): boolean {
  if (!query || Object.keys(query).length === 0) return true

  if ("$or" in (query as any)) {
    const ors = (query as any).$or
    if (!Array.isArray(ors) || ors.length === 0) return true
    return ors.some((q: any) => matchDoc(doc, q))
  }

  for (const [key, cond] of Object.entries(query)) {
    if (key === "$or") continue

    const values = getValuesAtPath(doc, key)
    const ok = values.some((v) => matchValue(v, cond))
    if (!ok) return false
  }

  return true
}

function applyProjection(doc: any, projection?: Projection) {
  if (!projection) return doc
  const includeKeys = Object.entries(projection).filter(([, v]) => v === 1).map(([k]) => k)
  const excludeKeys = Object.entries(projection).filter(([, v]) => v === 0).map(([k]) => k)

  if (includeKeys.length > 0) {
    const out: any = {}
    for (const k of includeKeys) out[k] = (doc as any)[k]
    return out
  }
  if (excludeKeys.length > 0) {
    const out: any = { ...doc }
    for (const k of excludeKeys) delete out[k]
    return out
  }
  return doc
}

function sortDocs(docs: any[], sort?: SortSpec) {
  if (!sort) return docs
  const keys = Object.keys(sort)
  if (keys.length === 0) return docs

  return [...docs].sort((a, b) => {
    for (const k of keys) {
      const dir = sort[k] ?? 1
      const av = (a as any)[k]
      const bv = (b as any)[k]
      if (av === bv) continue
      if (av == null) return 1
      if (bv == null) return -1
      if (av > bv) return dir
      if (av < bv) return -dir
    }
    return 0
  })
}

class QueryChain<T = any> {
  private _projection?: Projection
  private _sort?: SortSpec
  private _limit?: number
  private _skip?: number
  private _populate?: { path: string; select?: string }[]

  constructor(private getDocs: () => Promise<any[]>) {}

  populate(path: string, select?: string) {
    this._populate = this._populate || []
    this._populate.push({ path, select })
    return this
  }

  sort(sort: SortSpec) {
    this._sort = sort
    return this
  }

  limit(n: number) {
    this._limit = n
    return this
  }

  skip(n: number) {
    this._skip = n
    return this
  }

  select(spec: string | Projection) {
    if (typeof spec === "string") {
      const parts = spec.split(/\s+/).filter(Boolean)
      const p: Projection = {}
      for (const part of parts) {
        if (part.startsWith("-")) p[part.slice(1)] = 0
        else p[part] = 1
      }
      this._projection = p
    } else {
      this._projection = spec
    }
    return this
  }

  lean() {
    return this.exec()
  }

  async exec(): Promise<T[]> {
    let docs = await this.getDocs()
    docs = sortDocs(docs, this._sort)
    if (typeof this._skip === "number") docs = docs.slice(this._skip)
    if (typeof this._limit === "number") docs = docs.slice(0, this._limit)
    if (this._projection) docs = docs.map((d) => applyProjection(d, this._projection))
    return docs
  }
}

export class PgDocStore {
  private pool: Pool

  constructor(connectionString: string) {
    // Forcefully rewrite localhost to 127.0.0.1 to avoid Node.js ipv6 resolution block on cPanel
    const sanitizedUrl = connectionString.replace('localhost', '127.0.0.1');

    this.pool = new Pool({ 
      connectionString: sanitizedUrl
    })
    
    // Initialize standard docs table schema asynchronously
    this.pool.query(`
      CREATE TABLE IF NOT EXISTS docs (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        doc TEXT NOT NULL,
        "createdAt" TEXT NOT NULL,
        "updatedAt" TEXT NOT NULL,
        PRIMARY KEY (collection, id)
      );
      CREATE INDEX IF NOT EXISTS idx_docs_collection ON docs(collection);
    `).catch(console.error)
  }

  collection(name: string) {
    return new Collection(name, this.pool)
  }
}

class Collection<T extends Record<string, any> = any> {
  constructor(private name: string, private pool: Pool) {}

  private wrap(doc: any) {
    const self = this
    const d: any = { ...doc }
    d.toObject = () => ({ ...doc })
    d.save = async () => {
      const plain: any = { ...d }
      delete plain.toObject
      delete plain.save
      await self.replace(plain._id, plain)
      return self.wrap(plain)
    }
    d.session = () => d
    return d
  }
  
  private _chainable<R>(p: Promise<R>): Promise<R> & { lean: () => any, populate: () => any, exec: () => any, select: () => any } {
    const anyP = p as any;
    anyP.lean = () => anyP;
    anyP.populate = () => anyP;
    anyP.exec = () => anyP;
    anyP.select = () => anyP;
    return anyP;
  }

  find(query: Query = {}, projection?: Projection) {
    return new QueryChain<T>(async () => {
      const res = await this.pool.query("SELECT id, doc FROM docs WHERE collection = $1", [this.name])
      const docs = res.rows.map((r) => {
        const parsed = JSON.parse(r.doc)
        return { ...parsed, _id: r.id }
      })
      const filtered = docs.filter((d) => matchDoc(d, query))
      return projection ? filtered.map((d) => applyProjection(d, projection)) : filtered
    })
  }

  findOne(query: Query = {}, projection?: Projection): Promise<T | null> & { lean: () => any, populate: () => any, exec: () => any, select: () => any } {
    return this._chainable((async () => {
      const docs = await this.find(query, projection).limit(1).exec()
      const d = (docs[0] as any) ?? null
      return d ? this.wrap(d) : null
    })());
  }

  findById(id: string, projection?: Projection): Promise<T | null> & { lean: () => any, populate: () => any, exec: () => any, select: () => any } {
    return this._chainable((async () => {
      const res = await this.pool.query("SELECT id, doc FROM docs WHERE collection = $1 AND id = $2", [this.name, id])
      if (res.rowCount === 0) return null
      const row = res.rows[0]
      const parsed = { ...JSON.parse(row.doc), _id: row.id }
      const d = (projection ? applyProjection(parsed, projection) : parsed) as any
      return this.wrap(d)
    })());
  }

  async create(doc: Partial<T>): Promise<any> {
    const id = (doc as any)._id?.toString?.() || randomUUID()
    const now = new Date().toISOString()
    const stored = { ...(doc as any), _id: id, createdAt: (doc as any).createdAt ?? now, updatedAt: now }
    
    await this.pool.query(
      `INSERT INTO docs(collection, id, doc, "createdAt", "updatedAt") 
       VALUES($1, $2, $3, $4, $5) 
       ON CONFLICT (collection, id) DO UPDATE 
       SET doc = EXCLUDED.doc, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"`,
      [this.name, id, JSON.stringify(stored), stored.createdAt, stored.updatedAt]
    )
    return this.wrap(stored)
  }

  async findByIdAndUpdate(id: string, update: any, options?: { new?: boolean }) {
    const existing = await this.findById(id)
    if (!existing) return null
    const updated = applyUpdate((existing as any).toObject?.() ?? existing, update)
    await this.replace(id, updated)
    return options?.new === false ? existing : this.wrap(updated)
  }

  async findOneAndUpdate(filter: Query, update: any, options?: { new?: boolean, upsert?: boolean }) {
    const existing = await this.findOne(filter)
    if (!existing) {
      if (options?.upsert) {
        let newDoc: any = { ...filter }
        if (update && update.$set) {
          newDoc = { ...newDoc, ...update.$set }
        } else if (update) {
          const plainUpdate = Object.entries(update).reduce((acc: any, [k, v]) => {
            if (!k.startsWith('$')) acc[k] = v
            return acc
          }, {})
          newDoc = { ...newDoc, ...plainUpdate }
        }
        return await this.create(newDoc)
      }
      return null
    }
    const updated = applyUpdate((existing as any).toObject?.() ?? existing, update)
    await this.replace((existing as any)._id, updated)
    return options?.new === false ? existing : this.wrap(updated)
  }

  async findByIdAndDelete(id: string) {
    const existing = await this.findById(id)
    if (!existing) return null
    await this.pool.query("DELETE FROM docs WHERE collection = $1 AND id = $2", [this.name, id])
    return existing
  }

  async updateOne(filter: Query, update: any) {
    const doc = await this.findOne(filter)
    if (!doc) return { matchedCount: 0, modifiedCount: 0 }
    const plain = (doc as any).toObject?.() ?? doc
    const updated = applyUpdate(plain, update)
    await this.replace((plain as any)._id, updated)
    return { matchedCount: 1, modifiedCount: 1 }
  }

  async updateMany(filter: Query, update: any) {
    const docs = await this.find(filter).exec()
    const client = await this.pool.connect()
    try {
      await client.query("BEGIN")
      for (const d of docs) {
        const updated = applyUpdate(d, update)
        const now = new Date().toISOString()
        const stored = { ...updated, _id: d._id, updatedAt: now, createdAt: d.createdAt ?? now }
        await client.query(
          `INSERT INTO docs(collection, id, doc, "createdAt", "updatedAt") 
           VALUES($1, $2, $3, $4, $5) 
           ON CONFLICT (collection, id) DO UPDATE 
           SET doc = EXCLUDED.doc, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"`,
          [this.name, d._id, JSON.stringify(stored), stored.createdAt, stored.updatedAt]
        )
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
    return { matchedCount: docs.length, modifiedCount: docs.length }
  }

  async countDocuments(filter: Query = {}) {
    const docs = await this.find(filter).exec()
    return docs.length
  }

  async deleteOne(filter: Query) {
    const doc = await this.findOne(filter)
    if (!doc) return { deletedCount: 0 }
    await this.pool.query("DELETE FROM docs WHERE collection = $1 AND id = $2", [this.name, (doc as any)._id])
    return { deletedCount: 1 }
  }

  async deleteMany(filter: Query) {
    const docs = await this.find(filter).exec()
    if (docs.length === 0) return { deletedCount: 0 }
    
    const client = await this.pool.connect()
    try {
      await client.query("BEGIN")
      for (const d of docs) {
        await client.query("DELETE FROM docs WHERE collection = $1 AND id = $2", [this.name, (d as any)._id])
      }
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
    return { deletedCount: docs.length }
  }

  private async replace(id: string, doc: any) {
    const now = new Date().toISOString()
    const stored = { ...(doc as any), _id: id, updatedAt: now, createdAt: (doc as any).createdAt ?? now }
    await this.pool.query(
      `INSERT INTO docs(collection, id, doc, "createdAt", "updatedAt") 
       VALUES($1, $2, $3, $4, $5) 
       ON CONFLICT (collection, id) DO UPDATE 
       SET doc = EXCLUDED.doc, "createdAt" = EXCLUDED."createdAt", "updatedAt" = EXCLUDED."updatedAt"`,
      [this.name, id, JSON.stringify(stored), stored.createdAt, stored.updatedAt]
    )
  }
}

function applyUpdate(doc: any, update: any) {
  if (!update || typeof update !== "object") return doc
  if ("$set" in update && isPlainObject(update.$set)) {
    return { ...doc, ...update.$set }
  }
  return { ...doc, ...update }
}
