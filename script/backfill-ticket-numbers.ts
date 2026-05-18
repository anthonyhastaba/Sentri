import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";

async function backfill() {
  await db.execute(sql`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at, id) AS rn
      FROM tickets
    )
    UPDATE tickets
    SET ticket_number = ranked.rn
    FROM ranked
    WHERE tickets.id = ranked.id
  `);
  console.log("ticket_number backfill complete");
  await pool.end();
}

backfill().catch((err) => { console.error(err); process.exit(1); });
