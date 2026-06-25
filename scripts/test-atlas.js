const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI;
console.log("URI host:", uri ? new URL(uri.replace("mongodb+srv://", "http://")).host : "MISSING");
mongoose
  .connect(uri, { dbName: "pharma_inventory", serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("CONNECTED");
    return mongoose.connection.db.admin().command({ ping: 1 });
  })
  .then((r) => {
    console.log("PING:", JSON.stringify(r));
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((cols) => {
    console.log("COLLECTIONS:", cols.map((c) => c.name).join(", "));
    process.exit(0);
  })
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
