# Tools Manifest

Master index of deterministic tools used by this system.

- `tools/memory/memory_read.py` - Loads persistent memory context from `memory/MEMORY.md`, daily logs, and optional DB entries.
- `tools/memory/memory_write.py` - Appends events/facts to daily logs and SQLite memory storage, with optional `MEMORY.md` section updates.
- `tools/memory/memory_db.py` - Manages memory SQLite CRUD, search, stats, and daily log sync operations.
- `tools/memory/embed_memory.py` - Generates and stores vector embeddings for memory entries.
- `tools/memory/semantic_search.py` - Performs cosine-similarity semantic search across embedded memory entries.
- `tools/memory/hybrid_search.py` - Combines BM25-style keyword search with semantic search for ranked retrieval.
