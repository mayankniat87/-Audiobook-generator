import pdfplumber


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract all text from a PDF file using pdfplumber.
    Returns the extracted text as a single string.
    """
    text_parts = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())

        full_text = "\n\n".join(text_parts)

        # Clean up whitespace
        full_text = " ".join(full_text.split())

        # Murf has a character limit per request — chunk if needed
        # For now, return first 3000 chars (approx 4–5 mins of audio)
        return full_text[:3000] if full_text else ""

    except Exception as e:
        print(f"[PDF Parser] Error: {e}")
        return ""
