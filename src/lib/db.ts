import dns from "dns";

// Ensure SRV lookups (mongodb+srv://) work even when the system's default
// DNS server blocks or filters them. Atlas hosts clusters behind SRV records
// like _mongodb._tcp.<cluster>.mongodb.net, so this is required.
//
// IMPORTANT: this MUST run before mongoose is imported anywhere. The Node
// DNS resolver picks up the server list the first time it needs to resolve
// a name. We force the public resolvers here so SRV lookups succeed even if
// the host's default DNS (e.g. corporate / ISP) blocks _mongodb._tcp.
if (process.env.NODE_ENV !== "production") {
  // On Vercel (and most serverless platforms) the platform's DNS already
  // resolves SRV records correctly; skipping this avoids touching global
  // state that isn't ours.
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} else {
  // Vercel's default DNS has been observed to refuse SRV for some Atlas
  // clusters ("querySrv ECONNREFUSED _mongodb._tcp..."). Force the public
  // resolvers in production too so serverless functions can connect.
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    if (typeof (dns as any).setDefaultResultOrder === "function") {
      (dns as any).setDefaultResultOrder("ipv4first");
    }
  } catch {
    // ignore – best-effort
  }
}

// Load env explicitly from .env.local. Next.js auto-loads .env / .env.local
// in server routes, but a process started outside Next (like tsx) may not.
// We read .env.local first so it overrides .env / .env.example placeholders.
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
if (process.env.NODE_ENV !== "production") {
  loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });
  loadEnv({ path: resolve(process.cwd(), ".env"), override: false });
}

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

function patchDns() {
  // Apply in every environment. Vercel's resolver has been observed to fail
  // SRV lookups for Atlas, so we always force the public resolvers.
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    if (typeof (dns as any).setDefaultResultOrder === "function") {
      (dns as any).setDefaultResultOrder("ipv4first");
    }
  } catch {
    // ignore – not all platforms support setDefaultResultOrder
  }
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Please configure your environment variables.");
  }
  patchDns();
  if (global._mongooseConn) {
    try {
      const r = await global._mongooseConn;
      if (r?.connection?.readyState === 1) return global._mongooseConn;
    } catch {
      global._mongooseConn = undefined;
    }
  }
  global._mongooseConn = mongoose.connect(MONGODB_URI, {
    dbName: "pharma_inventory",
    serverSelectionTimeoutMS: 15000,
    family: 4,
    // Serverless-friendly connection pool settings.
    maxPoolSize: 10,
    minPoolSize: 0,
    // Mongoose keeps the connection alive across warm invocations on
    // Vercel; auto-create collections are off to avoid schema drift.
    autoCreate: false,
    autoIndex: false
  }).catch((err) => {
    // Drop the cached rejected promise so the next invocation retries
    // the connect (otherwise a poisoned cache makes every request fail
    // until the function cold-starts again).
    global._mongooseConn = undefined;
    throw err;
  });
  return global._mongooseConn;
}
