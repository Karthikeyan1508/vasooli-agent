// Database verification script to inspect PostgreSQL tables and columns.
import "dotenv/config";
import { initDb, pool } from "./db.js";

async function verifyDatabase() {
  const connectionString = process.env.DATABASE_URL;
  const hasDatabase = Boolean(
    connectionString &&
    connectionString.trim() !== "" &&
    !connectionString.includes("user:pass@host")
  );

  console.log("\n=======================================================");
  console.log("🔍 VASOOLI DATABASE VERIFICATION TOOL");
  console.log("=======================================================\n");

  if (!hasDatabase) {
    console.log("⚠️  MODE: In-Memory Demo Fallback (No live Postgres URL found in DATABASE_URL)");
    console.log("   To test live PostgreSQL, set DATABASE_URL in backend/.env to your Postgres connection string.\n");
    return;
  }

  console.log("✅ MODE: Live PostgreSQL Database");
  console.log(`📡 Connecting to: ${connectionString?.replace(/:[^:@]+@/, ":****@")}\n`);

  try {
    // Run DB initialization / schema application
    await initDb();

    // Query tables from PostgreSQL information_schema
    const tablesResult = await pool.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map((r) => r.table_name);
    console.log(`📊 Found ${tables.length} Table(s) in PostgreSQL:\n`);

    for (const table of tables) {
      console.log(`📌 Table: "${table}"`);

      // Query columns for table
      const columnsResult = await pool.query<{ column_name: string; data_type: string; is_nullable: string }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      // Query row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const rowCount = countResult.rows[0].count;

      console.table(columnsResult.rows);
      console.log(`   └ Total Rows: ${rowCount}\n`);
    }

    console.log("🎉 Database schema verification completed successfully!\n");
  } catch (error) {
    console.error("❌ Database verification failed with error:", error);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
