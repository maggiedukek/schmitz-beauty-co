// Netlify serverless function — Brenna's inventory / supplies tracker (Baserow).
//
// Two tracking modes per item:
//   • "level"  — eyeballed Full / ¾ / ½ / ¼ (Remaining is a percent 0–100,
//                Full is 100). Used for glue, tape, most supplies.
//   • "amount" — measured (e.g. Danger Jones color in oz). Remaining is the
//                real amount left; Full is a full container. Brenna logs how
//                much she uses per service and it deducts.
//
// Either way an item is "low" when it drops to a quarter (or its Alert At).
//
// GET   → list all items (with computed percent + low flag)
// POST  → create an item
// PATCH → update an item:
//           { id, use:N }        → subtract N from Remaining (a service used it)
//           { id, remaining:N }  → set Remaining directly (the level buttons)
//           { id, refill:true }  → set Remaining back to Full (restocked)
//           { id, name/category/unit/full/alertAt/brand/swatch/notes } → edit
//
// Security: the Baserow token stays server-side; the dashboard password is
// verified against the same Settings table the login uses.
//
// Required environment variables (Netlify → Site settings → Environment):
//   BASEROW_TOKEN              — the Baserow database token (keep secret)
//   BASEROW_SUPPLIES_TABLE_ID  — the id of the Inventory table
//   BASEROW_SETTINGS_TABLE_ID  — optional; defaults to the Settings table (1041494)
//
// The Inventory table must have these fields (exact names):
//   Item (text) · Category (text) · Mode (text) · Unit (text) · Full (number) ·
//   Remaining (number) · Alert At (number) · Brand (text) · Swatch (text) ·
//   Notes (long text) · Created (created-on)

const crypto = require("crypto");

const API = "https://api.baserow.io/api";
const SUPPLIES_TABLE = process.env.BASEROW_SUPPLIES_TABLE_ID || "";
const SETTINGS_TABLE = process.env.BASEROW_SETTINGS_TABLE_ID || "1041494";

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

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

function num(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function rowToSupply(r) {
  const full = num(r["Full"]);
  const remaining = num(r["Remaining"]);
  const alertAt = num(r["Alert At"]);
  const percent = full > 0 ? Math.round((remaining / full) * 100) : 0;
  const low = alertAt > 0 ? remaining <= alertAt : percent <= 25;
  return {
    id: r.id,
    name: r["Item"] || "",
    category: r["Category"] || "",
    mode: (r["Mode"] || "level").toLowerCase(),
    unit: r["Unit"] || "",
    full,
    remaining,
    alertAt,
    brand: r["Brand"] || "",
    swatch: r["Swatch"] || "",
    notes: r["Notes"] || "",
    percent,
    low,
    createdAt: r["Created"] || null,
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
  if (!SUPPLIES_TABLE) {
    return json(500, {
      error: "Set BASEROW_SUPPLIES_TABLE_ID in Netlify (the id of the Inventory table).",
    });
  }

  const provided =
    event.headers["x-dashboard-key"] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    "";
  if (!(await verifyPassword(token, provided))) return json(401, { error: "Unauthorized" });

  const auth = { Authorization: `Token ${token}`, "Content-Type": "application/json" };
  const rowUrl = (id) =>
    `${API}/database/rows/table/${SUPPLIES_TABLE}/${id}/?user_field_names=true`;

  try {
    // ---- Update / use / refill an item ----
    if (event.httpMethod === "PATCH" || event.httpMethod === "PUT") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}
      if (!body.id) return json(400, { error: "Missing item id." });

      const fields = {};

      // Usage-based changes need the current row first.
      if (body.use != null || body.refill) {
        const cur = await fetch(rowUrl(body.id), { headers: auth });
        if (!cur.ok) return json(502, { error: `Could not read item (${cur.status}).` });
        const c = await cur.json();
        const full = num(c["Full"]);
        const remaining = num(c["Remaining"]);
        if (body.refill) fields["Remaining"] = full;
        else fields["Remaining"] = Math.max(0, remaining - num(body.use));
      }

      if (body.remaining != null) fields["Remaining"] = Math.max(0, num(body.remaining));
      if (body.full != null) fields["Full"] = num(body.full);
      if (body.alertAt != null) fields["Alert At"] = num(body.alertAt);
      if (typeof body.name === "string") fields["Item"] = body.name;
      if (typeof body.category === "string") fields["Category"] = body.category;
      if (typeof body.mode === "string") fields["Mode"] = body.mode;
      if (typeof body.unit === "string") fields["Unit"] = body.unit;
      if (typeof body.brand === "string") fields["Brand"] = body.brand;
      if (typeof body.swatch === "string") fields["Swatch"] = body.swatch;
      if (typeof body.notes === "string") fields["Notes"] = body.notes;
      if (!Object.keys(fields).length) return json(400, { error: "Nothing to update." });

      const res = await fetch(rowUrl(body.id), {
        method: "PATCH", headers: auth, body: JSON.stringify(fields),
      });
      if (!res.ok) return json(502, { error: `Could not update item (${res.status}).` });
      return json(200, { ok: true, supply: rowToSupply(await res.json()) });
    }

    // ---- Create an item ----
    if (event.httpMethod === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}
      if (!body.name) return json(400, { error: "Give the item a name." });

      const full = num(body.full);
      const remaining = body.remaining != null ? num(body.remaining) : full;
      const fields = {
        Item: body.name,
        Category: body.category || "",
        Mode: body.mode || "level",
        Unit: body.unit || "",
        Full: full,
        Remaining: remaining,
        "Alert At": body.alertAt != null ? num(body.alertAt) : "",
        Brand: body.brand || "",
        Swatch: body.swatch || "",
        Notes: body.notes || "",
      };
      const res = await fetch(
        `${API}/database/rows/table/${SUPPLIES_TABLE}/?user_field_names=true`,
        { method: "POST", headers: auth, body: JSON.stringify(fields) }
      );
      if (!res.ok) {
        let m = `Could not save item (${res.status}).`;
        try {
          const e = await res.json();
          if (e && e.detail) m += " " + (typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail));
        } catch (e) {}
        return json(502, { error: m });
      }
      return json(200, { ok: true, supply: rowToSupply(await res.json()) });
    }

    // ---- List all items (low ones first, then by name) ----
    const res = await fetch(
      `${API}/database/rows/table/${SUPPLIES_TABLE}/?user_field_names=true&size=400&order_by=Item`,
      { headers: auth }
    );
    if (!res.ok) {
      return json(502, {
        error: `Could not load inventory (${res.status}). Check BASEROW_SUPPLIES_TABLE_ID and BASEROW_TOKEN.`,
      });
    }
    const data = await res.json();
    const supplies = (data.results || []).map(rowToSupply);
    supplies.sort((a, b) => (b.low ? 1 : 0) - (a.low ? 1 : 0));
    return json(200, { count: supplies.length, lowCount: supplies.filter((s) => s.low).length, supplies });
  } catch (err) {
    return json(500, { error: "Unexpected error: " + err.message });
  }
};
