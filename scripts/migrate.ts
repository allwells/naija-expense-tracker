import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected.");

    const schemaDir = path.join(__dirname, "../schema");

    // Order matters: main (tables) -> auth (better-auth tables) -> rls (policies) -> storage (buckets)
    const files = [
      "main.sql",
      "auth.sql",
      "fix_ids.sql",
      "rls.sql",
      "storage.sql",
    ];

    for (const file of files) {
      const filePath = path.join(schemaDir, file);
      console.log(`\n📄 Running ${file}...`);

      try {
        const sql = await fs.readFile(filePath, "utf-8");
        await client.query(sql);
        console.log(`✅ ${file} executed successfully.`);
      } catch (err: any) {
        console.error(`❌ Error running ${file}:`);
        console.error(err.message);
        // We don't exit here to allow subsequent scripts to try running if possible,
        // though usually dependent scripts will fail too.
        // For 'storage.sql', duplicate key errors are common if re-running.
        if (file === "storage.sql" && err.code === "23505") {
          console.log(
            "   (This is likely because the bucket already exists. Continuing...)",
          );
        }
      }
    }

    console.log("\n🎉 Schema migration script completed.");
  } catch (error) {
    console.error("❌ Database connection error:", error);
  } finally {
    await client.end();
  }
}

runMigrations();
