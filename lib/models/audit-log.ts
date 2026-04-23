import { getCollection } from "@/lib/sqlite-model"

const AuditLog = getCollection<any>("AuditLog")

export default AuditLog
