import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    const store = global.__abehotel_pg_store;
    
    // @ts-ignore - access internal pool config
    const connectionInfo = store?.pool?.options?.connectionString || "No connection string found";
    
    // Mask password
    const masked = connectionInfo.replace(/:([^:@]+)@/, ":****@");
    
    // Count users to verify data presence
    const userCount = await (await store.collection("users")).countDocuments();
    const roomCount = await (await store.collection("rooms")).countDocuments();

    return NextResponse.json({
      activeDatabaseUrl: masked,
      nodeEnv: process.env.NODE_ENV,
      counts: {
        users: userCount,
        rooms: roomCount
      },
      envKeysPresent: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("MONGO"))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
