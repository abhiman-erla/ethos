const client = require("@prometheus-io/client");

function createMetrics() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry, prefix: "ethos_" });

  const requestDuration = new client.Histogram({
    name: "ethos_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry],
  });

  const releasesCreated = new client.Counter({
    name: "ethos_releases_created_total",
    help: "Total release records created",
    labelNames: ["environment", "status"],
    registers: [registry],
  });

  return { registry, requestDuration, releasesCreated };
}

module.exports = { createMetrics };
