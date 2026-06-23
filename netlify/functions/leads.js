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

const FROM = "Schmitz Beauty Co. <scheduling@schmitzbeautyco.com>";
const REPLY_TO = "brennaschmitz2021@gmail.com";

const sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

const esc = (s) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Send an email through Resend (skips quietly if RESEND_API_KEY isn't set yet).
async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html }),
    });
    if (!r.ok) console.error("Resend send failed:", r.status, await r.text());
  } catch (e) {
    console.error("Resend send threw:", e.message);
  }
}

// Branded "you're booked" email with the date/time Brenna entered.
function appointmentHtml(firstName, appointment, service) {
  const name = esc(firstName) || "there";
  const when = esc(appointment) || "(time to be confirmed)";
  const svc = esc(service) || "your appointment";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background-image:linear-gradient(rgba(245,239,233,0.45),rgba(245,239,233,0.45)),url('https://i.imgur.com/E5xYmC9.png');background-size:540px;background-repeat:repeat;background-color:#f5efe9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-image:linear-gradient(rgba(245,239,233,0.45),rgba(245,239,233,0.45)),url('https://i.imgur.com/E5xYmC9.png');background-size:540px;background-repeat:repeat;"><tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;border:1px solid #ece3da;">
      <tr><td align="center" style="padding:36px 40px 8px;"><img src="https://i.imgur.com/WjfFLjt.png" alt="Schmitz Beauty Co." width="240" style="display:block;width:240px;max-width:70%;height:auto;" /></td></tr>
      <tr><td style="padding:0 40px;"><div style="height:3px;background:#b3261e;border-radius:2px;margin:14px 0 6px;"></div></td></tr>
      <tr><td style="padding:18px 44px 8px;"><h1 style="margin:0;font-family:'Abril Fatface',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#1a1a1a;">You're all set, ${name}!</h1></td></tr>
      <tr><td style="padding:8px 44px 0;font-family:'Inter',Arial,sans-serif;font-size:16px;line-height:1.7;color:#3a3a3a;"><p style="margin:0 0 18px;">I can't wait to see you. Here are your appointment details:</p></td></tr>
      <tr><td style="padding:0 44px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe9;border-left:4px solid #0abab5;border-radius:10px;">
        <tr><td style="padding:18px 22px 4px;font-family:'Inter',Arial,sans-serif;"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8a857f;">When</div><div style="font-size:17px;font-weight:600;color:#1a1a1a;padding-top:2px;">${when}</div></td></tr>
        <tr><td style="padding:10px 22px 4px;font-family:'Inter',Arial,sans-serif;"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8a857f;">Service</div><div style="font-size:17px;font-weight:600;color:#1a1a1a;padding-top:2px;">${svc}</div></td></tr>
        <tr><td style="padding:10px 22px 20px;font-family:'Inter',Arial,sans-serif;"><div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8a857f;">Where</div><div style="font-size:17px;font-weight:600;color:#1a1a1a;padding-top:2px;">Schmitz Beauty Co. studio</div></td></tr>
      </table></td></tr>
      <tr><td style="padding:22px 44px 0;font-family:'Inter',Arial,sans-serif;font-size:16px;line-height:1.7;color:#3a3a3a;">
        <p style="margin:0 0 16px;">Need to reschedule or have a question? Just reply to this email and I'll take care of it.</p>
        <p style="margin:24px 0 4px;color:#0abab5;font-weight:600;">See you soon,</p>
        <p style="margin:0;font-family:'Abril Fatface',Georgia,serif;font-size:20px;color:#1a1a1a;">Brenna</p>
      </td></tr>
      <tr><td style="padding:28px 44px 36px;"><div style="border-top:1px solid #ece3da;padding-top:18px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a857f;">Schmitz Beauty Co.<br /><a href="mailto:scheduling@schmitzbeautyco.com" style="color:#0abab5;text-decoration:none;">scheduling@schmitzbeautyco.com</a></div></td></tr>
    </table>
  </td></tr></table></body></html>`;
}

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
    appointment: r["Appointment"] || "",
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
      if (typeof body.appointment === "string") fields["Appointment"] = body.appointment;
      if (!Object.keys(fields).length) return json(400, { error: "Nothing to update." });

      const res = await fetch(
        `${API}/database/rows/table/${LEADS_TABLE}/${body.id}/?user_field_names=true`,
        { method: "PATCH", headers: auth, body: JSON.stringify(fields) }
      );
      if (!res.ok) {
        return json(502, { error: `Could not update lead (${res.status}).` });
      }
      const lead = rowToLead(await res.json());

      // Email the client their appointment details — only when the front-end
      // explicitly asks (sendConfirmation: true), so editing a booked lead later
      // never re-sends the email.
      let emailed = false;
      if (body.sendConfirmation === true && lead.email && lead.appointment) {
        await sendEmail({
          to: lead.email,
          subject: "You're booked with Schmitz Beauty Co.!",
          html: appointmentHtml(
            (lead.fullName || "").trim().split(/\s+/)[0],
            lead.appointment,
            lead.interestedService
          ),
        });
        emailed = true;
      }

      return json(200, { ok: true, lead, emailed });
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
