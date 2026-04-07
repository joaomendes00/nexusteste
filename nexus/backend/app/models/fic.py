import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FICStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    blocked = "blocked"


class FIC(Base):
    __tablename__ = "fics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    workload_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    itinerary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    trail: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[FICStatus] = mapped_column(Enum(FICStatus), default=FICStatus.pending, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_by = relationship("User", backref="fics")
