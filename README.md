# DocuMind — AI Document Intelligence Platform

<div align="center">

**Upload. Analyze. Chat.**

An enterprise-grade document intelligence platform powered by **LangChain**, **Ollama**, and **RAG** (Retrieval Augmented Generation). Your data never leaves your machine.

Built with **.NET 10** | **Angular 21** | **Python FastAPI** | **PostgreSQL** | **ChromaDB**

</div>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Angular 21 Frontend                       │
│            Dark Theme · Standalone Components               │
│               Deployed on Netlify/Cloudflare                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / JWT
┌────────────────────────▼────────────────────────────────────┐
│                .NET 10 Web API (C#)                         │
│          Clean Architecture · CQRS-ready                    │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐              │
│   │   Auth    │  │ Document │  │  Dashboard │              │
│   │  Module   │  │  Module  │  │   Module   │              │
│   └──────────┘  └──────────┘  └────────────┘              │
│   JWT + BCrypt   AES-256 Enc   Aggregation                 │
│   Rate Limiting  File Storage                               │
└────────────────────────┬────────────────────────────────────┘
                         │ Internal HTTP
┌────────────────────────▼────────────────────────────────────┐
│            Python FastAPI — AI Engine                        │
│   ┌───────────┐  ┌──────────┐  ┌──────────────┐           │
│   │ LangChain │  │ ChromaDB │  │    Ollama    │           │
│   │    RAG    │  │  Vector  │  │  Local LLM   │           │
│   │ Pipeline  │  │   Store  │  │  (llama3.2)  │           │
│   └───────────┘  └──────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              PostgreSQL 16 · Neon (Free)                     │
│           User data · Documents · Chat history              │
└─────────────────────────────────────────────────────────────┘
```

## Security Features

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT + BCrypt (12 rounds) |
| Document Encryption | AES-256 at rest |
| Data Privacy | Ollama local LLM — data never leaves your machine |
| Rate Limiting | 100 req/min per user |
| CORS | Whitelisted origins only |
| Input Validation | Server-side validation on all endpoints |
| Audit Logging | All actions tracked with IP + timestamp |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular + TypeScript | 21.x |
| UI Framework | Angular Material | Latest |
| Backend API | .NET Core (C#) | 10.x |
| ORM | Entity Framework Core | 10.x |
| AI Framework | LangChain + LangGraph | Latest |
| Local LLM | Ollama (llama3.2) | Latest |
| Vector Store | ChromaDB | Latest |
| Database | PostgreSQL | 16 |
| AI Service | Python FastAPI | Latest |
| Containerization | Docker Compose | 3.9 |

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Python 3.12+](https://python.org/)
- [Ollama](https://ollama.ai/) — Install and run locally
- [PostgreSQL 16](https://postgresql.org/) or use Docker
- [Docker](https://docker.com/) (optional, for containerized setup)

### Option 1: Docker (Recommended)

```bash
# Clone and navigate
cd docker

# Start all services
docker-compose up -d

# Pull the Ollama model (first time only)
docker exec -it documind-ollama ollama pull llama3.2

# Access the app
# Frontend:  http://localhost:4200
# Backend:   http://localhost:5000/swagger
# AI Engine: http://localhost:8000/health
```

### Option 2: Local Development

**1. Start PostgreSQL** (or use Docker for just the database):
```bash
docker run -d --name documind-db -e POSTGRES_DB=documind -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
```

**2. Start Ollama:**
```bash
ollama serve
ollama pull llama3.2
```

**3. Start the .NET Backend:**
```bash
cd server/DocuMind.API
dotnet ef database update  # Run migrations
dotnet run
# API runs on http://localhost:5000
```

**4. Start the Python AI Engine:**
```bash
cd ai-engine
pip install -r requirements.txt
python main.py
# AI Engine runs on http://localhost:8000
```

**5. Start the Angular Frontend:**
```bash
cd client/documind-client
npm install
ng serve
# Frontend runs on http://localhost:4200
```

## Free Hosting Deployment

| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend | Netlify / Cloudflare Pages | Unlimited static sites |
| Backend | Render / Azure Free | 750 hrs/month |
| AI Engine | Render / Railway | 750 hrs/month |
| Database | Neon / Supabase | 0.5 GB free PostgreSQL |

### Deploy Frontend to Netlify

```bash
cd client/documind-client
ng build --configuration=production
# Upload dist/documind-client/browser to Netlify
```

## Project Structure

```
DocuMind/
├── client/                          # Angular 21 Frontend
│   └── documind-client/
│       └── src/
│           ├── app/
│           │   ├── core/            # Auth, guards, interceptors
│           │   ├── shared/          # Sidebar, layouts
│           │   └── features/        # Auth, Dashboard, Documents, Chat
│           ├── environments/
│           └── styles.scss          # Global design system
│
├── server/                          # .NET 10 Backend
│   ├── DocuMind.API/                # Controllers, Program.cs
│   ├── DocuMind.Application/        # DTOs, Interfaces
│   ├── DocuMind.Domain/             # Entities, Repository interfaces
│   ├── DocuMind.Infrastructure/     # EF Core, Services, Security
│   └── DocuMind.sln
│
├── ai-engine/                       # Python AI Service
│   ├── app/
│   │   ├── api/routes.py            # FastAPI endpoints
│   │   ├── core/config.py           # Settings
│   │   └── services/
│   │       ├── document_processor.py # PDF/DOCX/TXT extraction
│   │       └── rag_service.py       # ChromaDB + Ollama RAG
│   ├── main.py
│   └── requirements.txt
│
├── docker/                          # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.ai-engine
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── .gitignore
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List user documents |
| GET | `/api/documents/:id` | Get document detail |
| POST | `/api/documents/upload` | Upload document (PDF/TXT/DOCX) |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/:id/download` | Download original file |

### Chat (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Ask a question about a document |
| GET | `/api/chat/:documentId/history` | Get chat history |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard statistics |

## Author

**Rushikesh Chavan**
- Portfolio: [rushikesh-chavan-portfolio.netlify.app](https://rushikesh-chavan-portfolio.netlify.app/)
- GitHub: [rushikeshchavan-7](https://github.com/rushikeshchavan-7)
- LinkedIn: [rushikesh-chavan](https://www.linkedin.com/in/rushikesh-chavan-275282211/)

---

<div align="center">
Built with precision · Secured by design · Powered by AI
</div>
