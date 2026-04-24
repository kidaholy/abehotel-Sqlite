import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    return NextResponse.json({ 
      status: "error", 
      message: "DATABASE_URL is missing in environment variables" 
    }, { status: 500 })
  }

  // Sanitize for logging (hide password)
  const sanitizedUrl = url.replace(/:([^@]+)@/, ":****@")
  
  const pool = new Pool({ 
    connectionString: url.replace('localhost', '127.0.0.1'),
    connectionTimeoutMillis: 5000 
  })

  try {
    console.log("Testing DB connection to:", sanitizedUrl)
    const client = await pool.connect()
    
    // Check if we can run a simple query
    const res = await client.query("SELECT NOW()")
    
    // Check if docs table exists
    const tableRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'docs'
      );
    `)
    
    client.release()
    await pool.end()

    return NextResponse.json({
      status: "success",
      message: "Connected to PostgreSQL successfully",
      database_url_used: sanitizedUrl,
      db_time: res.rows[0].now,
      docs_table_exists: tableRes.rows[0].exists
    })
  } catch (err: any) {
    await pool.end()
    return NextResponse.json({
      status: "error",
      message: "PostgreSQL connection failed",
      database_url_used: sanitizedUrl,
      error_code: err.code,
      error_message: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
