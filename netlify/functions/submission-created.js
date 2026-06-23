// Netlify automatically runs this function every time a form is submitted on
// the site (the filename "submission-created" is a Netlify event trigger).
//
// It copies the new consultation request into the Baserow "Leads" table so it
// shows up in Brenna's dashboard. The existing Netlify email notification still
// fires as usual — this just adds the dashboard copy on top of it.
//
// Required environment variable:
//   BASEROW_TOKEN          — the Baserow database token (keep secret)
//   BASEROW_LEADS_TABLE_ID — optional; defaults to the Leads table (1041326)

const API = "https://api.baserow.io/api";
const LEADS_TABLE = process.env.BASEROW_LEADS_TABLE_ID || "1041326";

exports.handler = async (event) => {
  const token = process.env.BASEROW_TOKEN;
  if (!token) {
    console.error("BASEROW_TOKEN not set — cannot save lead to Baserow.");
    return { statusCode: 200, body: "skipped (no token)" };
  }

  let data = {};
  try {
    const parsed = JSON.parse(event.body || "{}");
    data = (parsed.payload && parsed.payload.data) || parsed.data || parsed || {};
  } catch (e) {
    console.error("Could not parse submission payload:", e.message);
    return { statusCode: 200, body: "skipped (bad payload)" };
  }

  // Only handle the consultation form; ignore any other forms on the site.
  const formName = (event.body && JSON.parse(event.body).payload &&
    JSON.parse(event.body).payload.form_name) || "";
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
      return { statusCode: 200, body: "baserow error" };
    }
    return { statusCode: 200, body: "lead saved" };
  } catch (err) {
    console.error("Baserow insert threw:", err.message);
    return { statusCode: 200, body: "error" };
  }
};
