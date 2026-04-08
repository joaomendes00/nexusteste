from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ComparisonCreate(BaseModel):
    old_plan_filename: str
    new_plan_filename: str


class ComparisonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    old_plan_filename: str
    new_plan_filename: str
    old_plan_text: str
    new_plan_text: str
    status: str
    created_at: datetime
    updated_at: datetime


class ReviewApproveRequest(BaseModel):
    approved: bool


class ComparisonResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    comparison_id: str
    report_markdown: str
    novelties_json: Any | None = None
    suggestions_json: Any | None = None
    diff_json: Any | None = None
    created_at: datetime
