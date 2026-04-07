import fitz


def extract_text(file_bytes: bytes, filename: str) -> tuple[str, str]:
    """Extrai texto de um PDF usando PyMuPDF.

    Returns:
        Tuple com (texto extraído, método utilizado).
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return "\n".join(pages), "pymupdf"
