const ENVIRONMENTS = new Set(["development", "staging", "production"]);
const STATUSES = new Set(["queued", "deploying", "succeeded", "failed", "rolled_back"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRelease(input = {}) {
  const release = {
    service: cleanString(input.service),
    version: cleanString(input.version),
    environment: cleanString(input.environment),
    status: cleanString(input.status) || "queued",
    commitSha: cleanString(input.commitSha),
    owner: cleanString(input.owner),
    notes: cleanString(input.notes),
  };
  const errors = [];

  if (!release.service || release.service.length > 80) errors.push("service is required and must be 80 characters or fewer");
  if (!release.version || release.version.length > 80) errors.push("version is required and must be 80 characters or fewer");
  if (!ENVIRONMENTS.has(release.environment)) errors.push("environment must be development, staging, or production");
  if (!STATUSES.has(release.status)) errors.push("status is invalid");
  if (!release.owner || release.owner.length > 80) errors.push("owner is required and must be 80 characters or fewer");
  if (release.commitSha && !/^[a-f0-9]{7,40}$/i.test(release.commitSha)) errors.push("commitSha must be a 7 to 40 character Git SHA");
  if (release.notes.length > 1000) errors.push("notes must be 1000 characters or fewer");

  return { value: release, errors };
}

function validateStatus(value) {
  return typeof value === "string" && STATUSES.has(value);
}

module.exports = { validateRelease, validateStatus, ENVIRONMENTS, STATUSES };
