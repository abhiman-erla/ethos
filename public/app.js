const rows = document.querySelector("#release-rows");
const dialog = document.querySelector("#release-dialog");
const form = document.querySelector("#release-form");
const errorText = document.querySelector("#form-error");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function renderReleases(releases) {
  if (!releases.length) {
    rows.innerHTML = '<tr><td colspan="6" class="empty">No deployments yet. Create the first release record.</td></tr>';
    return;
  }
  rows.innerHTML = releases.map((release) => `
    <tr>
      <td><strong>${escapeHtml(release.service)}</strong></td>
      <td>${escapeHtml(release.version)}</td>
      <td>${escapeHtml(release.environment)}</td>
      <td><span class="badge ${escapeHtml(release.status)}">${escapeHtml(release.status.replace("_", " "))}</span></td>
      <td>${escapeHtml(release.owner)}</td>
      <td>${new Date(release.created_at).toLocaleString()}</td>
    </tr>
  `).join("");
}

async function loadDashboard() {
  try {
    const [releaseResponse, statsResponse] = await Promise.all([fetch("/api/releases"), fetch("/api/stats")]);
    if (!releaseResponse.ok || !statsResponse.ok) throw new Error("Dashboard data is unavailable");
    const { releases } = await releaseResponse.json();
    const { stats } = await statsResponse.json();
    renderReleases(releases);
    document.querySelector("#stat-total").textContent = stats.total;
    document.querySelector("#stat-success").textContent = stats.succeeded;
    document.querySelector("#stat-failed").textContent = stats.unsuccessful;
    document.querySelector("#stat-production").textContent = stats.production;
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)}</td></tr>`;
  }
}

document.querySelector("#open-dialog").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#refresh").addEventListener("click", loadDashboard);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorText.textContent = "";
  const payload = Object.fromEntries(new FormData(form).entries());
  const response = await fetch("/api/releases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    errorText.textContent = body.details?.join(". ") || body.error;
    return;
  }
  form.reset();
  dialog.close();
  await loadDashboard();
});

loadDashboard();
