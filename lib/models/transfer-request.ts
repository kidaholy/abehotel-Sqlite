import { getCollection } from "@/lib/sqlite-model"

const TransferRequest = getCollection<any>("TransferRequest")

export default TransferRequest
