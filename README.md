# HK Invoice Capture App

AI-powered invoice capture for HK Group (5 outlets). Photo → AI reads → saves to log.

---

## Deploy to Vercel (Free) — 10 Minutes

### Step 1 — Get Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click "API Keys" → "Create Key"
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Upload to GitHub
1. Go to https://github.com and sign up (free)
2. Click "New repository" → name it `hk-invoice-app` → Create
3. Upload ALL files from this folder to the repository

### Step 3 — Deploy on Vercel
1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New Project"
3. Select your `hk-invoice-app` repository → Import
4. Click "Deploy" (leave all settings default)

### Step 4 — Add API Key
1. In Vercel dashboard → your project → Settings → Environment Variables
2. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from Step 1
3. Click Save → go to Deployments → Redeploy

### Step 5 — Done!
Your app is live at: `https://hk-invoice-app.vercel.app`

Bookmark it on your phone. Share the URL with Shella and Keong.

---

## How to Use

1. Open app URL on phone
2. Select outlet (HKP / HKK / HKBJ / GGC / GGU)
3. Tap upload → select WhatsApp invoice photo
4. Tap "Extract Invoice Data"
5. AI fills in: Supplier, Invoice No., Date, Items, Total
6. Edit any wrong fields → Confirm & Save
7. Monthly: Summary tab → Export CSV → send to accountant

---

## Cost
- Vercel hosting: FREE
- Anthropic API: ~RM0.05–0.15 per invoice scan (Haiku model)
- 200 invoices/month ≈ RM10–30/month total

## File Structure
```
hk-invoice-app/
├── api/
│   └── extract.js       ← AI extraction endpoint
├── public/
│   └── index.html       ← Mobile app UI
├── vercel.json          ← Routing config
├── package.json         ← Dependencies
└── README.md            ← This file
```
