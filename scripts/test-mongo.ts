import { MongoClient } from "mongodb";
import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("No MONGODB_URI"); process.exit(1); }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected");
    const db = client.db("aitube");
    const count = await db.collection("videos.files").countDocuments();
    console.log(`GridFS files: ${count}`);
    const files = await db.collection("videos.files").find({}).limit(10).toArray();
    for (const f of files) {
      console.log(`  - ${f.filename} | ${f.length} bytes | videoId: ${f.metadata?.videoId}`);
    }
  } catch (e: any) {
    console.error("❌ Failed:", e.message?.slice(0, 400));
  } finally {
    await client.close();
  }
}

main();
