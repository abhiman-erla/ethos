const crypto = require("crypto");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { validateRelease, validateStatus } = require("./validation");
const { createMetrics } = require("./metrics");

function createApp({ db, version = process.env.APP_VERSION || "development" }) {
  const app = express();
  const metrics = createMetrics();

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "100kb" }));

  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    req.requestId = req.header("x-request-id") || crypto.randomUUID();
    res.setHeader("x-request-id", req.requestId);

    res.on("finish", () => {
      const elapsed = Number(process.hrtime.bigint() - started) / 1e9;
      metrics.requestDuration.observe(
        { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
        elapsed
      );
      process.stdout.write(`${JSON.stringify({ level: "info", requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(elapsed * 1000) })}\n`);
    });
    next();
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "ethos", version });
  });

  app.get("/ready", async (req, res) => {
    try {
      await db.ping();
      res.json({ status: "ready", database: "connected" });
    } catch (error) {
      res.status(503).json({ status: "not_ready", database: "unavailable" });
    }
  });

  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", metrics.registry.contentType);
    res.end(await metrics.registry.metrics());
  });

  app.get("/api/releases", async (req, res, next) => {
    try {
      const requestedLimit = Number(req.query.limit || 50);
      const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
      res.json({ releases: await db.listReleases(limit) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/releases", async (req, res, next) => {
    try {
      const { value, errors } = validateRelease(req.body);
      if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

      const release = await db.createRelease(value);
      metrics.releasesCreated.inc({ environment: release.environment, status: release.status });
      res.status(201).json({ release });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/releases/:id/status", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1 || !validateStatus(req.body.status)) {
        return res.status(400).json({ error: "A valid release id and status are required" });
      }
      const release = await db.updateReleaseStatus(id, req.body.status);
      if (!release) return res.status(404).json({ error: "Release not found" });
      res.json({ release });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/stats", async (req, res, next) => {
    try {
      res.json({ stats: await db.getStats() });
    } catch (error) {
      next(error);
    }
  });

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.get("/*splat", (req, res) => res.sendFile(path.join(__dirname, "..", "public", "index.html")));

  app.use((error, req, res, next) => {
    process.stderr.write(`${JSON.stringify({ level: "error", requestId: req.requestId, message: error.message })}\n`);
    res.status(500).json({ error: "Internal server error", requestId: req.requestId });
  });

  return app;
}

module.exports = { createApp };
