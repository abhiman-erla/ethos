const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRelease, validateStatus } = require("../src/validation");

test("validateRelease accepts a complete release", () => {
  const result = validateRelease({
    service: "payments-api",
    version: "v1.4.2",
    environment: "production",
    status: "succeeded",
    commitSha: "abc1234",
    owner: "platform-team",
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.value.service, "payments-api");
});

test("validateRelease rejects unsafe or missing fields", () => {
  const result = validateRelease({ environment: "local", commitSha: "not-a-sha" });
  assert.ok(result.errors.length >= 4);
});

test("validateStatus only accepts workflow statuses", () => {
  assert.equal(validateStatus("rolled_back"), true);
  assert.equal(validateStatus("deleted"), false);
});
