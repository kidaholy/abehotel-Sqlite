import { getCollection } from "@/lib/sqlite-model"

const Settings = getCollection<any>("Settings")

export default Settings