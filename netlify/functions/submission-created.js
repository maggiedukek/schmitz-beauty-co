// Netlify automatically runs this function every time a form is submitted on
// the site (the filename "submission-created" is a Netlify event trigger).
//
// It does two things with each new consultation request:
//   1. Copies it into the Baserow "Leads" table (so it shows in the dashboard).
//   2. Sends the client a branded thank-you email from scheduling@schmitzbeautyco.com.
// The existing Netlify email notification to Brenna still fires as usual.
//
// Required environment variables:
//   BASEROW_TOKEN          — Baserow database token (keep secret)
//   BASEROW_LEADS_TABLE_ID — optional; defaults to the Leads table (1041326)
//   RESEND_API_KEY         — Resend API key (keep secret). If unset, the email
//                            step is skipped so nothing breaks before setup.

const API = "https://api.baserow.io/api";
const LEADS_TABLE = process.env.BASEROW_LEADS_TABLE_ID || "1041326";

const FROM = "Schmitz Beauty Co. <scheduling@schmitzbeautyco.com>";
const REPLY_TO = "brennaschmitz2021@gmail.com";

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return; // not configured yet, or no recipient — skip quietly
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

function thankYouHtml(firstName) {
  const name = firstName || "there";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background-image:linear-gradient(rgba(245,239,233,0.45),rgba(245,239,233,0.45)),url('https://i.imgur.com/E5xYmC9.png');background-size:540px;background-repeat:repeat;background-color:#f5efe9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-image:linear-gradient(rgba(245,239,233,0.45),rgba(245,239,233,0.45)),url('https://i.imgur.com/E5xYmC9.png');background-size:540px;background-repeat:repeat;"><tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;border:1px solid #ece3da;">
      <tr><td align="center" style="padding:36px 40px 8px;"><img src="https://i.imgur.com/WjfFLjt.png" alt="Schmitz Beauty Co." width="240" style="display:block;width:240px;max-width:70%;height:auto;" /></td></tr>
      <tr><td style="padding:0 40px;"><div style="height:3px;background:#b3261e;border-radius:2px;margin:14px 0 6px;"></div></td></tr>
      <tr><td style="padding:18px 44px 8px;"><h1 style="margin:0;font-family:'Abril Fatface',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#1a1a1a;">Thank you, ${name}!</h1></td></tr>
      <tr><td style="padding:8px 44px 0;font-family:'Inter',Arial,sans-serif;font-size:16px;line-height:1.7;color:#3a3a3a;">
        <p style="margin:0 0 16px;">Thank you so much for your consultation request. Brenna has your details and will personally reach out very soon to talk through what you're looking for &mdash; and find a time that works beautifully for you.</p>
        <p style="margin:0 0 16px;">In the meantime, feel free to reply to this email with any inspiration photos or questions you have.</p>
        <p style="margin:24px 0 4px;color:#0abab5;font-weight:600;">Talk soon,</p>
        <p style="margin:0;font-family:'Abril Fatface',Georgia,serif;font-size:20px;color:#1a1a1a;">Brenna</p>
      </td></tr>
      <tr><td style="padding:28px 44px 36px;"><div style="border-top:1px solid #ece3da;padding-top:18px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a857f;">Schmitz Beauty Co.<br /><a href="mailto:scheduling@schmitzbeautyco.com" style="color:#0abab5;text-decoration:none;">scheduling@schmitzbeautyco.com</a></div></td></tr>
    </table>
  </td></tr></table></body></html>`;
}

exports.handler = async (event) => {
  const token = process.env.BASEROW_TOKEN;
  if (!token) {
    console.error("BASEROW_TOKEN not set — cannot save lead to Baserow.");
    return { statusCode: 200, body: "skipped (no token)" };
  }

  let data = {};
  let formName = "";
  try {
    const parsed = JSON.parse(event.body || "{}");
    data = (parsed.payload && parsed.payload.data) || parsed.data || parsed || {};
    formName = (parsed.payload && parsed.payload.form_name) || "";
  } catch (e) {
    console.error("Could not parse submission payload:", e.message);
    return { statusCode: 200, body: "skipped (bad payload)" };
  }

  // Only handle the consultation form; ignore any other forms on the site.
  if (formName && formName !== "consultation") {
    return { statusCode: 200, body: "ignored (other form)" };
  }

  const row = {
    Name: data.fullName || data.name || "",
    Email: data.email || "",
    Phone: data.phone || "",
    Service: data.interestedService || "",
    "Hair State": data.currentHairState || "",
    "Beauty Goals": data.beautyGoals || "",
    Inspiration: data.inspirationPhotos || "",
    "Preferred Days": data.preferredDays || "",
    Notes: data.additionalNotes || "",
    Status: "new",
  };

  try {
    const res = await fetch(
      `${API}/database/rows/table/${LEADS_TABLE}/?user_field_names=true`,
      {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(row),
      }
    );
    if (!res.ok) {
      console.error("Baserow insert failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Baserow insert threw:", err.message);
  }

  // Send the client their thank-you email (skips itself if RESEND_API_KEY is unset).
  const firstName = (data.fullName || data.name || "").trim().split(/\s+/)[0];
  await sendEmail({
    to: data.email,
    subject: "Thank you for reaching out to Schmitz Beauty Co.!",
    html: thankYouHtml(firstName),
  });

  return { statusCode: 200, body: "done" };
};
