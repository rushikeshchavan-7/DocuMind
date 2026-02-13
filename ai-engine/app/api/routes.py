import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.services.document_processor import DocumentProcessor
from app.services.rag_service import RAGService
from app.core.config import settings

router = APIRouter()
doc_processor = DocumentProcessor()
rag_service = RAGService()


class ChatRequest(BaseModel):
    document_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


class ProcessResponse(BaseModel):
    document_id: str
    status: str
    pages: int
    chunks: int


@router.post("/documents/process", response_model=ProcessResponse)
async def process_document(
    document_id: str = Form(...),
    file_name: str = Form(...),
    file: UploadFile = File(...),
):
    """Process a document: extract text, chunk it, and store embeddings."""
    try:
        # Save uploaded file temporarily
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}_{file_name}")

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Process document
        result = await doc_processor.process(document_id, file_path, file_name)

        # Index into vector store
        await rag_service.index_document(document_id, result["chunks"])

        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

        return ProcessResponse(
            document_id=document_id,
            status="ready",
            pages=result["pages"],
            chunks=len(result["chunks"]),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """Chat with a document using RAG pipeline."""
    try:
        result = await rag_service.query(request.document_id, request.question)
        return ChatResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/documents/{document_id}/status")
async def get_document_status(document_id: str):
    """Check if a document has been indexed."""
    is_indexed = rag_service.is_document_indexed(document_id)
    return {"document_id": document_id, "indexed": is_indexed}


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10


class SearchResult(BaseModel):
    document_id: str
    snippet: str
    score: float


@router.post("/search", response_model=list[SearchResult])
async def smart_search(request: SearchRequest):
    """Search across ALL indexed documents using vector similarity."""
    try:
        results = await rag_service.search_all(request.query, request.top_k)
        return [SearchResult(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Remove a document from the vector store."""
    try:
        rag_service.delete_document(document_id)
        return {"status": "deleted", "document_id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")
