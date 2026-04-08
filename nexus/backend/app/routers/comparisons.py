from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comparison import Comparison, ComparisonResult, ComparisonStatus
from app.models.user import User
from app.schemas.comparison import (
    ComparisonResponse,
    ComparisonResultResponse,
    ReviewApproveRequest,
)
from app.services.ai_service import generate_diff, generate_report
from app.services.extraction_service import extract_text

router = APIRouter(prefix="/comparisons", tags=["comparisons"])


@router.post("/", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
async def create_comparison(
    old_plan: UploadFile,
    new_plan: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    old_bytes = await old_plan.read()
    new_bytes = await new_plan.read()

    old_text, _ = extract_text(old_bytes, old_plan.filename)
    new_text, _ = extract_text(new_bytes, new_plan.filename)

    comparison = Comparison(
        user_id=current_user.id,
        old_plan_filename=old_plan.filename,
        new_plan_filename=new_plan.filename,
        old_plan_text=old_text,
        new_plan_text=new_text,
        status=ComparisonStatus.pending_review,
    )
    db.add(comparison)
    await db.commit()
    await db.refresh(comparison)
    return comparison


@router.get("/", response_model=list[ComparisonResponse])
async def list_comparisons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Comparison).where(Comparison.user_id == current_user.id).order_by(Comparison.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{comparison_id}", response_model=ComparisonResponse)
async def get_comparison(
    comparison_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    return comparison


@router.post("/{comparison_id}/approve", response_model=ComparisonResultResponse)
async def approve_comparison(
    comparison_id: str,
    payload: ReviewApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)

    if comparison.status != ComparisonStatus.pending_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comparação não está pendente de revisão (status: {comparison.status.value})",
        )

    if not payload.approved:
        comparison.status = ComparisonStatus.failed
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comparação rejeitada pelo usuário",
        )

    comparison.status = ComparisonStatus.processing
    await db.commit()

    diff = generate_diff(comparison.old_plan_text, comparison.new_plan_text)
    report = generate_report(comparison.old_plan_text, comparison.new_plan_text, diff)

    comp_result = ComparisonResult(
        comparison_id=comparison.id,
        report_markdown=report.get("report_markdown", ""),
        novelties_json=report.get("novelties", []),
        suggestions_json=report.get("suggestions", []),
        diff_json=diff,
    )
    db.add(comp_result)

    comparison.status = ComparisonStatus.completed
    await db.commit()
    await db.refresh(comp_result)
    return comp_result


@router.get("/{comparison_id}/result", response_model=ComparisonResultResponse)
async def get_comparison_result(
    comparison_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    result = await db.execute(
        select(ComparisonResult).where(ComparisonResult.comparison_id == comparison.id)
    )
    comp_result = result.scalar_one_or_none()
    if not comp_result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resultado ainda não disponível")
    return comp_result


async def _get_user_comparison(
    comparison_id: str, user_id: str, db: AsyncSession
) -> Comparison:
    result = await db.execute(
        select(Comparison).where(Comparison.id == comparison_id, Comparison.user_id == user_id)
    )
    comparison = result.scalar_one_or_none()
    if not comparison:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comparação não encontrada")
    return comparison
