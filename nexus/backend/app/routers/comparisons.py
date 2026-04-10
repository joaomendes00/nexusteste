import asyncio

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comparison import Comparison, ComparisonResult, ComparisonStatus
from app.models.user import User, UserRole
from app.schemas.comparison import (
    ComparisonResponse,
    ComparisonResultResponse,
    FeedbackRequest,
    MarkDefinitiveRequest,
    ReviewApproveRequest,
)
from app.services.ai_service import generate_diff, generate_report
from app.services.docx_service import build_report_docx
from app.services.extraction_service import extract_text

router = APIRouter(prefix="/comparisons", tags=["comparisons"])


def _filter_suggestions_for_user(result_obj: ComparisonResult, user: User) -> None:
    """Oculta sugestões pending_moderation para usuários comuns (RN15)."""
    if user.role == UserRole.admin:
        return
    if not result_obj or not isinstance(result_obj.suggestions_json, list):
        return
    result_obj.suggestions_json = [
        s
        for s in result_obj.suggestions_json
        if not (isinstance(s, dict) and s.get("pending_moderation") is True)
        and not (
            isinstance(s, dict) and s.get("moderation_status") == "rejected"
        )
    ]


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
        select(Comparison)
        .where(Comparison.user_id == current_user.id)
        .order_by(Comparison.created_at.desc())
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

    if comparison.status not in (
        ComparisonStatus.pending_review,
        ComparisonStatus.processing,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comparação não pode ser aprovada neste status ({comparison.status.value})",
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

    try:
        diff = await asyncio.to_thread(
            generate_diff, comparison.old_plan_text, comparison.new_plan_text
        )
        report = await asyncio.to_thread(
            generate_report, comparison.old_plan_text, comparison.new_plan_text, diff
        )
    except Exception as exc:
        comparison.status = ComparisonStatus.failed
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha na análise de IA: {exc}",
        )

    # Remove resultado anterior caso seja uma re-aprovação
    existing = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == comparison.id
        )
    )
    prev = existing.scalar_one_or_none()
    if prev:
        await db.delete(prev)
        await db.flush()

    comp_result = ComparisonResult(
        comparison_id=comparison.id,
        report_markdown=report.get("report_markdown", ""),
        novelties_json=report.get("novelties", []),
        suggestions_json=report.get("suggestions", []),
        diff_json=diff,
        feedback_json={},
    )
    db.add(comp_result)

    comparison.status = ComparisonStatus.completed
    await db.commit()
    await db.refresh(comp_result)

    _filter_suggestions_for_user(comp_result, current_user)
    return comp_result


@router.get("/{comparison_id}/result", response_model=ComparisonResultResponse)
async def get_comparison_result(
    comparison_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    result = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == comparison.id
        )
    )
    comp_result = result.scalar_one_or_none()
    if not comp_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultado ainda não disponível",
        )
    _filter_suggestions_for_user(comp_result, current_user)
    return comp_result


@router.post("/{comparison_id}/feedback", response_model=ComparisonResultResponse)
async def submit_feedback(
    comparison_id: str,
    payload: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Salva feedback 👍/👎 por sugestão (RF30 / M-FDB1)."""
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    result = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == comparison.id
        )
    )
    comp_result = result.scalar_one_or_none()
    if not comp_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resultado não encontrado"
        )

    feedback = dict(comp_result.feedback_json or {})
    key = str(payload.suggestion_index)
    if key in feedback:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback já registrado para esta sugestão",
        )
    feedback[key] = payload.feedback
    comp_result.feedback_json = feedback

    await db.commit()
    await db.refresh(comp_result)
    _filter_suggestions_for_user(comp_result, current_user)
    return comp_result


@router.post("/{comparison_id}/mark-definitive", response_model=ComparisonResponse)
async def mark_definitive(
    comparison_id: str,
    payload: MarkDefinitiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca a comparação como definitiva (RF32)."""
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    if comparison.status != ComparisonStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas comparações concluídas podem ser marcadas como definitivas",
        )
    comparison.is_definitive = True
    if payload.version_label:
        comparison.version_label = payload.version_label
    await db.commit()
    await db.refresh(comparison)
    return comparison


@router.delete("/{comparison_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comparison(
    comparison_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deleta a comparação (bloqueado se definitiva — RN16)."""
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    if comparison.is_definitive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Comparações marcadas como definitivas não podem ser deletadas",
        )
    # Remove resultado associado primeiro (FK)
    result = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == comparison.id
        )
    )
    comp_result = result.scalar_one_or_none()
    if comp_result:
        await db.delete(comp_result)
    await db.delete(comparison)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{comparison_id}/export/docx")
async def export_comparison_docx(
    comparison_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exporta o relatório em DOCX (RF11)."""
    comparison = await _get_user_comparison(comparison_id, current_user.id, db)
    result = await db.execute(
        select(ComparisonResult).where(
            ComparisonResult.comparison_id == comparison.id
        )
    )
    comp_result = result.scalar_one_or_none()
    if not comp_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resultado ainda não disponível",
        )

    _filter_suggestions_for_user(comp_result, current_user)

    title = f"{comparison.old_plan_filename} → {comparison.new_plan_filename}"
    docx_bytes = await asyncio.to_thread(
        build_report_docx,
        title,
        comp_result.report_markdown,
        comp_result.novelties_json or [],
        comp_result.suggestions_json or [],
    )

    filename = f"nexus-relatorio-{comparison.id[:8]}.docx"
    return Response(
        content=docx_bytes,
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_user_comparison(
    comparison_id: str, user_id: str, db: AsyncSession
) -> Comparison:
    result = await db.execute(
        select(Comparison).where(
            Comparison.id == comparison_id, Comparison.user_id == user_id
        )
    )
    comparison = result.scalar_one_or_none()
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comparação não encontrada"
        )
    return comparison
