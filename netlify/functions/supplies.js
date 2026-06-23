// Netlify serverless function — Brenna's inventory / supplies tracker (Baserow).
//
// GET   → returns all supplies as JSON (for the Inventory tab)
// POST  → creates a supply item
// PATCH → updates an item's quantity (the +/- buttons) or other fields
//
// Security: the Baserow API token never reaches the browser. The dashboard sends
// the dashboard password, which we verify (same Settings table as the login).
//
// Required environment variables (Netlify → Site settings → Environment):
//   BASEROW_TOKEN              — the Baserow database token (keep secret)
//   BASEROW_SUPPLIES_TABLE_ID  — the id of the "Supplies" table
//   BASEROW_SETTINGS_TABLE_ID  — optional; defaults to the Settings table (1041494)
//
// The Supplies table must have these fields (exact names):
//   Item (text) · Category (text) · Quantity (number) · Reorder At (number) ·
//   Unit (text) · Notes (long text) · Created (created-on)

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
  return {
    id: r.id,
    name: r["Item"] || "",
    category: r["Category"] || "",
    quantity: num(r["Quantity"]),
    reorderAt: num(r["Reorder At"]),
    unit: r["Unit"] || "",
    notes: r["Notes"] || "",
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
      error: "Set BASEROW_SUPPLIES_TABLE_ID in Netlify (the id of the Supplies table).",
    });
  }

  const provided =
    event.headers["x-dashboard-key"] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    "";
  if (!(await verifyPassword(token, provided))) return json(401, { error: "Unauthorized" });

  const auth = { Authorization: `Token ${token}`, "Content-Type": "application/json" };

  try {
    // ---- Update an item (quantity / other fields) ----
    if (event.httpMethod === "PATCH" || event.httpMethod === "PUT") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}
      if (!body.id) return json(400, { error: "Missing item id." });

      const fields = {};
      if (body.quantity != null) fields["Quantity"] = num(body.quantity);
      if (body.reorderAt != null) fields["Reorder At"] = num(body.reorderAt);
      if (typeof body.name === "string") fields["Item"] = body.name;
      if (typeof body.category === "string") fields["Category"] = body.category;
      if (typeof body.unit === "string") fields["Unit"] = body.unit;
      if (typeof body.notes === "string") fields["Notes"] = body.notes;
      if (!Object.keys(fields).length) return json(400, { error: "Nothing to update." });

      const res = await fetch(
        `${API}/database/rows/table/${SUPPLIES_TABLE}/${body.id}/?user_field_names=true`,
        { method: "PATCH", headers: auth, body: JSON.stringify(fields) }
      );
      if (!res.ok) return json(502, { error: `Could not update item (${res.status}).` });
      const updated = await res.json();
      return json(200, { ok: true, supply: rowToSupply(updated) });
    }

    // ---- Create an item ----
    if (event.httpMethod === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}
      if (!body.name) return json(400, { error: "Give the item a name." });

      const fields = {
        Item: body.name,
        Category: body.category || "",
        Quantity: num(body.quantity),
        "Reorder At": num(body.reorderAt),
        Unit: body.unit || "",
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
      const created = await res.json();
      return json(200, { ok: true, supply: rowToSupply(created) });
    }

    // ---- List all supplies ----
    const res = await fetch(
      `${API}/database/rows/table/${SUPPLIES_TABLE}/?user_field_names=true&size=200&order_by=Item`,
      { headers: auth }
    );
    if (!res.ok) {
      return json(502, {
        error: `Could not load inventory (${res.status}). Check BASEROW_SUPPLIES_TABLE_ID and BASEROW_TOKEN.`,
      });
    }
    const data = await res.json();
    const supplies = (data.results || []).map(rowToSupply);
    return json(200, { count: supplies.length, supplies });
  } catch (err) {
    return json(500, { error: "Unexpected error: " + err.message });
  }
};
