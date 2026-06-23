# Automated emails — setup + front-end contract

Two branded emails (bees background, logo, Abril Fatface) send from
**scheduling@schmitzbeautyco.com**, with **Reply-To brennaschmitz2021@gmail.com**
so client replies land in Brenna's inbox. Templates live in `emails/`.

## What's built (backend, staged locally — not pushed)

1. **Thank-you** — `netlify/functions/submission-created.js` sends it automatically to
   the client right after the consultation form is submitted. No front-end work needed.
2. **Appointment confirmed** — `netlify/functions/leads.js` sends it when Brenna books a
   lead (see contract below). The date/time she enters fills the "When" line, and an
   `Appointment` field was added to the Baserow Leads table to store it.

Both use Resend. Until `RESEND_API_KEY` is set the email step skips quietly — saving
the lead and updating status still work.

## To turn the emails on

1. Wait for the Resend domain `schmitzbeautyco.com` to show **Verified** (DNS records are
   already in Netlify; it verifies automatically).
2. Resend → **API keys** → create a key.
3. Netlify → Environment variables → add **`RESEND_API_KEY`** (mark it secret) = that key.
4. Deploy.

## Front-end contract — the "Booked" step (yours to wire)

When Brenna marks a lead **Booked**, show a **date & time** input, then PATCH the leads
function with `sendConfirmation: true` to fire the appointment email:

```js
fetch("/.netlify/functions/leads", {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "x-dashboard-key": <password> },
  body: JSON.stringify({
    id: leadId,
    status: "booked",
    appointment: "Saturday, July 12 · 2:00 PM",  // free text she types
    sendConfirmation: true                         // omit/false = save without emailing
  })
});
```

- `appointment` is free text — whatever Brenna types (date + time).
- The email only sends when `sendConfirmation: true` **and** the lead has an email +
  appointment, so editing a booked lead later never re-sends.
- The response includes `emailed: true/false` so the UI can confirm it went out.
