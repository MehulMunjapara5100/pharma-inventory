const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function show() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "pharma_inventory" });
  const db = mongoose.connection.db;
  for (const name of ["users", "products", "notifications", "stockhistories", "suppliers"]) {
    const c = db.collection(name);
    const count = await c.countDocuments();
    console.log(`\n=== ${name} (${count} docs) ===`);
    const docs = await c.find().limit(2).toArray();
    console.log(JSON.stringify(docs, null, 2));
  }
  process.exit(0);
}
show().catch((e) => { console.error(e); process.exit(1); });
