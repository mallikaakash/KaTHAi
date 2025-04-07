from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes.story_routes import story_router

app = FastAPI()

# CORS: allow Next.js frontend to make API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],  # frontend dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(story_router, prefix="/api/story")

@app.get("/")
def read_root():
    return {"message": "FastAPI is running"}

