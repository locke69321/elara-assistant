from math import floor

from app.domain.dtos import (
    MemoryDocumentData,
    MemoryIngestData,
    MemorySearchResultData,
)
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository, cosine_similarity


def split_chunks(content: str, chunk_size: int = 300) -> list[str]:
    cleaned = content.strip()
    if not cleaned:
        return []
    chunks: list[str] = []
    for i in range(0, len(cleaned), chunk_size):
        chunks.append(cleaned[i : i + chunk_size])
    return chunks


def deterministic_embedding(text: str, dimensions: int) -> list[float]:
    values = [0.0 for _ in range(dimensions)]
    if not text:
        return values
    for idx, char in enumerate(text):
        bucket = idx % dimensions
        values[bucket] += (ord(char) % 97) / 100.0
    normalizer = max(1, floor(len(text) / dimensions))
    return [value / normalizer for value in values]


class MemoryService:
    def __init__(self, repo: SqlAlchemyRepository, vector_dimensions: int) -> None:
        self.repo = repo
        self.vector_dimensions = vector_dimensions

    def ingest_document(self, title: str, content: str, source_ref: str) -> MemoryIngestData:
        doc = self.repo.create_memory_document(title=title, content=content, source_ref=source_ref)
        chunks = split_chunks(content)
        for idx, chunk in enumerate(chunks):
            embedding = deterministic_embedding(chunk, self.vector_dimensions)
            self.repo.add_memory_chunk(
                document_id=doc.id, content=chunk, chunk_index=idx, embedding=embedding
            )
        return {"id": doc.id, "title": doc.title, "chunkCount": len(chunks)}

    def search(self, query: str, limit: int = 5) -> list[MemorySearchResultData]:
        query_embedding = deterministic_embedding(query, self.vector_dimensions)
        scored: list[MemorySearchResultData] = []
        for entry, chunk, doc in self.repo.list_memory_embeddings():
            score = cosine_similarity(query_embedding, entry.embedding)
            scored.append(
                {
                    "chunkId": chunk.id,
                    "documentId": doc.id,
                    "score": score,
                    "snippet": chunk.content[:180],
                    "sourceRef": doc.source_ref,
                }
            )

        scored.sort(key=lambda item: item["score"], reverse=True)
        return scored[:limit]

    def get_document(self, document_id: str) -> MemoryDocumentData | None:
        doc = self.repo.get_memory_document(document_id)
        if doc is None:
            return None
        return {
            "id": doc.id,
            "title": doc.title,
            "content": doc.content,
            "sourceRef": doc.source_ref,
            "createdAt": doc.created_at.isoformat(),
        }
