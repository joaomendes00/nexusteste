from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.comparison import Comparison, ComparisonResult, ComparisonStatus
from app.models.user import User
from app.schemas.comparison import ModerationDecisionRequest

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict[str, Any]:
    """Métricas agregadas da plataforma (RF34 / M-ANA1)."""
    total_comparisons = (
        await db.execute(select(func.count()).select_from(Comparison))
    ).scalar_one()

    completed_comparisons = (
        await db.execute(
            select(func.count())
            .select_from(Comparison)
            .where(Comparison.status == ComparisonStatus.completed)
        )
    ).scalar_one()

    active_users = (
        await db.execute(
            select(func.count())
            .select_from(User)
            .where(User.is_active.is_(True))
        )
    ).scalar_one()

    # Tempo médio (em segundos) entre criação e última atualização das completed
    avg_row = await db.execute(
        select(
            func.avg(
                (func.julianday(Comparison.updated_at) - func.julianday(Comparison.created_at))
                * 86400.0
            )
        ).where(Comparison.status == ComparisonStatus.completed)
    )
    avg_processing_time = float(avg_row.scalar_one() or 0.0)

    # Agrega feedback de todas as ComparisonResult
    accepted = 0
    rejected = 0
    results = await db.execute(select(ComparisonResult.feedback_json))
    for (feedback,) in results.all():
        if not isinstance(feedback, dict):
            continue
        for value in feedback.values():
            if value == "up":
                accepted += 1
            elif value == "down":
                rejected += 1

    # Comparações por dia nos últimos 30 dias
    since = datetime.now(timezone.utc) - timedelta(days=30)
    per_day_rows = await db.execute(
        select(
            func.date(Comparison.created_at).label("day"),
            func.count().label("count"),
        )
        .where(Comparison.created_at >= since)
        .group_by(func.date(Comparison.created_at))
        .order_by(func.date(Comparison.created_at))
    )
    comparisons_per_day = [
        {"date": str(row.day), "count": int(row.count)}
        for row in per_day_rows.all()
    ]

    return {
        "total_comparisons": int(total_comparisons),
        "completed_comparisons": int(completed_comparisons),
        "active_users": int(active_users),
        "avg_processing_time": avg_processing_time,
        "suggestions_accepted": accepted,
        "suggestions_rejected": rejected,
        "comparisons_per_day": comparisons_per_day,
    }


@router.get("/moderation/pending")
async def list_pending_suggestions(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict[str, Any]]:
    """Lista sugestões pending_moderation de todas as comparações (RN15)."""
    results = await db.execute(
        select(ComparisonResult, Comparison)
        .join(Comparison, ComparisonResult.comparison_id == Comparison.id)
        .order_by(Comparison.created_at.desc())
    )

    pending: list[dict[str, Any]] = []
    for comp_result, comparison in results.all():
        suggestions = comp_result.suggestions_json or []
        if not isinstance(suggestions, list):
            continue
        for i, suggestion in enumerate(suggestions):
            if not isinstance(suggestion, dict):
                continue
            if suggestion.get("moderation_status") == "pending" or suggestion.get(
                "pending_moderation"
            ) is True:
                pending.append(
                    {
                        "comparison_id": comparison.id,
                        "comparison_title": (
                            f"{comparison.old_plan_filename} → "
                            f"{comparison.new_plan_filename}"
                        ),
                        "suggestion_index": i,
                        "text": suggestion.get("text", ""),
                        "confidence_score": suggestion.get("confidence_score", 0.0),
                        "created_at": comparison.created_at.isoformat(),
                    }
                )
    return pending


@router.post("/moderation/decision")
async def decide_suggestion(
    payload: ModerationDecisionRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict[str, Any]:
    """Aprova ou rejeita uma sugestão pendente (RN15)."""
    result = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == payload.comparison_id
        )
    )
    comp_result = result.scalar_one_or_none()
    if not comp_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resultado não encontrado"
        )

    suggestions = list(comp_result.suggestions_json or [])
    if payload.suggestion_index >= len(suggestions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Índice de sugestão inválido",
        )

    suggestion = suggestions[payload.suggestion_index]
    if not isinstance(suggestion, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sugestão em formato inválido",
        )

    if payload.decision == "approve":
        suggestion["moderation_status"] = "approved"
        suggestion["pending_moderation"] = False
    else:
        suggestion["moderation_status"] = "rejected"
        suggestion["pending_moderation"] = False

    suggestions[payload.suggestion_index] = suggestion
    comp_result.suggestions_json = suggestions
    await db.commit()

    return {"status": "ok", "decision": payload.decision}
