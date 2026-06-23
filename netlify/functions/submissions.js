// Netlify serverless function — returns consultation form submissions as JSON.
//
// Security: the Netlify API token never reaches the browser. It lives only in
// this function's environment. The dashboard sends a password (DASHBOARD_PASSWORD)
// which we check before returning any data.
//
// Required environment variables (set in Netlify → Site settings → Environment):
//   NETLIFY_AUTH_TOKEN  — a Netlify personal access token (User settings → Applications)
//   DASHBOARD_PASSWORD  — the password Brenna types to open the dashboard
//   NETLIFY_SITE_ID     — optional; falls back to the SITE_ID Netlify injects automatically

const API = "https://api.netlify.com/api/v1";

exports.handler = async (event) => {
  const json = (statusCode, body) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  });

  const token = process.env.NETLIFY_AUTH_TOKEN;
  const password = process.env.DASHBOARD_PASSWORD;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  if (!token || !password || !siteId) {
    return json(500, {
      error:
        "Server not configured. Set NETLIFY_AUTH_TOKEN, DASHBOARD_PASSWORD, and (optionally) NETLIFY_SITE_ID.",
    });
  }

  // Check the password from a header or query string.
  const provided =
    event.headers["x-dashboard-key"] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    "";

  if (provided !== password) {
    return json(401, { error: "Unauthorized" });
  }

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  try {
    // Find the "consultation" form for this site.
    const formsRes = await fetch(`${API}/sites/${siteId}/forms`, auth);
    if (!formsRes.ok) {
      return json(502, {
        error: `Could not list forms (${formsRes.status}). Check NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID.`,
      });
    }
    const forms = await formsRes.json();
    const form =
      forms.find((f) => f.name === "consultation") || forms[0];

    if (!form) {
      return json(200, { count: 0, submissions: [] });
    }

    // Pull submissions for that form (most recent first, up to 100).
    const subsRes = await fetch(
      `${API}/forms/${form.id}/submissions?per_page=100`,
      auth
    );
    if (!subsRes.ok) {
      return json(502, {
        error: `Could not load submissions (${subsRes.status}).`,
      });
    }
    const raw = await subsRes.json();

    // Normalize into the shape the dashboard expects.
    const submissions = raw.map((s) => {
      const d = s.data || {};
      return {
        id: s.id,
        createdAt: s.created_at,
        fullName: d.fullName || s.name || "—",
        email: d.email || s.email || "",
        phone: d.phone || "",
        interestedService: d.interestedService || "",
        currentHairState: d.currentHairState || "",
        beautyGoals: d.beautyGoals || "",
        inspirationPhotos: d.inspirationPhotos || "",
        preferredDays: d.preferredDays || "",
        additionalNotes: d.additionalNotes || "",
      };
    });

    return json(200, { count: submissions.length, submissions });
  } catch (err) {
    return json(500, { error: "Unexpected error: " + err.message });
  }
};
