# Brenna's Dashboard — Setup

The site has a private dashboard at **`/admin`** (e.g. `https://your-site.netlify.app/admin`)
where Brenna reads the consultation requests submitted through the booking form.

**How it works.** Data lives in a **Baserow** database (the "Schmitz Beauty Co." database,
in the `Leads` table). Two small serverless functions handle everything, and the secret
Baserow token never touches the browser:

- `netlify/functions/submission-created.js` runs automatically whenever the booking form
  is submitted, and copies the request into Baserow. (Your existing Netlify email
  notification still fires too — this just adds the dashboard copy.)
- `netlify/functions/leads.js` powers the dashboard: it lists the leads and saves status
  changes back to Baserow. Because status now lives in the database, changes **sync across
  every device** Brenna uses — phone and laptop both stay in step.

To turn it on, set **two environment variables** in Netlify
(**Site configuration → Environment variables → Add a variable**):

| Variable | What to put |
|---|---|
| `BASEROW_TOKEN` | The Baserow database token. In Baserow: **avatar → My settings → Database tokens → "Schmitz Dashboard" → reveal/copy**. Keep it secret. |
| `DASHBOARD_PASSWORD` | The password Brenna will type to open the dashboard. Pick anything. |

*(Optional: `BASEROW_LEADS_TABLE_ID` — only needed if the Leads table ID ever changes. Defaults to `1041326`.)*

After adding the variables, trigger a redeploy (**Deploys → Trigger deploy**). Then visit
`https://your-site.netlify.app/admin`, enter the password, and the requests
appear. The page is marked `noindex`, so search engines won't list it — but
**share the link only with Brenna**, since the password is the only thing protecting it.

> Brenna can also see and edit the raw data anytime by logging into Baserow directly —
> handy for the `Supplies` and `Expenses` tables, which are set up and ready for the next
> phases (inventory alerts and receipt/tax tracking).

**Tracking requests.** Each request has a status — **New → Contacted → Booked → Closed**.
Brenna sets it from the dropdown on each card, and the chips at the top filter by status
(plus a "New / Unhandled" counter). Statuses save to Baserow instantly and sync everywhere.

---

# Schmitz Beauty Co. — Setup Guide

> ⚠️ The steps below were written for the older Expo version of this project and mention
> files like `App.js` and the `npx expo export` build. The site is now plain HTML/CSS/JS
> (`index.html`, `book.html`, `admin.html`, `styles.css`, `script.js`), and
> `netlify.toml` already has the correct build command. The GitHub + Netlify workflow
> in Steps 1–4 still applies.

This folder is your app. It's built with **Expo**, which means the same code runs as
a **website** (for Netlify, so Brenna can see it) *and* later as a real **iPhone/Android app**.

You don't need to know how to code to get it online. Just follow the steps below in order.

---

## Step 0 — Put all the files in one folder

Make a new folder on your computer called `schmitz-beauty-co` and put ALL of these
files inside it:

- `App.js` ............ the whole app (every screen, all the styling)
- `package.json` ...... the list of building blocks the app needs
- `app.json` .......... the app's name and settings
- `babel.config.js` ... a build helper (don't touch it)
- `netlify.toml` ...... tells Netlify how to put the site online
- `.gitignore` ........ ⚠️ this one arrives named `gitignore.txt` — **rename it to `.gitignore`** (a dot in front, no `.txt`)
- `README.md` ......... this guide

> Tip: to rename to `.gitignore` on Windows, right-click → Rename, type `.gitignore`,
> press Enter. If Windows complains, that's fine — confirm the change.

---

## Step 1 — Create a free GitHub account

GitHub is where your code lives online. Netlify reads from it.

1. Go to https://github.com and click **Sign up** (skip if you already have an account).
2. Once logged in, click the **+** in the top-right → **New repository**.
3. Repository name: `schmitz-beauty-co`
4. Leave it **Public** (or Private — both work), and click **Create repository**.

---

## Step 2 — Upload your files to GitHub

On the new empty repository page:

1. Click the link **"uploading an existing file"** (it's in the text on the page).
2. Drag the **contents** of your `schmitz-beauty-co` folder into the box
   (all the files — not the folder itself).
3. Scroll down and click **Commit changes**.

That's it — your code is now on GitHub. No software to install.

---

## Step 3 — Connect Netlify (this puts it online)

1. Go to https://app.netlify.com and **Sign up / Log in with GitHub**.
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub**, then pick your `schmitz-beauty-co` repository.
4. Netlify reads the `netlify.toml` file automatically, so the build settings are
   already filled in:
   - Build command: `npx expo export --platform web`
   - Publish directory: `dist`
5. Click **Deploy**.

Netlify will spend 1–3 minutes building. When it's done you'll get a live link like
`https://something-random.netlify.app` — that's the link you send Brenna.

> Want a nicer link? In Netlify go to **Site configuration → Change site name**
> and set something like `schmitz-beauty-co`, giving you
> `https://schmitz-beauty-co.netlify.app`.

---

## Step 4 — Updating the site as it grows

Because Netlify is connected to GitHub, **any change you push to GitHub goes live
automatically** in a couple of minutes. To update:

1. In your GitHub repository, open the file you want to change (usually `App.js`).
2. Click the pencil ✏️ icon, paste the new version, click **Commit changes**.
3. Netlify rebuilds and the live site updates on its own. Refresh the page to see it.

(When I send you updated code, you'll just replace `App.js` this way.