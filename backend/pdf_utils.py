from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER
import io
import base64
from typing import Dict, List, Any, Optional

def generate_pdf_from_chapters(
    title: str,
    genre: str,
    setting: str,
    chapters: List[Dict[str, Any]],
    characters: Dict[str, str],
    cover_image_url: Optional[str] = None
) -> bytes:
    """
    Generate a PDF from chapter data
    
    Args:
        title (str): The title of the story
        genre (str): The genre of the story
        setting (str): The setting of the story
        chapters (List[Dict[str, Any]]): List of chapter data
        characters (Dict[str, str]): Dictionary of character names and descriptions
        cover_image_url (Optional[str]): URL or base64 of the cover image
        
    Returns:
        bytes: The PDF file as bytes
    """
    # Create a buffer to store the PDF
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []

    # Custom styles
    title_style = ParagraphStyle(name="Title", parent=styles["Title"], alignment=TA_CENTER, fontSize=24, spaceAfter=20)
    header_style = ParagraphStyle(name="Heading", parent=styles["Heading2"], fontSize=16, spaceAfter=10)
    normal_style = styles["Normal"]

    # ===== FRONT COVER =====
    content.append(Paragraph(title, title_style))
    content.append(Paragraph(f"Genre: {genre}", normal_style))
    content.append(Paragraph(f"Setting: {setting}", normal_style))
    
    # Add cover image if provided
    if cover_image_url:
        try:
            # Handle base64 image
            if cover_image_url.startswith('data:image'):
                img_data = cover_image_url.split(',')[1]
                img_bytes = base64.b64decode(img_data)
                img_buffer = io.BytesIO(img_bytes)
                img = Image(img_buffer, width=400, height=300)
                content.append(Spacer(1, 20))
                content.append(img)
                content.append(Spacer(1, 20))
        except Exception as e:
            print(f"Error adding cover image: {e}")
    
    content.append(PageBreak())

    # ===== CHAPTER CONTENT =====
    for chapter in chapters:
        content.append(Paragraph(f"Chapter: {chapter.get('title', 'Untitled Chapter')}", header_style))
        content.append(Paragraph(chapter.get('content', ''), normal_style))

        content.append(Spacer(1, 12))
        content.append(Paragraph(f"Chapter Summary: {chapter.get('summary', '')}", normal_style))
        content.append(Spacer(1, 12))
        content.append(Paragraph(f"Word Count: {chapter.get('word_count', 0)}", normal_style))
        content.append(PageBreak())

    # ===== CHARACTERS =====
    content.append(Paragraph("Characters", header_style))
    if isinstance(characters, dict):
        for name, description in characters.items():
            content.append(Paragraph(f"<b>{name}</b>: {description}", normal_style))
            content.append(Spacer(1, 6))
    elif isinstance(characters, str):
        content.append(Paragraph(characters, normal_style))
    content.append(PageBreak())

    # ===== BUILD PDF =====
    doc.build(content)
    
    # Get the PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes 