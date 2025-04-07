"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Quantico, Capriola } from 'next/font/google';
import axios from 'axios';

// Font initialization
const quantico = Quantico({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-quantico',
});

const capriola = Capriola({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-capriola',
});


interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
  content?: string;
  word_count?: number;
}

interface StoryData {
  story_id: string;
  title: string;
  genre: string;
  created_at: string;
  chapter_outlines: ChapterOutline[];
  writing_style?: string; // Optional writing style
}

interface CompleteChapter {
  number: number;
  title: string;
  content: string;
  summary?: string;
  word_count: number;
}

interface CompleteStory {
  title: string;
  genre: string;
  author: string;
  created_at: string;
  chapters: CompleteChapter[];
  total_word_count: number;
}

const Page = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [chapterOutlines, setChapterOutlines] = useState<ChapterOutline[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [generatingChapter, setGeneratingChapter] = useState(false);

  useEffect(() => {
    const storedOutlines = localStorage.getItem('chapterOutlines');
    if (storedOutlines) {
      try {
        const parsedData = JSON.parse(storedOutlines);
        if (parsedData.chapter_outlines) {
          setStoryData(parsedData);
          const outlines = parsedData.chapter_outlines || [];
          setChapterOutlines(outlines.sort((a: ChapterOutline, b: ChapterOutline) => a.number - b.number));
          if (outlines.length > 0) {
            setSelectedChapter(outlines[0]);
          }
        } else if (Array.isArray(parsedData)) {
          // Handle array format
          setChapterOutlines(parsedData.sort((a: ChapterOutline, b: ChapterOutline) => a.number - b.number));
          if (parsedData.length > 0) {
            setSelectedChapter(parsedData[0]);
          }
        }
      } catch (error) {
        console.error('Error parsing chapter outlines:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleChapterSelect = (chapter: ChapterOutline) => {
    // Reset editing state when changing chapters
    setIsEditing(false);
    setSelectedChapter(chapter);
  };

  const startEditing = () => {
    if (selectedChapter) {
      setEditedSummary(selectedChapter.summary);
      setIsEditing(true);
    }
  };

  const saveEditedSummary = () => {
    if (selectedChapter && editedSummary.trim() !== '') {
      const updatedChapter = { ...selectedChapter, summary: editedSummary };
      const updatedOutlines = chapterOutlines.map(chapter => 
        chapter.number === selectedChapter.number ? updatedChapter : chapter
      );
      
      setChapterOutlines(updatedOutlines);
      setSelectedChapter(updatedChapter);
      
      // Update localStorage
      if (storyData) {
        const updatedStoryData = {
          ...storyData,
          chapter_outlines: updatedOutlines
        };
        localStorage.setItem('chapterOutlines', JSON.stringify(updatedStoryData));
        setStoryData(updatedStoryData);
        
        // Update the complete story if it exists
        updateCompleteStoryWithOutlines(updatedOutlines);
      } else {
        localStorage.setItem('chapterOutlines', JSON.stringify(updatedOutlines));
        
        // Update the complete story if it exists
        updateCompleteStoryWithOutlines(updatedOutlines);
      }
      
      setIsEditing(false);
    }
  };

  // Helper function to update the complete story when chapters are edited
  const updateCompleteStoryWithOutlines = (outlines: ChapterOutline[]) => {
    try {
      const completeStoryJSON = localStorage.getItem('complete_story');
      if (completeStoryJSON) {
        const completeStory = JSON.parse(completeStoryJSON) as CompleteStory;
        
        // Update chapter summaries in the complete story
        const updatedChapters = completeStory.chapters.map((chapter: CompleteChapter) => {
          const updatedOutline = outlines.find(o => o.number === chapter.number);
          if (updatedOutline) {
            return {
              ...chapter,
              summary: updatedOutline.summary,
              title: updatedOutline.title
            };
          }
          return chapter;
        });
        
        // Save updated complete story
        localStorage.setItem('complete_story', JSON.stringify({
          ...completeStory,
          chapters: updatedChapters
        }));
      }
    } catch (error) {
      console.error('Error updating complete story:', error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const generateFullChapter = async () => {
    if (!selectedChapter) return;
    
    setGeneratingChapter(true);
    try {
      // Get the current writing style from localStorage or use default
      const writingStyle = storyData?.writing_style || "default";
      
      // Find the previous chapter if it exists
      let previousChapterTitle = null;
      let previousChapterEnding = null;
      if (selectedChapter.number > 1) {
        const previousChapter = chapterOutlines.find(ch => ch.number === selectedChapter.number - 1);
        if (previousChapter && previousChapter.content) {
          previousChapterTitle = previousChapter.title;
          // Get the last 500 characters of the previous chapter's content
          const contentWords = previousChapter.content.split(' ');
          previousChapterEnding = contentWords.slice(-50).join(' ');
        }
      }
      
      // Find the next chapter's summary if it exists
      let nextChapterSummary = null;
      const nextChapter = chapterOutlines.find(ch => ch.number === selectedChapter.number + 1);
      if (nextChapter) {
        nextChapterSummary = nextChapter.summary;
      }
      
      // Prepare the data to send to the API
      const requestData = {
        chapter_number: selectedChapter.number,
        chapter_summary: selectedChapter.summary,
        writing_style: writingStyle,
        previous_chapter_title: previousChapterTitle,
        previous_chapter_ending: previousChapterEnding,
        next_chapter_summary: nextChapterSummary,
        target_word_count: 2500 // Increased word count for more substantial chapters
      };
      
      // Call the API using axios
      const response = await axios.post('http://localhost:8000/api/story/generate-chapter', requestData);
      
      const generatedChapter = response.data;
      
      // Update the chapter with the generated content
      const updatedChapter = {
        ...selectedChapter,
        content: generatedChapter.content,
        word_count: generatedChapter.word_count,
        title: generatedChapter.title || selectedChapter.title
      };
      
      // Update state
      const updatedOutlines = chapterOutlines.map(chapter => 
        chapter.number === selectedChapter.number ? updatedChapter : chapter
      );
      
      setChapterOutlines(updatedOutlines);
      setSelectedChapter(updatedChapter);
      
      // Update localStorage for chapter outlines
      if (storyData) {
        const updatedStoryData = {
          ...storyData,
          chapter_outlines: updatedOutlines
        };
        localStorage.setItem('chapterOutlines', JSON.stringify(updatedStoryData));
        setStoryData(updatedStoryData);
        
        // Save individual chapter in localStorage
        localStorage.setItem(`chapter_${selectedChapter.number}`, JSON.stringify(updatedChapter));
        
        // Save complete story content for PDF export
        saveCompleteStoryContent(updatedStoryData, updatedOutlines);
      } else {
        localStorage.setItem('chapterOutlines', JSON.stringify(updatedOutlines));
        
        // Save individual chapter in localStorage
        localStorage.setItem(`chapter_${selectedChapter.number}`, JSON.stringify(updatedChapter));
        
        // Save complete story content for PDF export
        const dummyStoryData = {
          title: "My Story",
          genre: "Fiction",
          chapter_outlines: updatedOutlines
        };
        saveCompleteStoryContent(dummyStoryData, updatedOutlines);
      }
      
    } catch (error) {
      console.error('Error generating chapter:', error);
      alert('Failed to generate chapter. Please try again.');
    } finally {
      setGeneratingChapter(false);
    }
  };

  // Helper function to save the complete story content in a format suitable for PDF export
  const saveCompleteStoryContent = (storyData: any, chapters: ChapterOutline[]) => {
    try {
      // Sort chapters by number to ensure correct order
      const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
      
      // Create a complete story object
      const completeStory: CompleteStory = {
        title: storyData.title || "Untitled Story",
        genre: storyData.genre || "Fiction",
        author: "Generated with KathAI",
        created_at: storyData.created_at || new Date().toISOString(),
        chapters: sortedChapters.map(chapter => ({
          number: chapter.number,
          title: chapter.title,
          content: chapter.content || "",
          summary: chapter.summary,
          word_count: chapter.word_count || 0
        })),
        total_word_count: sortedChapters.reduce((total, chapter) => total + (chapter.word_count || 0), 0)
      };
      
      // Save complete story in localStorage
      localStorage.setItem('complete_story', JSON.stringify(completeStory));
      
      // Also save each chapter individually with consistent naming for easy retrieval
      sortedChapters.forEach(chapter => {
        if (chapter.content) {
          localStorage.setItem(`chapter_${chapter.number}`, JSON.stringify(chapter));
        }
      });
      
    } catch (error) {
      console.error('Error saving complete story:', error);
    }
  };

  if (loading) {
    return (
      <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
        <div className="min-h-screen bg-slate-900/85 flex items-center justify-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
        <div className='flex flex-col items-center justify-center'>
          <div className="fixed left-4 top-4">
            <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
              <Link href="/create/assist-me/seed-ideas">Back</Link>
            </button>
          </div>
        </div>
        
        <div className="min-h-[80vh] w-screen max-w-6xl mx-auto bg-slate-50 shadow-2xl rounded-4xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-1 font-sans var(--font-quantico)">Chapter Outlines</h1>
          <h2 className="text-base sm:text-lg italic text-center text-amber-600 mb-4 sm:mb-6 font-sans var(--font-capriola)">Review and refine your story structure</h2>
          
          {chapterOutlines.length === 0 ? (
            <div className="text-center py-8 flex-grow">
              <p className="text-lg text-amber-800">No chapter outlines found. Please go back and generate some outlines first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-6 flex-grow overflow-y-auto">
              {/* Chapter List - Left Panel */}
              <div className="border-2 border-amber-200 bg-white rounded-xl p-3 sm:p-4 shadow-lg lg:col-span-1 h-[70vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2 sticky top-0 bg-white py-2">
                  Chapters
                </h2>
                <div className="space-y-3">
                  {chapterOutlines.map((chapter) => (
                    <div 
                      key={chapter.number}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedChapter?.number === chapter.number 
                          ? 'border-2 border-amber-600 bg-amber-50' 
                          : 'border border-amber-200 bg-white hover:bg-amber-50'
                      }`}
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      <h3 className="font-semibold text-amber-800 font-sans var(--font-quantico)">
                        Chapter {chapter.number}
                      </h3>
                      <p className="text-gray-800 text-sm truncate">{chapter.title}</p>
                      {chapter.content && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Generated ({chapter.word_count} words)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Chapter Detail - Right Panel */}
              <div className="border-2 border-amber-200 bg-white rounded-xl p-3 sm:p-4 shadow-lg lg:col-span-2 h-[70vh] overflow-y-auto">
                {selectedChapter ? (
                  <div className="animate-fadeIn">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white font-bold">{selectedChapter.number}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-amber-800 font-sans var(--font-quantico)">
                        {selectedChapter.title}
                      </h2>
                    </div>
                    
                    <div className="border-2 border-amber-200 p-4 rounded-lg bg-amber-50/50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold font-sans var(--font-quantico) text-amber-800">
                          Summary
                        </h3>
                        {!isEditing ? (
                          <button 
                            onClick={startEditing}
                            className="text-amber-700 hover:text-amber-900 text-sm font-semibold"
                          >
                            Edit
                          </button>
                        ) : (
                          <div className="flex space-x-2">
                            <button 
                              onClick={saveEditedSummary}
                              className="text-green-700 hover:text-green-900 text-sm font-semibold"
                            >
                              Save
                            </button>
                            <button 
                              onClick={cancelEditing}
                              className="text-red-700 hover:text-red-900 text-sm font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="w-full h-48 p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none font-sans var(--font-capriola) text-gray-800"
                        />
                      ) : (
                        <p className="text-gray-800 font-sans var(--font-capriola) leading-relaxed">
                          {selectedChapter.summary}
                        </p>
                      )}
                    </div>
                    
                    {selectedChapter.content ? (
                      <div className="mt-6 border-2 border-amber-200 p-4 lg:p-6 rounded-lg bg-amber-50/80 shadow-lg">
                        <h3 className="text-xl font-bold mb-4 font-sans var(--font-quantico) text-amber-800 border-b-2 border-amber-300 pb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Full Chapter Content ({selectedChapter.word_count} words)
                        </h3>
                        <div className="text-gray-800 font-sans var(--font-capriola) leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-line p-4 bg-white/80 rounded-md shadow-inner text-base border border-amber-100">
                          {selectedChapter.content}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex justify-center">
                        <button 
                          onClick={generateFullChapter}
                          disabled={isEditing || generatingChapter}
                          className={`bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) ${
                            isEditing || generatingChapter ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {generatingChapter ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </span>
                          ) : 'Generate Full-Length Chapter'}
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-between">
                      <button 
                        className={`py-2 px-4 rounded-lg font-sans var(--font-quantico) transition-colors ${
                          chapterOutlines.findIndex(c => c.number === selectedChapter.number) === 0
                            ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        onClick={() => {
                          const currentIndex = chapterOutlines.findIndex(c => c.number === selectedChapter.number);
                          if (currentIndex > 0) {
                            setSelectedChapter(chapterOutlines[currentIndex - 1]);
                          }
                        }}
                        disabled={chapterOutlines.findIndex(c => c.number === selectedChapter.number) === 0}
                      >
                        Previous Chapter
                      </button>
                      
                      <button 
                        className={`py-2 px-4 rounded-lg font-sans var(--font-quantico) transition-colors ${
                          chapterOutlines.findIndex(c => c.number === selectedChapter.number) === chapterOutlines.length - 1
                            ? 'bg-amber-100 text-amber-400 cursor-not-allowed'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        onClick={() => {
                          const currentIndex = chapterOutlines.findIndex(c => c.number === selectedChapter.number);
                          if (currentIndex < chapterOutlines.length - 1) {
                            setSelectedChapter(chapterOutlines[currentIndex + 1]);
                          }
                        }}
                        disabled={chapterOutlines.findIndex(c => c.number === selectedChapter.number) === chapterOutlines.length - 1}
                      >
                        Next Chapter
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-amber-800/60 text-xl font-sans var(--font-capriola)">
                      Select a chapter to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-auto pt-4">
            <button 
              className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-base sm:text-lg"
              disabled={chapterOutlines.length === 0}
            >
              <Link href="/create/assist-me/seed-ideas/chapter-outlines/finalize">
                Finalize Story
              </Link>
            </button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Page;
