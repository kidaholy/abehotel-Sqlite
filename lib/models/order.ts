import { getCollection } from "@/lib/sqlite-model"

const Order = getCollection<any>("Order")

export default Order
