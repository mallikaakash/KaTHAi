from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import json
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv
import base64
import mimetypes
import google.generativeai as genai
from google.generativeai import types

# Load environment variables
load_dotenv()

# Models
class Chapter(BaseModel):
    number: int
    title: str
    content: str
    word_count: int
    
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
    
class Story(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    genre: str
    chapters: List[Chapter] = []
    characters: List[CharacterDetail] = []
    story_settings: Optional[StorySettings] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    is_complete: bool = False
    writing_style: str = "default"
    target_chapter_length: int = 2000
    character_arcs: Dict[str, List[Dict[str, str]]] = {}
    
    def update_timestamp(self):
        self.updated_at = datetime.now().isoformat()
        
    def total_word_count(self) -> int:
        return sum(chapter.word_count for chapter in self.chapters)

class StoryMemory:
    def __init__(self, story_id: str):
        self.story_id = story_id
        self.chat_history = []
        self.chapter_summaries = {}
        
    def add_chapter_summary(self, chapter_number: int, summary: str):
        self.chapter_summaries[chapter_number] = summary
        
    def get_chapter_summary(self, chapter_number: int) -> Optional[str]:
        return self.chapter_summaries.get(chapter_number)

class StoryGenerator:
    def __init__(self, api_key: str = None):
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"
        self.max_output_tokens = 7000
        self.stories = {}
        
        # Initialize Gemini client if API key exists
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            print(f"Loaded Gemini API Key for image generation: {bool(gemini_api_key)}")
        else:
            print("WARNING: No Gemini API key found. Book cover generation may fail.")
        
    def _generate_text(self, prompt: str, temperature: float = 0.8, max_tokens: int = 2000) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a master storyteller."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in text generation: {e}")
            raise

    def generate_seed_ideas(
        self, 
        genre: str, 
        idea: str, 
        target_chapters: int, 
        style: str = "default",
        characters: Optional[List[CharacterDetail]] = None,
        story_settings: Optional[StorySettings] = None,
        character_count: Optional[int] = None
    ) -> List[str]:
        """Generate three different 300-word story summaries with character consideration"""
        
        # Build character context
        character_context = ""
        if characters:
            character_context = "Predefined characters:\n" + "\n".join([
                f"- {char.name}: {char.description}" +
                (f"\n  Background: {char.background}" if char.background else "") +
                (f"\n  Goals: {char.goals}" if char.goals else "") +
                (f"\n  Traits: {', '.join(char.personality_traits)}" if char.personality_traits else "")
                for char in characters
            ])
        elif character_count:
            character_context = f"Generate {character_count} distinct characters appropriate for the story."
        else:
            character_context = "Generate an appropriate number of characters for the story's scope and complexity."

        # Build settings context
        settings_context = ""
        if story_settings:
            settings_context = f"""
            Narrative Perspective: {story_settings.narrative_perspective or 'Choose appropriate perspective'}
            Setting: {story_settings.setting_description or 'Develop based on story needs'}
            Time Period: {story_settings.time_period or 'Choose appropriate time period'}
            World Details: {story_settings.world_building_details or 'Develop as needed'}
            """

        prompt = f"""
        Create THREE different engaging story summaries for a {genre} story. Each summary MUST be EXACTLY 300 words long (not including character arcs).
        Initial idea: {idea}
        Writing style: {style}

        {character_context}

        {settings_context}

        IMPORTANT:
        - Write each summary as a cohesive narrative overview, NOT as a chapter breakdown
        - Focus on the overall story arc, main conflicts, and character journeys
        - Write in present tense, like a book blurb or synopsis
        - DO NOT include phrases like "in this chapter" or "the story begins/ends"
        - DO NOT break down the plot into sequential parts
        - Write as a flowing, engaging story summary that captures the entire narrative

        Format Requirements:
        [SUMMARY 1]
        [Write a compelling 300-word story summary here, as a continuous narrative]
        [CHARACTER ARCS]
        [Brief description of how each character grows or changes through the story]
        ---
        [SUMMARY 2]
        [Write a compelling 300-word story summary here, as a continuous narrative]
        [CHARACTER ARCS]
        [Brief description of how each character grows or changes through the story]
        ---
        [SUMMARY 3]
        [Write a compelling 300-word story summary here, as a continuous narrative]
        [CHARACTER ARCS]
        [Brief description of how each character grows or changes through the story]

        Each summary should:
        1. Read like a professional book synopsis
        2. Present a complete story arc with conflict and resolution
        3. Focus on themes, character development, and major plot points
        4. Maintain narrative flow without sequential markers
        5. Engage the reader while revealing the story's scope
        6. Avoid meta-commentary or structural references

        Example style:
        "In the hidden depths of an ancient library, Elena Martinez guards a secret that has protected her family for generations. The seemingly ordinary books lining the shelves hold living stories, their characters walking among the stacks after midnight. When a mysterious researcher arrives seeking forbidden knowledge, Elena must confront her family's past and question everything she knows about the library's magic..."

        DO NOT use phrases like:
        - "The story begins with..."
        - "In the first part..."
        - "Then..."
        - "The story concludes..."
        - "In this chapter..."
        """
        
        result = self._generate_text(prompt, temperature=0.9, max_tokens=3000)
        
        # Process and validate summaries
        raw_summaries = [s.strip() for s in result.split('---') if s.strip()]
        processed_summaries = []
        
        for raw_summary in raw_summaries:
            # Split summary and character arcs
            parts = raw_summary.split('[CHARACTER ARCS]')
            if len(parts) < 2:
                continue
            
            # Clean up the summary part
            summary = parts[0].replace('[SUMMARY 1]', '').replace('[SUMMARY 2]', '').replace('[SUMMARY 3]', '').strip()
            character_arcs = parts[1].strip()
            
            # Count words in summary
            word_count = len(summary.split())
            
            # If summary is too short, try to expand it
            if word_count < 300:
                expansion_prompt = f"""
                The following story summary is {word_count} words. Expand it to EXACTLY 300 words while maintaining the same story and style:
                
                {summary}
                """
                expanded_summary = self._generate_text(expansion_prompt, temperature=0.7, max_tokens=2000)
                summary = expanded_summary.strip()
            
            # Combine summary and character arcs
            processed_summaries.append(f"{summary}\n\nCharacter Arcs:\n{character_arcs}")
        
        # Ensure we have three summaries
        while len(processed_summaries) < 3:
            new_summary_prompt = f"""
            Create a NEW and DIFFERENT 300-word story summary for a {genre} story based on this idea:
            {idea}
            
            The summary must be EXACTLY 300 words and different from any previous summaries.
            Include character arcs after the summary.
            """
            new_summary = self._generate_text(new_summary_prompt, temperature=0.9, max_tokens=2000)
            processed_summaries.append(new_summary.strip())
        
        return processed_summaries[:3]  # Ensure we only return 3 summaries

    def create_detailed_outline(self, seed_summary: str, genre: str, target_chapters: int, style: str = "default") -> List[Dict[str, Any]]:
        """Create detailed chapter outlines from seed summary"""
        prompt = f"""
        Based on this story summary:
        {seed_summary}

        Create a detailed chapter-by-chapter outline for a {genre} story with {target_chapters} chapters.
        Writing style: {style}

        For each chapter provide:
        1. An engaging chapter title
        2. A 350-word summary of the chapter's events
        3. Key character developments
        4. Important plot points

        Format as JSON:
        {{
            "chapters": [
                {{
                    "number": 1,
                    "title": "Chapter Title",
                    "summary": "250-word summary"
                }},
                ...
            ]
        }}
        """
        
        result = self._generate_text(prompt, temperature=0.7, max_tokens=3000)
        try:
            outline_data = json.loads(result)
            return outline_data["chapters"]
        except Exception as e:
            print(f"Error parsing outline: {e}")
            raise

    def create_story(self, title: str, genre: str, style: str = "default") -> Story:
        """Create a new story with basic metadata"""
        story = Story(
            title=title,
            genre=genre,
            writing_style=style
        )
        
        self.stories[story.id] = {
            "data": story,
            "memory": StoryMemory(story.id)
        }
        
        return story
        
    def generate_chapter(self, chapter_number: int, chapter_summary: str, writing_style: str = "default", 
                        previous_chapter_title: str = None, previous_chapter_ending: str = None, 
                        next_chapter_summary: str = None, target_word_count: int = 2500) -> Chapter:
        """Generate full chapter using summary and optional context provided by the frontend"""
        
        # Build context based on provided parameters instead of in-memory storage
        previous_context = ""
        if previous_chapter_title and previous_chapter_ending:
            previous_context = f"""
            Previous chapter ({previous_chapter_title}) ended with:
            {previous_chapter_ending}
            """
        elif chapter_number > 1:
            previous_context = "This follows the previous chapter."
        
        # Use next chapter context if provided
        next_chapter_context = ""
        if next_chapter_summary:
            next_chapter_context = f"""
            The next chapter will cover:
            {next_chapter_summary}
            
            Make sure this chapter's ending leads naturally into these events.
            """
        
        prompt = f"""
        Write Chapter {chapter_number} based on this summary:
        {chapter_summary}

        {previous_context if previous_context else 'This is the first chapter.'}

        {next_chapter_context if next_chapter_context else 'This is the final chapter.' if not next_chapter_summary else ''}

        TARGET WORD COUNT: {target_word_count} words (between {target_word_count} and {target_word_count + 500} words)
        Writing style: {writing_style}

        Ensure the chapter:
        1. Follows the provided summary
        2. Maintains continuity with the previous chapter
        3. Uses consistent characterization
        4. Includes vivid descriptions and engaging dialogue
        5. Ends in a way that flows naturally into the next chapter's events
        6. Creates anticipation for what comes next
        7. MEETS THE TARGET WORD COUNT OF {target_word_count}-{target_word_count + 500} words

        Start with the chapter title in the format:
        # Chapter Title
        
        Then write the chapter content. Your chapter MUST be at least {target_word_count} words but not exceed {target_word_count + 500} words.
        """
        
        result = self._generate_text(
            prompt, 
            temperature=0.7, 
            max_tokens=self.max_output_tokens
        )
        
        # Extract title and content
        lines = result.strip().split('\n')
        title = lines[0].replace('#', '').strip()
        content = '\n'.join(lines[1:]).strip()
        
        # Create chapter
        chapter = Chapter(
            number=chapter_number,
            title=title,
            content=content,
            word_count=len(content.split())
        )
        
        return chapter
        
    def get_story(self, story_id: str) -> Optional[Story]:
        """Retrieve a story by ID"""
        if story_id in self.stories:
            return self.stories[story_id]["data"]
        return None

    def store_chapter_outlines(self, story_id: str, chapter_outlines: List[Dict[str, Any]]):
        """Store all chapter outlines in the story's memory for future reference"""
        if story_id not in self.stories:
            raise ValueError(f"Story with ID {story_id} not found")
        
        memory = self.stories[story_id]["memory"]
        
        for outline in chapter_outlines:
            memory.add_chapter_summary(outline["number"], outline["summary"])
        
        return True

    def generate_book_cover(self, story_title: str, story_summary: str, characters: List[CharacterDetail] = None, genre: str = None) -> dict:
        """
        Generate a book cover image using Gemini API based on the story details
        
        Returns:
            dict: Contains base64 encoded image and mime type
        """
        try:
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            if not gemini_api_key:
                raise ValueError("Gemini API key not found in environment variables")
                
            client = genai.Client(api_key=gemini_api_key)
            model = "gemini-2.0-flash-exp-image-generation"
            
            # Create character descriptions for the prompt
            character_descriptions = ""
            if characters and len(characters) > 0:
                character_descriptions = "Main characters:\n"
                for char in characters[:3]:  # Limit to 3 main characters
                    character_descriptions += f"- {char.name}: {char.description}\n"
            
            # Craft a prompt specifically for book cover generation
            prompt = f"""
            ONLY GENERATE AN IMAGE. NO TEXT RESPONSE.
            
            Create a professional, eye-catching book cover image for the following story:
            
            Title: The Phantom Next Door
            Genre: {genre or "Fiction"}
            
            Summary: {story_summary[:500]}
            
            {character_descriptions}
            
            IMPORTANT INSTRUCTIONS:
            - Create ONLY an image suitable for a professional book cover
            - DO NOT include any text or title on the cover
            - The image should capture the essence and mood of the story
            - Use a style appropriate for the genre
            - Make it visually striking with good composition
            - Ensure the image is high quality and suitable for a book cover
            - No text elements, watermarks, or signatures
            - Image should have portrait orientation (taller than wide)
            """
            
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ]
            
            generate_content_config = types.GenerateContentConfig(
                esponse_modalities=[
            "image",
            "text",
        ],
                response_mime_type="text/plain",
            )
            
            # Stream response and collect image data
            image_data = None
            mime_type = None
            
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            ):
                if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                    continue
                    
                if chunk.candidates[0].content.parts[0].inline_data:
                    inline_data = chunk.candidates[0].content.parts[0].inline_data
                    image_data = inline_data.data
                    mime_type = inline_data.mime_type
                    break
            
            if not image_data:
                raise ValueError("No image was generated in the response")
                
            # Return base64 encoded image and mime type
            return {
                "image_data": base64.b64encode(image_data).decode('utf-8'),
                "mime_type": mime_type
            }
            
        except Exception as e:
            print(f"Error generating book cover: {e}")
            raise

    def generate_surprise_story(self, category: str, story_type: str, length: str, tone: str, target_audience: str, prompt: str) -> dict:
        """
        Generate a complete surprise story based on user preferences.
        
        Args:
            category: The story category (e.g., "Children's Stories", "Adult Stories")
            story_type: The specific type of story (e.g., "Fairy Tale", "Self-Help")
            length: The desired length of the story (e.g., "Short Story", "Medium Story")
            tone: The tone of the story (e.g., "Whimsical", "Serious")
            target_audience: The target audience (e.g., "Young Children", "Adults")
            prompt: A custom prompt for the story generation
            
        Returns:
            A dictionary containing the generated story
        """
        try:
            # Determine word count based on length
            word_count = 1000
            if length.lower() == "medium story":
                word_count = 2000
            elif length.lower() == "long story":
                word_count = 3000
            
            # Create a system prompt based on the user's preferences
            system_prompt = f"""
            You are a creative storyteller tasked with writing a {length.lower()} {story_type.lower()} story.
            
            Story Category: {category}
            Story Type: {story_type}
            Tone: {tone}
            Target Audience: {target_audience}
            
            Please write a complete, engaging story that matches these specifications.
            The story should be approximately {word_count} words in length.
            Make it appropriate for the target audience and maintain the specified tone throughout.
            
            Include a title for the story at the beginning.
            """
            
            # Generate the story using the OpenAI API
            story_text = self._generate_text(
                prompt=system_prompt + "\n\n" + prompt,
                temperature=0.8,
                max_tokens=4000
            )
            
            # Extract the title from the story (assuming it's the first line)
            lines = story_text.strip().split('\n')
            title = lines[0].strip()
            if title.startswith('Title:'):
                title = title[6:].strip()
            
            # Create a response object
            response = {
                "title": title,
                "content": story_text,
                "category": category,
                "story_type": story_type,
                "length": length,
                "tone": tone,
                "target_audience": target_audience,
                "word_count": len(story_text.split()),
                "created_at": datetime.now().isoformat()
            }
            
            return response
            
        except Exception as e:
            print(f"Error generating surprise story: {str(e)}")
            raise e

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