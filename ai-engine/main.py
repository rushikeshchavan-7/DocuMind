"""
DocuMind AI Engine - Document Intelligence Service
Powered by LangChain + ChromaDB + Ollama/Groq for secure AI processing
"""

# Apply Python 3.14 compatibility patch before any other imports
import app.core.compat  # noqa: F401

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.core.config import settings

app = FastAPI(
    title="DocuMind AI Engine",
    description="AI-Powered Document Intelligence - RAG Pipeline with ChromaDB",
    version="1.0.0",
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "service": "DocuMind AI Engine",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "DocuMind AI",
        "llm_provider": settings.LLM_PROVIDER,
        "model": settings.GROQ_MODEL if settings.LLM_PROVIDER == "groq" else settings.OLLAMA_MODEL,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=True)
