from sqlalchemy import JSON
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator, TypeEngine


class EmbeddingType(TypeDecorator[list[float]]):
    impl = JSON
    cache_ok = True

    def __init__(self, dimensions: int) -> None:
        super().__init__()
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect: Dialect) -> TypeEngine[object]:
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector

            return dialect.type_descriptor(Vector(self.dimensions))
        return dialect.type_descriptor(JSON())

    def process_bind_param(  # noqa: ARG002
        self, value: list[float] | None, dialect: Dialect
    ) -> object | None:
        if value is None:
            return None
        return [float(x) for x in value]

    def process_result_value(
        self, value: list[float] | None, dialect: Dialect
    ) -> list[float] | None:  # noqa: ARG002
        if value is None:
            return None
        return [float(x) for x in value]
