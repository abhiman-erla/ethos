require("dotenv").config();
const { getConfig } = require("./config");
const { createDatabase } = require("./db");
const { createApp } = require("./app");

async function start() {
  const config = getConfig();
  const db = createDatabase(config);
  await db.migrate();

  const app = createApp({ db });
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log(`Ethos listening on port ${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Failed to start Ethos", error);
  process.exit(1);
});
