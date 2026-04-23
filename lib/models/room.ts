import { getCollection } from "@/lib/sqlite-model"

const Room = getCollection<any>("Room")

export default Room
