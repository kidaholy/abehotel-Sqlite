import { getStoreSync } from "@/lib/db"

export function getCollection<T = any>(name: string) {
  return getStoreSync().collection(name) as any as T
}

