// Netlify serverless function — Brenna's expense / receipt tracker (Baserow).
//
// GET  → returns all expenses as JSON (for the Receipts tab)
// POST → creates an expense. If an "imageBase64" is included, the receipt photo
//        is uploaded to Baserow's file storage and attached to the row.
//
// Security: the Baserow API token never reaches the browser. It lives only in
// this function's environment. The dashboard sends the dashboard password,
// which we verify (same Settings table as the login) before doing anything.
//
// Required environment variables (Netlify → Site settings → Environment):
//   BASEROW_TOKEN              — the Baserow database token (keep secret)
//   BASEROW_EXPENSES_TABLE_ID  — the id of the "Expenses" table
//   BASEROW_SETTINGS_TABLE_ID  — optional; defaults to the Settings table (1041494)
//
// The Expenses table must have these fields (exact names):
//   Vendor (text) · Amount (number, 2 decimals) · Date (date) ·
//   Category (text) · Notes (long text) · Receipt (file) · Created (created-on)

const crypto = require("crypto");

const API = "https://api.baserow.io/api";
const EXPENSES_TABLE = process.env.BASEROW_EXPENSES_TABLE_ID || "";
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

function rowToExpense(r) {
  let receiptUrl = "";
  const files = r["Receipt"];
  if (Array.isArray(files) && files.length) {
    const f = files[0];
    receiptUrl =
      f.url ||
      (f.thumbnails && f.thumbnails.card && f.thumbnails.card.url) ||
      "";
  }
  return {
    id: r.id,
    createdAt: r["Created"] || null,
    vendor: r["Vendor"] || "",
    amount: r["Amount"] != null ? r["Amount"] : "",
    date: r["Date"] || "",
    category: r["Category"] || "",
    notes: r["Notes"] || "",
    receiptUrl: receiptUrl,
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
  if (!EXPENSES_TABLE) {
    return json(500, {
      error: "Set BASEROW_EXPENSES_TABLE_ID in Netlify (the id of the Expenses table).",
    });
  }

  // ---- Password check (same login the dashboard uses) ----
  const provided =
    event.headers["x-dashboard-key"] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    "";
  if (!(await verifyPassword(token, provided))) return json(401, { error: "Unauthorized" });

  const auth = { Authorization: `Token ${token}`, "Content-Type": "application/json" };

  try {
    // ---- Create an expense (with optional receipt photo) ----
    if (event.httpMethod === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (e) {}

      let fileRef = null;
      if (body.imageBase64) {
        const b64 = String(body.imageBase64).replace(/^data:[^;]+;base64,/, "");
        const buf = Buffer.from(b64, "base64");
        const form = new FormData();
        form.append("file", new Blob([buf]), body.imageName || "receipt.jpg");
        const up = await fetch(`${API}/user-files/upload-file/`, {
          method: "POST",
          headers: { Authorization: `Token ${token}` }, // let fetch set multipart boundary
          body: form,
        });
        if (!up.ok) {
          return json(502, { error: `Receipt photo upload failed (${up.status}).` });
        }
        const f = await up.json();
        fileRef = [{ name: f.name }];
      }

      const fields = {
        Vendor: body.vendor || "",
        Amount: body.amount === "" || body.amount == null ? null : Number(body.amount),
        Date: body.date || null,
        Category: body.category || "",
        Notes: body.notes || "",
      };
      if (fileRef) fields["Receipt"] = fileRef;

      const res = await fetch(
        `${API}/database/rows/table/${EXPENSES_TABLE}/?user_field_names=true`,
        { method: "POST", headers: auth, body: JSON.stringify(fields) }
      );
      if (!res.ok) {
        let m = `Could not save expense (${res.status}).`;
        try {
          const e = await res.json();
          if (e && e.detail) m += " " + (typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail));
        } catch (e) {}
        return json(502, { error: m });
      }
      const created = await res.json();
      return json(200, { ok: true, expense: rowToExpense(created) });
    }

    // ---- List all expenses (newest first) ----
    const res = await fetch(
      `${API}/database/rows/table/${EXPENSES_TABLE}/?user_field_names=true&size=200&order_by=-Date`,
      { headers: auth }
    );
    if (!res.ok) {
      return json(502, {
        error: `Could not load expenses (${res.status}). Check BASEROW_EXPENSES_TABLE_ID and BASEROW_TOKEN.`,
      });
    }
    const data = await res.json();
    const expenses = (data.results || []).map(rowToExpense);
    return json(200, { count: expenses.length, expenses });
  } catch (err) {
    return json(500, { error: "Unexpected error: " + err.message });
  }
};
