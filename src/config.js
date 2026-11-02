function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function getConfig(env = process.env) {
  return {
    nodeEnv: env.NODE_ENV || "development",
    port: Number(env.PORT || 3000),
    databaseUrl: env.DATABASE_URL || "postgres://ethos:ethos@localhost:5432/ethos",
    databaseSsl: parseBoolean(env.DATABASE_SSL),
    logLevel: env.LOG_LEVEL || "info",
  };
}

module.exports = { getConfig, parseBoolean };
