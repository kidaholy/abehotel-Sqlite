import { getCollection } from "@/lib/sqlite-model"

const DailyExpense = getCollection<any>("DailyExpense")

export default DailyExpense
