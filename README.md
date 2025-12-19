# KathaAI: AI-Powered Story Creation Platform

**KathaAI** is an advanced AI writing partner that helps authors create stories from concept to completion. Whether you're a writer seeking assistance or a reader looking for unique narratives, KathaAI provides seamless story generation, chapter-by-chapter development, and multi-modal export options—all without requiring any sign-up.

## ✨ Features

### For Writers
- **Seamless Ideation**: Generate story concepts, outlines, characters, and world details
- **Intelligent Writing Assistant**: Draft passages, refine sentences, and maintain plot consistency
- **Character Development**: Create rich characters with detailed backstories and personality traits
- **Plot Structuring**: Organize stories with intelligent pacing and narrative arcs
- **Chapter-by-Chapter Generation**: Build complete stories with context-aware chapter generation
- **Multi-Step Reasoning**: Advanced Chain-of-Thought pipeline for coherent storytelling

### For Readers
- **On-Demand Story Generation**: Instantly create unique stories tailored to your preferences
- **Surprise Me Feature**: Generate original stories based on genre, tone, and audience preferences
- **Instant Audio Conversion**: Convert stories to high-quality audiobooks (powered by Sarvam AI)
- **Book Cover Generation**: Generate beautiful book covers using Gemini Flash 2.0 IMAGEN Model
- **PDF Export**: Download stories as professionally formatted PDFs

### Advanced Capabilities
- **Multi-Genre Support**: Fantasy, sci-fi, romance, mystery, and more
- **Frictionless Access**: No sign-ups or logins required
- **Multi-Modal Export**: PDF, Audio, Image, and plain text formats
- **Customizable Experience**: Tailor writing styles and reading preferences

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **OpenAI GPT-4** - Story and content generation
- **Google Gemini API** - Image generation for book covers
- **ReportLab** - PDF generation
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **TSParticles** - Interactive particle effects

## 📁 Project Structure

```
KathaAI/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── story_utils.py          # Core story generation logic
│   ├── pdf_utils.py            # PDF generation utilities
│   ├── requirements.txt        # Python dependencies
│   └── routes/
│       └── story_routes.py     # API route definitions
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx        # Landing page
│   │       └── create/
│   │           ├── assist-me/  # Writing assistant flow
│   │           └── surprise-me/ # Surprise story generation
│   ├── package.json            # Node.js dependencies
│   └── next.config.ts          # Next.js configuration
└── README.md                   # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 18+** and npm
- **OpenAI API Key** (for story generation)
- **Gemini API Key** (for book cover generation, optional)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend` directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` (or `http://localhost:3001`)

## 🔧 Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key  # Optional, for book cover generation
```

## 🎯 Usage Workflow

### Writing Assistant Flow
1. Navigate to `/create/assist-me`
2. Enter your story idea, genre, and preferences
3. Generate seed ideas and select one
4. Create a detailed chapter outline
5. Generate chapters one by one
6. Export as PDF with generated book cover

### Surprise Me Flow
1. Navigate to `/create/surprise-me`
2. Select category, story type, length, tone, and audience
3. Enter a custom prompt
4. Generate and read your story
5. Export or convert to audio

## 🏗️ Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📝 Notes

- The application uses in-memory storage for stories (not persistent across server restarts)
- Book cover generation requires a Gemini API key
- PDF generation includes cover images if provided
- All story generation uses OpenAI GPT-4 model
- CORS is configured to allow frontend connections from `localhost:3000` and `localhost:3001`

---

**Made with ❤️ for storytellers and readers everywhere**
