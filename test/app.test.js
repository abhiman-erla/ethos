const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

function fakeDb(overrides = {}) {
  return {
    ping: async () => {},
    listReleases: async () => [],
    createRelease: async (release) => ({ id: 1, ...release }),
    updateReleaseStatus: async (id, status) => ({ id, status }),
    getStats: async () => ({ total: 0, succeeded: 0, unsuccessful: 0, production: 0 }),
    ...overrides,
  };
}

async function withServer(db, callback) {
  const server = createApp({ db, version: "test" }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health endpoint reports version", async () => {
  await withServer(fakeDb(), async (url) => {
    const response = await fetch(`${url}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", service: "ethos", version: "test" });
  });
});

test("readiness returns 503 when PostgreSQL is unavailable", async () => {
  await withServer(fakeDb({ ping: async () => { throw new Error("offline"); } }), async (url) => {
    const response = await fetch(`${url}/ready`);
    assert.equal(response.status, 503);
  });
});

test("release endpoint validates input", async () => {
  await withServer(fakeDb(), async (url) => {
    const response = await fetch(`${url}/api/releases`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ service: "api" }),
    });
    assert.equal(response.status, 400);
  });
});
