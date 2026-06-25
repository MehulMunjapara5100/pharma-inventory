const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
require("dotenv").config({ path: ".env.local", override: true });
const mongoose = require("mongoose");

console.log("[check] process.env.MONGODB_URI =", process.env.MONGODB_URI);
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("[check] NO URI LOADED — .env.local is not being read.");
  process.exit(1);
}

mongoose
  .connect(uri, { dbName: "pharma_inventory", serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log("[check] CONNECTED");
    const users = await mongoose.connection.db.collection("users").countDocuments();
    console.log("[check] users count =", users);
    process.exit(0);
  })
  .catch((e) => {
    console.error("[check] ERR:", e.message);
    process.exit(1);
  });
