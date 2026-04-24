import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") global.prisma = prisma

export async function connectDB() {
  return prisma
}

export async function getStore() {
  return new PrismaAdapter(prisma)
}

export function getStoreSync() {
  return new PrismaAdapter(prisma)
}

// Compatibility layer for the existing "collection" API until it's fully refactored
// This allows the use of getCollection("User").find(...) etc.
export class PrismaAdapter {
  constructor(private client: PrismaClient) {}

  collection(name: string) {
    const modelName = name.charAt(0).toLowerCase() + name.slice(1)
    const model = (this.client as any)[modelName]
    
    if (!model) {
      throw new Error(`Model ${name} (resolved as ${modelName}) NOT found in Prisma Client`)
    }

    return {
      find: (query = {}) => {
        // Basic query transformation: convert { _id: "..." } to { id: "..." }
        const where: any = {}
        Object.entries(query).forEach(([k, v]) => {
          if (k === '_id') where.id = v
          else if (!k.startsWith('$')) where[k] = v
        })
        
        return {
          sort: (s: any) => ({
            limit: (l: any) => ({
              lean: () => model.findMany({ where, take: l, orderBy: s })
            }),
            lean: () => model.findMany({ where, orderBy: s })
          }),
          limit: (l: any) => ({
            lean: () => model.findMany({ where, take: l })
          }),
          lean: () => model.findMany({ where })
        }
      },
      findOne: (query = {}) => {
        const where: any = {}
        Object.entries(query).forEach(([k, v]) => {
          if (k === '_id') where.id = v
          else where[k] = v
        })
        return model.findFirst({ where })
      },
      findById: (id: string) => model.findUnique({ where: { id } }),
      create: (data: any) => model.create({ data }),
      findByIdAndUpdate: (id: string, update: any) => model.update({ where: { id }, data: update }),
      findByIdAndDelete: (id: string) => model.delete({ where: { id } }),
    }
  }
}
