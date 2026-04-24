import { getStoreSync } from "@/lib/db"

function resolveCollectionName(modelName: string) {
  return modelName
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

