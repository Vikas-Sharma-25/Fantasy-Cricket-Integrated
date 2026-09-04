import { MongoClient } from "mongodb";

const localUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/fantasy_cricket";
const atlasUri = process.argv[2] || process.env.ATLAS_MONGO_URI;

if (!atlasUri) {
  console.error("❌ Please provide your MongoDB Atlas URI as an argument.");
  console.log("Usage: node src/scripts/migrate.js \"mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/fantasy_cricket?retryWrites=true&w=majority\"");
  process.exit(1);
}

async function migrate() {
  console.log("🚀 Starting database migration from Local to Atlas...");
  console.log(`📡 Local Source: ${localUri}`);
  console.log(`☁️ Atlas Target: ${atlasUri.replace(/:([^:@]+)@/, ":****@")}`);

  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    await localClient.connect();
    await atlasClient.connect();

    const localDb = localClient.db();
    const atlasDb = atlasClient.db();

    const collections = await localDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log("⚠️ No collections found in local database.");
      return;
    }

    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;

      const localCol = localDb.collection(name);
      const atlasCol = atlasDb.collection(name);

      const docs = await localCol.find({}).toArray();
      if (docs.length === 0) {
        console.log(`ℹ️ Collection '${name}' is empty. Skipping.`);
        continue;
      }

      // Clear existing in Atlas target and insert local docs
      await atlasCol.deleteMany({});
      await atlasCol.insertMany(docs);
      console.log(`✅ Migrated '${name}': ${docs.length} documents copied.`);
    }

    console.log("\n🎉 ALL LOCAL DATA HAS BEEN SUCCESSFULLY COPIED TO MONGODB ATLAS!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();

