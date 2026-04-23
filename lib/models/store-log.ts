import { getCollection } from "@/lib/sqlite-model"

const StoreLog = getCollection<any>("StoreLog")

export default StoreLog
