from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import json
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv

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
        self.model = "gpt-4o"
        self.max_output_tokens = 16000
        self.stories = {}
        
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
        
    def generate_chapter(self, story_id: str, chapter_number: int, chapter_summary: str) -> Chapter:
        """Generate full chapter using summary, previous chapter, and next chapter summary as context"""
        story = self.stories[story_id]["data"]
        memory = self.stories[story_id]["memory"]
        
        # Store the chapter summary
        memory.add_chapter_summary(chapter_number, chapter_summary)
        
        # Get previous chapter if it exists
        previous_context = ""
        if chapter_number > 1 and len(story.chapters) >= chapter_number - 1:
            previous_chapter = story.chapters[chapter_number - 2]
            previous_context = f"""
            Previous chapter ({previous_chapter.title}) ended with:
            {previous_chapter.content[-500:]}
            """
        
        # Get next chapter's summary if it exists
        next_chapter_context = ""
        next_chapter_summary = memory.get_chapter_summary(chapter_number + 1)
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

        {next_chapter_context if next_chapter_context else 'This is the final chapter.' if chapter_number == len(memory.chapter_summaries) else ''}

        Target length: {story.target_chapter_length} words
        Writing style: {story.writing_style}

        Ensure the chapter:
        1. Follows the provided summary
        2. Maintains continuity with the previous chapter
        3. Uses consistent characterization
        4. Includes vivid descriptions and engaging dialogue
        5. Ends in a way that flows naturally into the next chapter's events
        6. Creates anticipation for what comes next

        Start with the chapter title in the format:
        # Chapter Title
        
        Then write the chapter content.
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
        
        # Add to story
        story.chapters.append(chapter)
        story.update_timestamp()
        
        return chapter
        
    def get_story(self, story_id: str) -> Optional[Story]:
        """Retrieve a story by ID"""
        if story_id in self.stories:
            return self.stories[story_id]["data"]
        return None