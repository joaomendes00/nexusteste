from datetime import datetime
from typing import Any, Literal

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
    is_definitive: bool = False
    version_label: str | None = None
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
    feedback_json: Any | None = None
    created_at: datetime


class FeedbackRequest(BaseModel):
    suggestion_index: int
    feedback: Literal["up", "down"]


class MarkDefinitiveRequest(BaseModel):
    version_label: str | None = None


class ModerationDecisionRequest(BaseModel):
    comparison_id: str
    suggestion_index: int
    decision: Literal["approve", "reject"]
