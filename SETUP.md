# GTD App — Setup Guide
## Takes about 15 minutes. No coding required.

---

## Step 1 — Create your Supabase database (5 mins)

1. Go to **supabase.com** and sign up (free)
2. Click **New Project** → give it a name (e.g. "gtd") → set a password → Create
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** (left sidebar) → **New Query**
5. Open the file `supabase-schema.sql` from this folder
6. Copy the entire contents and paste into the SQL Editor → click **Run**
7. Go to **Settings → API** (left sidebar)
8. Copy your **Project URL** and **anon public** key — you'll need these in Step 3

---

## Step 2 — Deploy to Vercel (5 mins)

1. Go to **github.com** and create a free account if you don't have one
2. Create a **New Repository** → name it "gtd-app" → Public → Create
3. Upload all the files from this folder to the repository
   - Easiest: drag the entire folder into the GitHub web interface
4. Go to **vercel.com** → sign up with GitHub → **New Project**
5. Import your "gtd-app" repository → click **Deploy**
   - Don't add environment variables yet — do that in Step 3

---

## Step 3 — Connect Supabase to Vercel (2 mins)

1. In Vercel, go to your project → **Settings → Environment Variables**
2. Add these two variables:
   - Name: `REACT_APP_SUPABASE_URL` → Value: your Supabase Project URL
   - Name: `REACT_APP_SUPABASE_ANON_KEY` → Value: your Supabase anon key
3. Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**

---

## Step 4 — Open your app

Your app is now live at `https://gtd-app-[your-name].vercel.app`

- Bookmark it on desktop
- On iPhone: open in Safari → Share → **Add to Home Screen** → it'll open like a native app
- On Android: open in Chrome → three dots → **Add to Home Screen**

---

## That's it.

Your data now syncs across every device instantly.
Your four projects (Job Search, Calibre, NYC Marathon, Life/Admin) will appear automatically on first load.

---

## Troubleshooting

**"Could not connect to database"** → Check your environment variables in Vercel are correct and you redeployed after adding them.

**Projects not appearing** → Open browser console (F12), check for errors. Most likely an env var issue.

**Want a custom domain?** → Vercel Settings → Domains → add any domain you own for free.
