import json

from groq import Groq

from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)


def _chat(prompt: str) -> str:
    """Envia prompt ao Groq e retorna a resposta."""
    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content


def parse_plans(old_text: str, new_text: str) -> dict:
    """Analisa os dois planos e retorna estrutura parseada."""
    prompt = (
        "Você é um especialista em análise de documentos educacionais.\n"
        "Analise os dois planos de curso abaixo e retorne um JSON com as seções principais "
        "de cada plano (ementa, carga horária, competências, etc).\n\n"
        f"PLANO ANTIGO:\n{old_text}\n\n"
        f"PLANO NOVO:\n{new_text}\n\n"
        "Responda APENAS com JSON válido, sem texto antes ou depois."
    )
    raw = _chat(prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw_response": raw}


def generate_diff(old_text: str, new_text: str) -> dict:
    """Gera diff estruturado entre os dois planos."""
    prompt = (
        "Compare os dois textos abaixo e gere um JSON com as diferenças encontradas.\n"
        "Para cada diferença, inclua: seção, texto_antigo, texto_novo, tipo (adição/remoção/alteração).\n\n"
        f"TEXTO ANTIGO:\n{old_text}\n\n"
        f"TEXTO NOVO:\n{new_text}\n\n"
        "Responda APENAS com JSON válido, sem texto antes ou depois."
    )
    raw = _chat(prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw_response": raw}


def generate_report(old_text: str, new_text: str, diff: dict) -> dict:
    """Gera relatório completo com novidades, sugestões e markdown."""
    diff_str = json.dumps(diff, ensure_ascii=False)
    prompt = (
        "Com base nos dois planos de curso e no diff fornecido, gere um relatório completo.\n"
        "Retorne um JSON com:\n"
        '- "report_markdown": relatório em markdown\n'
        '- "novelties": lista de novidades encontradas no plano novo\n'
        '- "suggestions": lista de sugestões de melhoria\n\n'
        f"PLANO ANTIGO:\n{old_text}\n\n"
        f"PLANO NOVO:\n{new_text}\n\n"
        f"DIFF:\n{diff_str}\n\n"
        "Responda APENAS com JSON válido, sem texto antes ou depois."
    )
    raw = _chat(prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "report_markdown": raw,
            "novelties": [],
            "suggestions": [],
        }
