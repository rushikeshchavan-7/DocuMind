from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Provider selection: "ollama" for local, "groq" for cloud
    LLM_PROVIDER: str = "ollama"
    EMBED_PROVIDER: str = "ollama"  # "ollama" or "default" (chromadb built-in)

    # Ollama settings (local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"

    # Groq settings (cloud - free tier)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    UPLOAD_DIR: str = "./data/uploads"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100
    MAX_CONTEXT_DOCS: int = 3

    # CORS origins (comma-separated)
    CORS_ORIGINS: str = "http://localhost:4200,http://localhost:5000"

    class Config:
        env_file = ".env"


settings = Settings()
