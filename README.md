# DocuMind

RAG-based document intelligence platform. Upload documents, ask questions, get answers sourced directly from the content.

**Live:** [documind-rag.netlify.app](https://documind-rag.netlify.app)

---

## What it does

- Upload PDF, DOCX, PPTX, XLSX, TXT files
- AI extracts and indexes content using vector embeddings (ChromaDB)
- Chat with any document -- answers come strictly from the document, not general knowledge
- Dashboard with document analytics, activity charts, file type breakdown
- Multiple chat sessions per document with full history
- AES-256 encryption for stored files
- JWT auth, rate limiting, CORS

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Angular 21, TypeScript, SCSS |
| Backend API | .NET 10, C#, Clean Architecture, EF Core |
| AI Engine | Python, FastAPI, LangChain, ChromaDB |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Database | PostgreSQL (Neon.tech) |
| Hosting | Netlify (frontend), Hugging Face Spaces (backend + AI) |

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
│   ├── src/app/features/      # Pages: auth, dashboard, documents, chat
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
python -m uvicorn main:app --reload --port 7860
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

The app runs entirely on free tiers:
- **Frontend** on Netlify (auto-deploys from GitHub)
- **Backend + AI Engine** on Hugging Face Spaces (Docker)
- **Database** on Neon.tech (serverless PostgreSQL)

ChromaDB data is ephemeral on HF Spaces free tier -- documents need re-indexing after a server restart (there's a re-index button for this).

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
GET    /api/dashboard
GET    /api/dashboard/analytics
```

---

Built by [Rushikesh Chavan](https://rushikesh-chavan-portfolio.netlify.app/)
