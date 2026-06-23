// Netlify serverless function — Brenna's dashboard data layer (Baserow).
//
// GET   → returns all consultation leads as JSON (for the dashboard list)
// PATCH → updates a lead's status and/or internal notes (saved in Baserow,
//         so changes sync across every device — not just one browser)
//
// Security: the Baserow API token never reaches the browser. It lives only in
// this function's environment. The dashboard sends a password (DASHBOARD_PASSWORD)
// which we check before returning or changing anything.
//
// Required environment variables (set in Netlify → Site settings → Environment):
//   BASEROW_TOKEN          — the Baserow database token (keep secret)
//   DASHBOARD_PASSWORD     — the password Brenna types to open the dashboard
//   BASEROW_LEADS_TABLE_ID — optional; defaults to the Leads table (1041326)

const crypto = require("crypto");

const API = "https://api.baserow.io/api";
const LEADS_TABLE = process.env.BASEROW_LEADS_TABLE_ID || "1041326";
const SETTINGS_TABLE = process.env.BASEROW_SETTINGS_TABLE_ID || "1041494";

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

// Verify a password against any login row stored in the Baserow "Settings"
// table (owner = Maggie, dashboard = Brenna, etc.).
async function verifyPassword(token, password) {
  const res = await fetch(
    `${API}/database/rows/table/${SETTINGS_TABLE}/?user_field_names=true`,
    { headers: { Authorization: `Token ${token}` } }
  );
  if (!res.ok) return false;
  const data = await res.json();
  const rows = data.results || [];
  return rows.some(
    (r) => r.PasswordHash && sha256((r.Salt || "") + (password || "")) === r.PasswordHash
  );
}

// Map Baserow field names (with spaces) <-> the keys the dashboard uses.
function rowToLead(r) {
  return {
    id: r.id,
    createdAt: r["Created"] || null,
    fullName: r["Name"] || "",
    email: r["Email"] || "",
    phone: r["Phone"] || "",
    interestedService: r["Service"] || "",
    currentHairState: r["Hair State"] || "",
    beautyGoals: r["Beauty Goals"] || "",
    inspirationPhotos: r["Inspiration"] || "",
    preferredDays: r["Preferred Days"] || "",
    additionalNotes: r["Notes"] || "",
    status: (r["Status"] || "new").toLowerCase(),
    internalNotes: r["Internal Notes"] || "",
  };
}

exports.handler = async (event) => {
  const json = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  });

  const token = process.env.BASEROW_TOKEN;
  if (!token) {
    return json(500, { error: "Server not configured. Set BASEROW_TOKEN in Netlify." });
  }

  // ---- Password check (header or query string), verified against Baserow ----
  const provided =
    event.headers["x-dashboard-key"] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    "";
  if (!(await verifyPassword(token, provided))) return json(401, { error: "Unauthorized" });

  const auth = {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // ---- Update a lead (status / internal notes) ----
    if (event.httpMethod === "PATCH" || event.httpMethod === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}
      if (!body.id) return json(400, { error: "Missing lead id." });

      const fields = {};
      if (body.status) fields["Status"] = String(body.status).toLowerCase();
      if (typeof body.internalNotes === "string") fields["Internal Notes"] = body.internalNotes;
      if (!Object.keys(fields).length) return json(400, { error: "Nothing to update." });

      const res = await fetch(
        `${API}/database/rows/table/${LEADS_TABLE}/${body.id}/?user_field_names=true`,
        { method: "PATCH", headers: auth, body: JSON.stringify(fields) }
      );
      if (!res.ok) {
        return json(502, { error: `Could not update lead (${res.status}).` });
      }
      const updated = await res.json();
      return json(200, { ok: true, lead: rowToLead(updated) });
    }

    // ---- List all leads (newest first) ----
    const res = await fetch(
      `${API}/database/rows/table/${LEADS_TABLE}/?user_field_names=true&size=200&order_by=-Created`,
      { headers: auth }
    );
    if (!res.ok) {
      return json(502, { error: `Could not load leads (${res.status}). Check BASEROW_TOKEN.` });
    }
    const data = await res.json();
    const submissions = (data.results || []).map(rowToLead);
    return json(200, { count: submissions.length, submissions });
  } catch (err) {
    return json(500, { error: "Unexpected error: " + err.message });
  }
};
