import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FICCreate(BaseModel):
    name: str
    description: str
    workload_hours: int | None = None
    itinerary: str | None = None
    trail: str | None = None
    original_filename: str


class FICUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    workload_hours: int | None = None
    itinerary: str | None = None
    trail: str | None = None
    status: str | None = None


class FICResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    workload_hours: int | None
    itinerary: str | None
    trail: str | None
    status: str
    confidence_score: float | None
    original_filename: str
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID


class FICListResponse(BaseModel):
    items: list[FICResponse]
    total: int
