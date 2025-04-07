from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import io

# Import StoryGenerator
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from story_utils import StoryGenerator
from pdf_utils import generate_pdf_from_chapters

# Load environment variables
load_dotenv()

# Create the story generator singleton
story_generator = StoryGenerator()
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"Loaded API Key for story generation: {bool(api_key)}")
else:
    print("WARNING: No OpenAI API key found. Story generation may fail.")

# Router for story-related endpoints
story_router = APIRouter()

# Request and Response Models
class CharacterDetail(BaseModel):
    name: str
    description: str
    background: Optional[str] = None
    goals: Optional[str] = None
    personality_traits: Optional[List[str]] = None
    relationships: Optional[Dict[str, str]] = None
    arc_description: Optional[str] = None

class StorySettings(BaseModel):
    narrative_perspective: Optional[str] = None  # "First Person", "Third Person", etc.
    setting_description: Optional[str] = None
    time_period: Optional[str] = None
    world_building_details: Optional[str] = None

class GenerateSeedIdeasRequest(BaseModel):
    genre: str
    idea: str
    target_chapter_count: int  # Removed default value to make it required
    target_chapter_length: int = 3000
    writing_style: str
    character_count: Optional[int] = None
    characters: Optional[List[CharacterDetail]] = None
    story_settings: StorySettings
    
    @field_validator('target_chapter_count')
    def validate_chapter_count(cls, v):
        if v < 1: raise ValueError('Minimum 1 chapter')
        if v > 30: raise ValueError('Maximum 30 chapters')
        return v
    
    @field_validator('target_chapter_length')
    def validate_chapter_length(cls, v):
        if v < 500: raise ValueError('Minimum 500 words')
        if v > 5000: raise ValueError('Maximum 5000 words')
        return v
    
    @field_validator('character_count')
    def validate_character_count(cls, v):
        if v is not None:
            if v < 1: raise ValueError('Minimum 1 character')
            if v > 15: raise ValueError('Maximum 15 characters')
        return v
    
    @field_validator('writing_style')
    def validate_writing_style(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Writing style must be at least 3 characters long')
        return v.strip()

class ChapterOutline(BaseModel):
    number: int
    title: str
    summary: str

# class DetailedOutlineRequest(BaseModel):
#     seed_summary: str
#     genre: str
#     target_chapter_count: int =1
#     target_chapter_length: int = 3000
#     writing_style: str
#     character_count: Optional[int] = None
#     characters: Optional[List[CharacterDetail]] = None
#     story_settings: StorySettings
    
#     @field_validator('target_chapter_count')
#     def validate_chapter_count(cls, v):
#         if v < 1: raise ValueError('Minimum 1 chapter')
#         if v > 30: raise ValueError('Maximum 30 chapters')
#         return v
    
#     @field_validator('target_chapter_length')
#     def validate_chapter_length(cls, v):
#         if v < 500: raise ValueError('Minimum 500 words')
#         if v > 5000: raise ValueError('Maximum 5000 words')
#         return v
    
#     @field_validator('character_count')
#     def validate_character_count(cls, v):
#         if v is not None:
#             if v < 1: raise ValueError('Minimum 1 character')
#             if v > 15: raise ValueError('Maximum 15 characters')
#         return v
    
#     @field_validator('writing_style')
#     def validate_writing_style(cls, v):
#         if len(v.strip()) < 3:
#             raise ValueError('Writing style must be at least 3 characters long')
#         return v.strip()

class DetailedOutlineRequest(BaseModel):
    seed_summary: str
    genre: str
    title: str
    target_chapter_count: int = 1
    target_chapter_length: int = 3000
    writing_style: str
    character_count: Optional[int] = None
    characters: Optional[List[CharacterDetail]] = None
    story_settings: StorySettings
    story_id: Optional[str] = None
    
    @field_validator('target_chapter_count')
    def validate_chapter_count(cls, v):
        if v < 1: raise ValueError('Minimum 1 chapter')
        if v > 30: raise ValueError('Maximum 30 chapters')
        return v
    
    @field_validator('target_chapter_length')
    def validate_chapter_length(cls, v):
        if v < 500: raise ValueError('Minimum 500 words')
        if v > 5000: raise ValueError('Maximum 5000 words')
        return v
    
    @field_validator('character_count')
    def validate_character_count(cls, v):
        if v is not None:
            if v < 1: raise ValueError('Minimum 1 character')
            if v > 15: raise ValueError('Maximum 15 characters')
        return v
    
    @field_validator('writing_style')
    def validate_writing_style(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Writing style must be at least 3 characters long')
        return v.strip()

class GenerateChapterRequest(BaseModel):
    chapter_number: int
    chapter_summary: str
    writing_style: str = "default"
    previous_chapter_title: Optional[str] = None
    previous_chapter_ending: Optional[str] = None
    next_chapter_summary: Optional[str] = None
    target_word_count: int = 6000

class StoryResponse(BaseModel):
    id: str
    title: str
    genre: str
    chapters: List[Dict[str, Any]] = []
    is_complete: bool = False
    total_word_count: int
    created_at: str
    updated_at: str

class CreateStoryRequest(BaseModel):
    title: str
    genre: str
    writing_style: str = "default"

class GenerateBookCoverRequest(BaseModel):
    """Request model for book cover generation"""
    story_title: str
    story_summary: str
    characters: Optional[List[CharacterDetail]] = None
    genre: Optional[str] = None

class BookCoverResponse(BaseModel):
    """Response model for book cover generation"""
    image_data: str  # Base64 encoded image
    mime_type: str   # Mime type of the image

class GeneratePdfRequest(BaseModel):
    """Request model for PDF generation"""
    title: str
    genre: str
    setting: str
    chapters: List[Dict[str, Any]]
    characters: Dict[str, str]
    cover_image_url: Optional[str] = None

class SurpriseMeRequest(BaseModel):
    """Request model for surprise-me story generation"""
    category: str
    story_type: str
    length: str
    tone: str
    target_audience: str
    prompt: str

# API Endpoints
@story_router.post("/generate-seed-ideas")
async def generate_seed_ideas(request: GenerateSeedIdeasRequest):
    """Generate three different seed ideas based on input parameters"""
    try:
        seed_ideas = story_generator.generate_seed_ideas(
            genre=request.genre,
            idea=request.idea,
            target_chapters=request.target_chapter_count,
            style=request.writing_style,
            characters=request.characters,
            story_settings=request.story_settings,
            character_count=request.character_count
        )
        return {"seed_ideas": [
            {"id": f"seed_{i}", "summary": idea} 
            for i, idea in enumerate(seed_ideas)
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @story_router.post("/create-detailed-outline")
# async def create_detailed_outline(request: DetailedOutlineRequest):
#     """Create detailed chapter-by-chapter outline"""
#     try:
#         chapter_outlines = story_generator.create_detailed_outline(
#             seed_summary=request.seed_summary,
#             genre=request.genre,
#             target_chapters=request.target_chapter_count,
#             style=request.writing_style
#         )
#         return {"chapter_outlines": chapter_outlines}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @story_router.post("/generate-chapter")
# async def generate_chapter(request: GenerateChapterRequest):
#     """Generate a full chapter based on its summary"""
#     story = story_generator.get_story(request.story_id)
#     if not story:
#         raise HTTPException(status_code=404, detail="Story not found")
    
#     try:
#         chapter = story_generator.generate_chapter(
#             story_id=request.story_id,
#             chapter_number=request.chapter_number,
#             chapter_summary=request.chapter_summary
#         )
#         return {
#             "number": chapter.number,
#             "title": chapter.title,
#             "content": chapter.content,
#             "word_count": chapter.word_count
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @story_router.get("/story/{story_id}", response_model=StoryResponse)
# async def get_story(story_id: str):
#     """Get a story by ID with all its details"""
#     story = story_generator.get_story(story_id)
#     if not story:
#         raise HTTPException(status_code=404, detail="Story not found")
#     return story

# @story_router.post("/create-story")
# async def create_story(request: CreateStoryRequest):
    # """Create a new story"""
    # try:
    #     story = story_generator.create_story(
    #         title=request.title,
    #         genre=request.genre,
    #         style=request.writing_style
    #     )
    #     return {
    #         "story_id": story.id,
    #         "title": story.title,
    #         "genre": story.genre,
    #         "created_at": story.created_at
    #     }
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))

@story_router.post("/create-detailed-outline")
async def create_detailed_outline(request: DetailedOutlineRequest):
    """Create detailed chapter-by-chapter outline and create a story automatically"""
    try:
        print("Received request:", request)  # Add debug print
        
        # Always create a new story
        story = story_generator.create_story(
            title=request.title,
            genre=request.genre,
            style=request.writing_style
        )
        
        # Generate chapter outlines
        chapter_outlines = story_generator.create_detailed_outline(
            seed_summary=request.seed_summary,
            genre=request.genre,
            target_chapters=request.target_chapter_count,
            style=request.writing_style
        )
        
        # Store the outlines in the story's memory
        story_generator.store_chapter_outlines(story.id, chapter_outlines)
        
        return {
            "story_id": story.id,
            "title": story.title,
            "genre": story.genre,
            "created_at": story.created_at,
            "chapter_outlines": chapter_outlines
        }
    except Exception as e:
        print("Error details:", str(e))  # Add debug print
        raise HTTPException(status_code=500, detail=str(e))

@story_router.post("/generate-chapter")
async def generate_chapter(request: GenerateChapterRequest):
    """Generate a full chapter based on its summary and context provided by frontend"""
    try:
        chapter = story_generator.generate_chapter(
            chapter_number=request.chapter_number,
            chapter_summary=request.chapter_summary,
            writing_style=request.writing_style,
            previous_chapter_title=request.previous_chapter_title,
            previous_chapter_ending=request.previous_chapter_ending,
            next_chapter_summary=request.next_chapter_summary,
            target_word_count=request.target_word_count
        )
        return {
            "number": chapter.number,
            "title": chapter.title,
            "content": chapter.content,
            "word_count": chapter.word_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@story_router.get("/story/{story_id}", response_model=StoryResponse)
async def get_story(story_id: str):
    """Get a story by ID with all its details"""
    story = story_generator.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

@story_router.post("/generate-book-cover", response_model=BookCoverResponse)
async def generate_book_cover(request: GenerateBookCoverRequest):
    """Generate a book cover image using Gemini API based on story details"""
    try:
        # Check if Gemini API key is configured
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=500, 
                detail="Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
            )
        
        print(f"Generating book cover for story: {request.story_title}")
        
        # Call the StoryGenerator method to generate the book cover
        result = story_generator.generate_book_cover(
            story_title=request.story_title,
            story_summary=request.story_summary,
            characters=request.characters,
            genre=request.genre
        )
        
        return BookCoverResponse(
            image_data=result["image_data"],
            mime_type=result["mime_type"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error generating book cover: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate book cover: {str(e)}")

@story_router.post("/generate-pdf")
async def generate_pdf(request: GeneratePdfRequest):
    """
    Generate a PDF from chapter data
    
    Args:
        request (GeneratePdfRequest): The request containing story data
        
    Returns:
        StreamingResponse: The PDF file as a streaming response
    """
    try:
        # Generate the PDF
        pdf_bytes = generate_pdf_from_chapters(
            title=request.title,
            genre=request.genre,
            setting=request.setting,
            chapters=request.chapters,
            characters=request.characters,
            cover_image_url=request.cover_image_url
        )
        
        # Create a streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={request.title.replace(' ', '_')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@story_router.post("/surprise-me")
async def surprise_me(request: SurpriseMeRequest):
    """
    Generate a surprise story based on user preferences.
    This endpoint creates a complete story based on the user's selections.
    """
    try:
        # Generate a story based on the user's preferences
        story = story_generator.generate_surprise_story(
            category=request.category,
            story_type=request.story_type,
            length=request.length,
            tone=request.tone,
            target_audience=request.target_audience,
            prompt=request.prompt
        )
        
        return story
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating surprise story: {str(e)}")