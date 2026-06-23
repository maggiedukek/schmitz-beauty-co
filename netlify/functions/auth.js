// Netlify serverless function — dashboard login + password reset.
//
// The dashboard password is stored *hashed* in the Baserow "Settings" table, so
// Brenna can change it herself. On her very first login she's handed a temporary
// password (MustReset = "yes"), and the dashboard forces her to choose her own.
//
//   POST { action: "login", password }                 → { ok, mustReset }
//   POST { action: "set-password", password, newPassword } → { ok }
//
// Required environment variable:
//   BASEROW_TOKEN             — Baserow database token (keep secret)
//   BASEROW_SETTINGS_TABLE_ID — optional; defaults to the Settings table (1041494)

const crypto = require("crypto");

const API = "https://api.baserow.io/api";
const SETTINGS_TABLE = process.env.BASEROW_SETTINGS_TABLE_ID || "1041494";

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

async function getSettings(token) {
  const res = await fetch(
    `${API}/database/rows/table/${SETTINGS_TABLE}/?user_field_names=true`,
    { headers: { Authorization: `Token ${token}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const rows = data.results || [];
  return rows.find((r) => r.Name === "dashboard") || rows[0] || null;
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

  const settings = await getSettings(token);
  if (!settings) return json(500, { error: "Dashboard not set up yet." });

  // Does the supplied current password match the stored hash?
  const matches =
    !!settings.PasswordHash &&
    sha256((settings.Salt || "") + (body.password || "")) === settings.PasswordHash;

  if (body.action === "login") {
    if (!matches) return json(401, { error: "Incorrect password." });
    return json(200, {
      ok: true,
      mustReset: String(settings.MustReset || "").toLowerCase() === "yes",
    });
  }

  if (body.action === "set-password") {
    if (!matches) return json(401, { error: "Current password is incorrect." });
    const np = String(body.newPassword || "");
    if (np.length < 6) {
      return json(400, { error: "New password must be at least 6 characters." });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = sha256(salt + np);
    const res = await fetch(
      `${API}/database/rows/table/${SETTINGS_TABLE}/${settings.id}/?user_field_names=true`,
      {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ PasswordHash: hash, Salt: salt, MustReset: "no" }),
      }
    );
    if (!res.ok) return json(502, { error: "Could not save the new password." });
    return json(200, { ok: true });
  }

  return json(400, { error: "Unknown action." });
};
