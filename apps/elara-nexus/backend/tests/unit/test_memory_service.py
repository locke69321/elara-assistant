import pytest

from app.services.memory_service import deterministic_embedding, split_chunks


@pytest.mark.unit
def test_split_chunks() -> None:
    chunks = split_chunks("a" * 620, chunk_size=300)
    assert len(chunks) == 3
    assert len(chunks[0]) == 300


@pytest.mark.unit
def test_deterministic_embedding_shape() -> None:
    vec = deterministic_embedding("hello world", dimensions=8)
    assert len(vec) == 8
    assert all(isinstance(value, float) for value in vec)


@pytest.mark.unit
def test_split_chunks_empty_input() -> None:
    assert split_chunks("   ") == []


@pytest.mark.unit
def test_deterministic_embedding_empty_text() -> None:
    vec = deterministic_embedding("", dimensions=8)
    assert vec == [0.0] * 8
