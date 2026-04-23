import { getCollection } from "@/lib/sqlite-model"

const OperationalExpense = getCollection<any>("OperationalExpense")

export default OperationalExpense
