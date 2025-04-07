from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER
import json
import os

def create_pdf(data, filename="output_story.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []

    # Custom styles
    title_style = ParagraphStyle(name="Title", parent=styles["Title"], alignment=TA_CENTER, fontSize=24, spaceAfter=20)
    header_style = ParagraphStyle(name="Heading", parent=styles["Heading2"], fontSize=16, spaceAfter=10)
    normal_style = styles["Normal"]

    # ===== FRONT COVER =====
    content.append(Paragraph(data.get("title", "Untitled"), title_style))
    content.append(Paragraph(f"Genre: {data.get('genre', 'Unknown')}", normal_style))
    content.append(Paragraph(f"Setting: {data.get('setting', 'Unknown')}", normal_style))
    content.append(PageBreak())

    # ===== CHAPTER CONTENT =====
    chapters = data.get("chapters", [])
    for chapter in chapters:
        content.append(Paragraph(f"Chapter: {chapter.get('title', 'Untitled Chapter')}", header_style))
        content.append(Paragraph(chapter.get('content', ''), normal_style))

        content.append(Spacer(1, 12))
        content.append(Paragraph(f"Chapter Summary: {chapter.get('summary', '')}", normal_style))
        content.append(Spacer(1, 12))
        content.append(Paragraph(f"Word Count: {chapter.get('word_count', 0)}", normal_style))
        content.append(PageBreak())

   
    # ===== CHARACTERS =====
    characters = data.get("characters", {})
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
    print(f"PDF generated as {filename}")

def load_json_data(json_file_path):
    """
    Load story data from a JSON file
    
    Args:
        json_file_path (str): Path to the JSON file
        
    Returns:
        dict: The loaded JSON data
        
    Raises:
        FileNotFoundError: If the JSON file does not exist
        json.JSONDecodeError: If the JSON file is invalid
    """
    if not os.path.exists(json_file_path):
        raise FileNotFoundError(f"JSON file not found: {json_file_path}")
        
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    
    return data

# ===== Example Usage =====
if __name__ == "__main__":
    # Example 1: Using a JSON file
    json_file_path = "short_story.json"
    try:
        story_data = load_json_data(json_file_path)
        create_pdf(story_data, filename="short_story.pdf")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error: {e}")
        create_pdf(example_data, filename="example_story.pdf")
