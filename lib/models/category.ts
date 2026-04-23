import { getCollection } from "@/lib/sqlite-model"

const Category = getCollection<any>("Category")

export default Category
