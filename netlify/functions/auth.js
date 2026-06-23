// Netlify serverless function — dashboard login + password reset.
//
// Passwords are stored *hashed* in the Baserow "Settings" table — one row per
// person who can log in (e.g. "owner" = Maggie, "dashboard" = Brenna). Each row
// has its own MustReset flag, so Brenna can be forced to choose a password on her
// first login while the owner login skips that.
//
//   POST { action: "login", password }                     → { ok, mustReset }
//   POST { action: "set-password", password, newPassword }  → { ok }
//
// Required environment variable:
//   BASEROW_TOKEN             — Baserow database token (keep secret)
//   BASEROW_SETTINGS_TABLE_ID — optional; defaults to the Settings table (1041494)

const crypto = require("crypto");

const API = "https://api.baserow.io/api";
const SETTINGS_TABLE = process.env.BASEROW_SETTINGS_TABLE_ID || "1041494";

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

async function getRows(token) {
  const res = await fetch(
    `${API}/database/rows/table/${SETTINGS_TABLE}/?user_field_names=true`,
    { headers: { Authorization: `Token ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

// Find the credential row whose stored hash matches the supplied password.
function findMatch(rows, password) {
  return (
    rows.find(
      (r) => r.PasswordHash && sha256((r.Salt || "") + (password || "")) === r.PasswordHash
    ) || null
  );
}

exports.handler = async (event) => {
  const json = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  });

  const token = process.env.BASEROW_TOKEN;
  if (!token) return json(500, { error: "Server not configured (BASEROW_TOKEN)." });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) {}

  const rows = await getRows(token);
  if (!rows.length) return json(500, { error: "Dashboard not set up yet." });

  const match = findMatch(rows, body.password);

  if (body.action === "login") {
    if (!match) return json(401, { error: "Incorrect password." });
    return json(200, {
      ok: true,
      mustReset: String(match.MustReset || "").toLowerCase() === "yes",
    });
  }

  if (body.action === "set-password") {
    if (!match) return json(401, { error: "Current password is incorrect." });
    const np = String(body.newPassword || "");
    if (np.length < 6) {
      return json(400, { error: "New password must be at least 6 characters." });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = sha256(salt + np);
    const res = await fetch(
      `${API}/database/rows/table/${SETTINGS_TABLE}/${match.id}/?user_field_names=true`,
      {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ PasswordHash: hash, Salt: salt, MustReset: "no" }),
      }
    );
    if (!res.ok) return json(502, { error: "Could not save the new password." });
    return json(200, { ok: true 