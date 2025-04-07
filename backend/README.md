# AI Story Generator Backend

A powerful backend system for generating stories of varying lengths, from short stories to full novel-length narratives with multiple chapters, complex characters, detailed plots, and rich dialogue.

## Advanced Features

- **Multi-Chapter Stories**: Create stories of any length, from short stories to novels with 15+ chapters
- **Rich Characters**: Generate detailed characters with backgrounds, personalities, and evolving arcs
- **Plot Continuity**: Smart tracking of plot threads, character development, and key events across chapters
- **Long Chapters**: Generate proper novel-length chapters (3000+ words) using advanced recursive techniques
- **Robust Error Handling**: Fall-back mechanisms to ensure story generation completes even if issues arise 
- **Terminal Progress**: Visual feedback on story generation progress
- **Model Selection**: Choose between different OpenAI models for generation

## Setup and Installation

1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your OpenAI API key in a `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Running the Server

Start the server with uvicorn:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The server will be available at http://localhost:8000

## API Endpoints

### Story Management

- `POST /api/story/create` - Create a new story
- `GET /api/story/list` - List all stories
- `GET /api/story/{story_id}` - Get a specific story

### Story Generation

- `POST /api/story/characters` - Generate characters for a story
- `POST /api/story/outline` - Generate a detailed story outline
- `POST /api/story/chapter` - Generate a specific chapter
- `POST /api/story/generate-complete` - Generate a complete story
- `POST /api/story/generate-from-idea` - Generate a complete story from just a basic idea (one-step process)

## Testing with Postman

### 1. Create a new story

**POST** `http://localhost:8000/api/story/create`

Body (JSON):
```json
{
    "title": "The Lost Kingdom",
    "genre": "Fantasy",
    "setting": "A medieval world with magic",
    "premise": "A young farmer discovers they are the heir to a forgotten kingdom and must reclaim their throne",
    "target_chapter_count": 3,
    "target_chapter_length": 2000
}
```

### 2. Generate characters

**POST** `http://localhost:8000/api/story/characters`

Body (JSON):
```json
{
    "story_id": "your_story_id_from_step_1",
    "num_characters": 4
}
```

### 3. Create a story outline

**POST** `http://localhost:8000/api/story/outline`

Body (JSON):
```json
{
    "story_id": "your_story_id_from_step_1"
}
```

### 4. Generate a chapter

**POST** `http://localhost:8000/api/story/chapter`

Body (JSON):
```json
{
    "story_id": "your_story_id_from_step_1",
    "chapter_number": 1
}
```

### 5. Generate a complete story

**POST** `http://localhost:8000/api/story/generate-complete`

Body (JSON):
```json
{
    "story_id": "your_story_id_from_step_1"
}
```

Note: This will generate all chapters in sequence and may take several minutes to complete depending on the story length.

### 6. One-Step Story Generation (From Idea)

**POST** `http://localhost:8000/api/story/generate-from-idea`

Body (JSON):
```json
{
    "idea": "A detective discovers that his missing person case involves supernatural elements that challenge his rational worldview",
    "genre": "Mystery",
    "target_chapter_count": 5,
    "target_chapter_length": 3000,
    "character_count": 4,
    "use_model": "gpt-3.5-turbo"
}
```

This endpoint handles the entire process in one step:
1. Creates a story with a title based on your idea
2. Generates an appropriate setting if not provided
3. Generates characters with detailed backgrounds and personalities
4. Creates a comprehensive story outline
5. Writes full-length chapters with proper continuity
6. Returns the complete story

## Generation for Longer Novels

For longer novel-length stories (10+ chapters):

1. The system automatically adjusts generation parameters to maintain quality
2. Plot threads and character arcs are tracked to ensure continuity
3. Memory management ensures context is preserved across the entire story
4. Terminal output shows detailed progress during generation

Note: Generating a full novel (10+ chapters) can take 20-30 minutes or more depending on length.

## Technical Details

- Uses GPT-3.5-Turbo by default (faster, more cost-effective)
- Can use GPT-4 for higher quality output (specify with `use_model` parameter)
- Implements recursive chapter generation for longer chapters
- Uses sophisticated memory management for long stories
- Handles token limitations gracefully
- Provides detailed terminal logging of the generation process 