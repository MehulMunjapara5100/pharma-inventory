// Early DNS bootstrap for Next.js. This file is wired in via
// instrumentationHook in next.config.mjs so it runs once, before any
// application code (including any route handler that imports db.ts).
//
// Atlas connection strings use mongodb+srv:// which requires an SRV lookup
// against _mongodb._tcp.<cluster>.mongodb.net. Some networks (corporate
// Wi-Fi, ISPs, VPNs) refuse those queries on the system DNS, which causes
// `querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net`. Forcing
// public resolvers here guarantees the SRV lookup succeeds regardless of
// the host's default DNS configuration.

if (typeof process !== "undefined" && process.versions?.node) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    // eslint-disable-next-line no-console
    console.log("[instrumentation] DNS resolvers set to:", dns.getServers().join(", "));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[instrumentation] Failed to set DNS servers:", err);
  }
}

export async function register() {
  // No-op; presence of this file enables Next's instrumentation hook.
}