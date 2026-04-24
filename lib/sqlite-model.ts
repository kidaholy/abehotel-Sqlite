import { getStoreSync } from "@/lib/db"

const COLLECTION_NAME_MAP: Record<string, string> = {
  AuditLog: "auditlogs",
  Category: "categories",
  DailyExpense: "dailyexpenses",
  FixedAsset: "fixedassets",
  Floor: "floors",
  MenuItem: "menuitems",
  OperationalExpense: "operationalexpenses",
  Order: "orders",
  ReceptionRequest: "receptionrequests",
  Room: "rooms",
  Service: "services",
  Settings: "settings",
  Stock: "stocks",
  StoreLog: "storelogs",
  Table: "tables",
  TransferRequest: "transferrequests",
  User: "users",
  Vip1MenuItem: "vip1menuitems",
  Vip2MenuItem: "vip2menuitems",
}

function resolveCollectionName(modelName: string) {
  return COLLECTION_NAME_MAP[modelName] || modelName
}

export function getCollection<T = any>(name: string) {
  const collectionName = resolveCollectionName(name)
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const collection = getStoreSync().collection(collectionName) as any
        const value = collection[prop]
        return typeof value === "function" ? value.bind(collection) : value
      },
    },
  ) as any as T
}

