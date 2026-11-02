const { Pool } = require("pg");

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS releases (
    id BIGSERIAL PRIMARY KEY,
    service VARCHAR(80) NOT NULL,
    version VARCHAR(80) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'deploying', 'succeeded', 'failed', 'rolled_back')),
    commit_sha VARCHAR(40),
    owner VARCHAR(80) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS releases_created_at_idx ON releases (created_at DESC);
  CREATE INDEX IF NOT EXISTS releases_environment_idx ON releases (environment);
`;

function createDatabase(config) {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  return {
    async migrate() {
      await pool.query(MIGRATION_SQL);
    },

    async ping() {
      await pool.query("SELECT 1");
    },

    async listReleases(limit = 50) {
      const result = await pool.query(
        `SELECT id, service, version, environment, status, commit_sha, owner, notes, created_at, updated_at
         FROM releases ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    },

    async createRelease(release) {
      const result = await pool.query(
        `INSERT INTO releases (service, version, environment, status, commit_sha, owner, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, service, version, environment, status, commit_sha, owner, notes, created_at, updated_at`,
        [
          release.service,
          release.version,
          release.environment,
          release.status,
          release.commitSha || null,
          release.owner,
          release.notes || null,
        ]
      );
      return result.rows[0];
    },

    async updateReleaseStatus(id, status) {
      const result = await pool.query(
        `UPDATE releases SET status = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, service, version, environment, status, commit_sha, owner, notes, created_at, updated_at`,
        [status, id]
      );
      return result.rows[0] || null;
    },

    async getStats() {
      const result = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'succeeded')::int AS succeeded,
          COUNT(*) FILTER (WHERE status IN ('failed', 'rolled_back'))::int AS unsuccessful,
          COUNT(*) FILTER (WHERE environment = 'production')::int AS production
        FROM releases
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);
      return result.rows[0];
    },

    async close() {
      await pool.end();
    },
  };
}

module.exports = { createDatabase, MIGRATION_SQL };
