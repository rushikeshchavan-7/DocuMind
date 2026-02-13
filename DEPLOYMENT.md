# DocuMind - Free Deployment Guide

## Architecture (Cloud)

```
[Netlify]          [Render.com]           [Render.com]        [Neon.tech]
 Angular    --->    .NET API     --->    Python AI Engine     PostgreSQL
 Frontend           Backend              Groq LLM + ChromaDB   Database
```

**Total Cost: $0/month**

---

## Step 1: Get Free Accounts

1. **Groq** (Free AI API) → https://console.groq.com
   - Sign up → Create API Key → Copy `gsk_...`
   - Free: 30 requests/minute with llama-3.3-70b

2. **Neon.tech** (Free PostgreSQL) → https://neon.tech
   - Sign up → Create Project → Copy connection string
   - Format: `Host=ep-xxx.region.neon.tech;Port=5432;Database=neondb;Username=user;Password=pass;SslMode=Require`

3. **Render.com** (Free backend hosting) → https://render.com
   - Sign up with GitHub

4. **Netlify** (Free frontend hosting) → https://netlify.com
   - Sign up with GitHub

---

## Step 2: Push Code to GitHub

```bash
cd d:\RUSHI-Morningstar\ERP
git init
git add .
git commit -m "DocuMind - AI Document Intelligence Platform"
git remote add origin https://github.com/YOUR_USERNAME/DocuMind.git
git push -u origin main
```

---

## Step 3: Deploy PostgreSQL (Neon.tech)

1. Go to https://console.neon.tech
2. Create a new project: `documind`
3. Copy the connection string from the dashboard
4. The database tables will be auto-created by the .NET backend on first start

---

## Step 4: Deploy AI Engine (Render.com)

1. Go to https://dashboard.render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `documind-ai`
   - **Root Directory**: `ai-engine`
   - **Runtime**: Docker
   - **Plan**: Free
4. Environment Variables:
   - `LLM_PROVIDER` = `groq`
   - `EMBED_PROVIDER` = `default`
   - `GROQ_API_KEY` = `gsk_your_key_here`
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `CORS_ORIGINS` = `https://documind.netlify.app,https://documind-api.onrender.com`
5. Deploy! Wait for it to go live → Note the URL (e.g. `https://documind-ai.onrender.com`)

---

## Step 5: Deploy .NET Backend (Render.com)

1. Go to Render → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `documind-api`
   - **Root Directory**: `server`
   - **Runtime**: Docker
   - **Plan**: Free
4. Environment Variables:
   - `ConnectionStrings__DefaultConnection` = Your Neon.tech connection string + `;SslMode=Require`
   - `Jwt__Secret` = `any-random-64-character-string-here-make-it-long-and-unique!!!`
   - `Security__EncryptionKey` = `another-random-string-for-encryption!!!`
   - `AiEngine__BaseUrl` = `https://documind-ai.onrender.com`
   - `ASPNETCORE_ENVIRONMENT` = `Production`
   - `ASPNETCORE_URLS` = `http://+:8080`
5. Deploy!

---

## Step 6: Deploy Frontend (Netlify)

1. Go to https://app.netlify.com → Add new site → Import from Git
2. Connect your GitHub repo
3. Settings:
   - **Base directory**: `client/documind-client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/documind-client/dist/documind-client/browser`
4. Before deploying, update `environment.prod.ts` with your actual Render URLs:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://documind-api.onrender.com/api',
     aiEngineUrl: 'https://documind-ai.onrender.com/api',
   };
   ```
5. Deploy! Site will be live at `https://your-site.netlify.app`
6. (Optional) Change site name in Netlify settings to `documind`

---

## Step 7: Update CORS

After deployment, update these if your URLs are different:

- **Render AI Engine** → `CORS_ORIGINS` env var: add your Netlify URL
- **.NET Program.cs** → `WithOrigins(...)`: add your Netlify URL

---

## Notes

- **Free tier limitations**: Render services sleep after 15 min of inactivity. First request after sleep takes ~30s to wake up.
- **Groq free tier**: 30 requests/minute, 14,400/day. More than enough for a portfolio demo.
- **Neon.tech free tier**: 512MB storage, always-on.
- **Data**: Documents are encrypted at rest (AES-256). On cloud, embeddings are generated server-side (never sent to Groq). Only question + context snippets are sent to Groq for answer generation.

---

## Local Development (unchanged)

```bash
# Terminal 1: PostgreSQL (already running)
# Terminal 2: AI Engine
cd ai-engine && python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 3: .NET Backend
cd server && dotnet run --project DocuMind.API --urls "http://localhost:5000"

# Terminal 4: Angular Frontend
cd client/documind-client && ng serve
```

Local uses Ollama (data never leaves your machine).
Cloud uses Groq API (only question context is sent, not full documents).
