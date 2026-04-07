import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ComparisonStatus(str, enum.Enum):
    pending_review = "pending_review"
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    old_plan_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    new_plan_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    old_plan_text: Mapped[str] = mapped_column(Text, nullable=False)
    new_plan_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ComparisonStatus] = mapped_column(
        Enum(ComparisonStatus), default=ComparisonStatus.pending_review, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="comparisons")
    result = relationship("ComparisonResult", back_populates="comparison", uselist=False)


class ComparisonResult(Base):
    __tablename__ = "comparison_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comparison_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comparisons.id"), unique=True, nullable=False
    )
    report_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    novelties_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    suggestions_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    diff_json: Mapped[dict] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    comparison = relationship("Comparison", back_populates="result")
