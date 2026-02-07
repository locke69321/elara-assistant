# Memory Tools

Deterministic memory helpers for session context, logging, storage, and retrieval.

## Scripts

- `memory_read.py`: read `memory/MEMORY.md`, recent logs, and optional DB context
- `memory_write.py`: append to daily logs and write structured entries
- `memory_db.py`: CRUD/search/stats over `data/memory.db`
- `embed_memory.py`: generate/store embeddings for entries
- `semantic_search.py`: vector similarity search
- `hybrid_search.py`: keyword + semantic ranked search

## Notes

- Paths are rooted to this repository (`memory/` and `data/`).
- Embedding and semantic scripts require API credentials when provider calls are enabled.
