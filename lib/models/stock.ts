import { getCollection } from "@/lib/sqlite-model"

const Stock = getCollection<any>("Stock")

export default Stock
