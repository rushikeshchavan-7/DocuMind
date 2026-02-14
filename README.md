# DocuMind

RAG-based document intelligence platform. Upload documents, ask questions, get answers sourced directly from the content.

**Live demo:** [documind-rag.netlify.app](https://documind-rag.netlify.app)

---

## What it does

- Upload PDF, DOCX, PPTX, XLSX, TXT files
- AI extracts and indexes the content using vector embeddings (ChromaDB)
- Chat with any document -- answers come strictly from the document, not general knowledge
- Smart search across all uploaded documents
- Analytics dashboard with usage stats
- Multiple chat sessions per document
- AES-256 encryption for stored files

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 21, TypeScript, SCSS |
| Backend API | .NET 10, C#, Clean Architecture, EF Core |
| AI Engine | Python, FastAPI, LangChain, ChromaDB |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Database | PostgreSQL (Neon.tech) |
| Hosting | Netlify (frontend), Render (backend + AI) |

## Architecture

```
Angular SPA  -->  .NET API  -->  PostgreSQL (Neon.tech)
                    |
                    +--->  Python AI Engine
                              |
                              +---> ChromaDB (vector store)
                              +---> Groq API (LLM)
```

The .NET backend handles auth, file storage, and orchestration. The Python AI engine handles document processing (text extraction, chunking, embedding) and RAG queries. They communicate over HTTP.

## Project structure

```
├── client/documind-client/    # Angular frontend
│   ├── src/app/features/      # Pages: auth, dashboard, documents, chat, search, analytics
│   ├── src/app/core/          # Services, guards, interceptors
│   └── src/environments/      # Environment configs
│
├── server/                    # .NET backend
│   ├── DocuMind.API/          # Controllers, Program.cs
│   ├── DocuMind.Application/  # DTOs, interfaces
│   ├── DocuMind.Domain/       # Entities
│   └── DocuMind.Infrastructure/ # EF Core, services, repos
│
├── ai-engine/                 # Python AI service
│   ├── app/api/routes.py      # FastAPI endpoints
│   ├── app/services/          # RAG service, document processor
│   └── app/core/              # Config, compatibility patches
│
└── docker/                    # Docker Compose setup
```

## Running locally

**Prerequisites:** Node.js 20+, .NET 10 SDK, Python 3.12+, PostgreSQL

### 1. Database

Create a PostgreSQL database called `documind`. The backend auto-creates tables on startup.

### 2. AI Engine

```bash
cd ai-engine
pip install -r requirements.txt
```

Create `.env`:
```
LLM_PROVIDER=groq
EMBED_PROVIDER=default
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:4200,http://localhost:5000
```

```bash
python -m uvicorn main:app --reload --port 8000
```

### 3. Backend

```bash
cd server
dotnet run --project DocuMind.API
```

Update `appsettings.Development.json` with your DB connection string if needed.

### 4. Frontend

```bash
cd client/documind-client
npm install
ng serve
```

Open `http://localhost:4200`

## Deployment

The app runs on free tiers:
- **Frontend** on Netlify (auto-deploys from GitHub)
- **Backend + AI Engine** on Render (Docker, auto-deploys)
- **Database** on Neon.tech (serverless PostgreSQL)

Note: Render free tier spins down after 15 min of inactivity. First request after that takes ~30s. ChromaDB data is ephemeral on free tier -- documents need re-indexing after a cold start (there's a re-index button for this).

## API endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/reprocess
GET    /api/documents/:id/download
POST   /api/chat
GET    /api/chat/sessions/:documentId
POST   /api/chat/sessions
DELETE /api/chat/sessions/:sessionId
GET    /api/chat/:sessionId/history
POST   /api/search
GET    /api/dashboard
GET    /api/dashboard/analytics
```

## Screenshots

The UI uses a dark theme with glass-morphism cards. Key pages:
- Auth (login/register with animated background)
- Dashboard (stats, recent documents)
- Documents (upload, grid view, file type badges)
- Chat (sessions sidebar, message history, suggestion chips)
- Smart Search (semantic search across all docs)
- Analytics (donut charts, activity bars, session table)

---

Built by [Rushikesh Chavan](https://rushikesh-chavan-portfolio.netlify.app/)
