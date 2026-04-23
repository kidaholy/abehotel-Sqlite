import { getCollection } from "@/lib/sqlite-model"

const User = getCollection<any>("User")

export default User
