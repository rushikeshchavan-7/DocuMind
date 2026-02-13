import os
import logging

# Apply Python 3.14 compatibility patch BEFORE importing chromadb
import app.core.compat  # noqa: F401

import chromadb
from langchain_core.prompts import PromptTemplate
from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_llm():
    """Build LLM based on provider setting."""
    if settings.LLM_PROVIDER == "groq":
        from langchain_groq import ChatGroq
        logger.info("Using Groq LLM: %s", settings.GROQ_MODEL)
        return ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
            temperature=0.3,
            max_tokens=300,
        )
    else:
        from langchain_ollama import OllamaLLM
        logger.info("Using Ollama LLM: %s", settings.OLLAMA_MODEL)
        return OllamaLLM(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0.3,
            num_predict=200,
            num_ctx=1024,
        )


def _build_embeddings():
    """Build embeddings based on provider setting."""
    if settings.EMBED_PROVIDER == "default":
        # Use ChromaDB's built-in default embedding (all-MiniLM-L6-v2 via ONNX)
        # No external API needed — lightweight and free
        logger.info("Using ChromaDB default embeddings (all-MiniLM-L6-v2)")
        return None  # Signal to use ChromaDB's built-in
    else:
        from langchain_ollama import OllamaEmbeddings
        logger.info("Using Ollama embeddings: %s", settings.OLLAMA_EMBED_MODEL)
        return OllamaEmbeddings(
            model=settings.OLLAMA_EMBED_MODEL, base_url=settings.OLLAMA_BASE_URL
        )


class RAGService:
    """RAG service using ChromaDB for secure document Q&A.

    Supports two modes:
    - LOCAL: Ollama LLM + Ollama Embeddings (data never leaves machine)
    - CLOUD: Groq LLM + ChromaDB default embeddings (free deployment)
    """

    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.embeddings = _build_embeddings()
        self.use_builtin_embed = self.embeddings is None
        self.llm = _build_llm()
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are DocuMind AI, a RAG-based document intelligence assistant. Your ONLY knowledge source is the document context provided below. You must NOT use any outside knowledge.

Rules:
- Answer ONLY using information found in the document context below.
- If the answer is not in the context, say "This information is not available in the document."
- Be concise, accurate, and professional.
- Quote or reference specific parts of the document when possible.

Document Context:
{context}

User Question: {question}

Answer:""",
        )

    def _get_collection(self, document_id: str):
        """Get or create a ChromaDB collection for a document."""
        collection_name = f"doc_{document_id.replace('-', '_')[:50]}"
        return self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"document_id": document_id, "hnsw:space": "cosine"},
        )

    async def index_document(self, document_id: str, chunks: list[str]):
        """Index document chunks into ChromaDB."""
        collection = self._get_collection(document_id)

        ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "chunk_index": i}
            for i in range(len(chunks))
        ]

        if self.use_builtin_embed:
            # Let ChromaDB generate embeddings with its built-in model
            collection.add(ids=ids, documents=chunks, metadatas=metadatas)
        else:
            # Generate embeddings via Ollama
            embeddings = []
            for chunk in chunks:
                embedding = self.embeddings.embed_query(chunk)
                embeddings.append(embedding)
            collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)

    async def query(self, document_id: str, question: str) -> dict:
        """Query a document using RAG pipeline."""
        collection = self._get_collection(document_id)

        if collection.count() == 0:
            return {
                "answer": "No relevant information found in the document.",
                "sources": [],
            }

        # Retrieve relevant chunks
        n = min(settings.MAX_CONTEXT_DOCS, collection.count())
        if self.use_builtin_embed:
            results = collection.query(
                query_texts=[question], n_results=n,
                include=["documents", "metadatas", "distances"],
            )
        else:
            question_embedding = self.embeddings.embed_query(question)
            results = collection.query(
                query_embeddings=[question_embedding], n_results=n,
                include=["documents", "metadatas", "distances"],
            )

        if not results["documents"] or not results["documents"][0]:
            return {
                "answer": "No relevant information found in the document.",
                "sources": [],
            }

        context_chunks = results["documents"][0]
        context = "\n\n---\n\n".join(context_chunks)

        # Generate answer
        prompt = self.prompt_template.format(context=context, question=question)
        raw = self.llm.invoke(prompt)
        # ChatGroq returns AIMessage, OllamaLLM returns str
        answer = raw.content if hasattr(raw, "content") else str(raw)

        # Build source references
        sources = []
        distances = results.get("distances", [[]])[0]
        for i, chunk in enumerate(context_chunks):
            score = round((1 - distances[i]) * 100, 1) if i < len(distances) else 0
            sources.append(f"[{score}% match] {chunk[:120]}...")

        return {"answer": answer, "sources": sources}

    def is_document_indexed(self, document_id: str) -> bool:
        try:
            collection = self._get_collection(document_id)
            return collection.count() > 0
        except Exception:
            return False

    def delete_document(self, document_id: str):
        collection_name = f"doc_{document_id.replace('-', '_')[:50]}"
        try:
            self.chroma_client.delete_collection(collection_name)
        except Exception:
            pass

    async def search_all(self, question: str, top_k: int = 10) -> list[dict]:
        """Search across ALL document collections — Smart Search."""
        if self.use_builtin_embed:
            query_args = {"query_texts": [question]}
        else:
            question_embedding = self.embeddings.embed_query(question)
            query_args = {"query_embeddings": [question_embedding]}

        all_results = []
        for col in self.chroma_client.list_collections():
            try:
                collection = self.chroma_client.get_collection(col.name)
                if collection.count() == 0:
                    continue
                results = collection.query(
                    **query_args,
                    n_results=min(3, collection.count()),
                    include=["documents", "metadatas", "distances"],
                )
                doc_id = col.metadata.get("document_id", "") if col.metadata else ""
                if not doc_id:
                    raw = col.name.replace("doc_", "", 1)
                    parts = raw.split("_")
                    if len(parts) >= 5:
                        doc_id = "-".join([parts[0], parts[1], parts[2], parts[3], "_".join(parts[4:])])
                    else:
                        doc_id = raw

                for i, doc_text in enumerate(results["documents"][0]):
                    distance = results["distances"][0][i] if results["distances"] else 1.0
                    score = round((1 - distance) * 100, 1)
                    all_results.append({
                        "document_id": doc_id,
                        "snippet": doc_text[:300],
                        "score": score,
                    })
            except Exception:
                continue

        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_k]
