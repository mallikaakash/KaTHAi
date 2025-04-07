'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Quantico, Capriola } from 'next/font/google';

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

interface Character {
  name: string;
  description: string;
}

interface SeedIdea {
  id: string;
  summary: string;
}

interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
}

interface StorySettings {
  narrative_perspective: string;
  setting_description: string;
  time_period: string | null;
  world_building_details: string | null;
}

interface StoryData {
  genre: string;
  idea: string;
  target_chapter_count: number;
  target_chapter_length: number;
  writing_style: string;
  character_count: number;
  characters: Array<{name: string; description: string}>;
  story_settings: StorySettings;
}

const Page = () => {
  const router = useRouter();
  const [selectedSeedIdea, setSelectedSeedIdea] = useState<SeedIdea | null>(null);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [chapterOutlines, setChapterOutlines] = useState<ChapterOutline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedChapter, setEditedChapter] = useState<ChapterOutline | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Creative writing process messages
  const loadingMessages = [
    "Crafting the narrative arc...",
    "Plotting story progression...",
    "Developing character journeys...",
    "Establishing key plot points...",
    "Creating chapter flow and transitions...",
    "Weaving subplots into the main narrative...",
    "Building tension and pacing...",
    "Designing climactic moments...",
    "Adding nuance to story elements...",
    "Structuring revelations and twists...",
    "Planning character growth moments...",
    "Constructing narrative frameworks...",
    "This will be an amazing story outline!",
  ];

  // Rotate through loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
      
      // Simulate progress
      setLoadingProgress(prev => {
        const newProgress = prev + (Math.random() * 8);
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 2500);
    
    setLoadingMessage(loadingMessages[0]);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    // Retrieve the selected seed idea and story data from localStorage
    const seedIdeaData = localStorage.getItem('selectedSeedIdea');
    const storyDataJson = localStorage.getItem('storyData');
    
    if (seedIdeaData) {
      try {
        const seedIdea = JSON.parse(seedIdeaData) as SeedIdea;
        setSelectedSeedIdea(seedIdea);
        
        if (storyDataJson) {
          const parsedStoryData = JSON.parse(storyDataJson);
          setStoryData(parsedStoryData.story_data || {});
        }
        
        // Now make the API call to create detailed outline
        fetchDetailedOutline(seedIdea);
      } catch (error) {
        console.error('Error parsing selected seed idea:', error);
        setIsLoading(false);
      }
    } else {
      console.error('No selected seed idea found in localStorage');
      setIsLoading(false);
      router.push('/create/assist-me/seed-ideas');
    }
  }, [router]);

  const fetchDetailedOutline = async (seedIdea: SeedIdea) => {
    setIsLoading(true);
    
    try {
      // Get storyData from localStorage
      const storyDataJson = localStorage.getItem('storyData');
      const parsedData = storyDataJson ? JSON.parse(storyDataJson) : {};
      const storyData = parsedData.story_data || {};
      
      // Format the request data to exactly match the backend's DetailedOutlineRequest
      const requestData = {
        seed_summary: seedIdea.summary,
        genre: storyData.genre || "Fiction",
        target_chapter_count: Math.max(1, Math.min(30, 
          Number(storyData.target_chapter_count) || 
          Number(storyData.chapters) || 3)),
        target_chapter_length: Math.max(500, Math.min(5000, 
          Number(storyData.target_chapter_length) || 3000)),
        writing_style: storyData.writing_style || 
                        storyData.writingStyle || "default",
        character_count: storyData.characters?.length || 1,
        characters: Array.isArray(storyData.characters) ? 
          storyData.characters.slice(0, 15).map((char: Character) => ({
            name: char.name || "Character",
            description: char.description || "A character in the story"
          })) : [],
        story_settings: {
          narrative_perspective: storyData.narrative_perspective || 
                               storyData.narrationStyle || "third person",
          setting_description: storyData.setting_description || 
                             storyData.setting || "contemporary",
          time_period: storyData.time_period || null,
          world_building_details: storyData.world_building_details || null
        }
      };
      
      // Log the exact data being sent to help with debugging
      console.log("Sending to API:", requestData);
      
      // Call the API with the correctly formatted data
      const response = await axios.post('http://localhost:8001/api/story/create-detailed-outline', requestData);
      console.log("API Response:", response.data);
      
      if (response.data && response.data.chapter_outlines) {
        setChapterOutlines(response.data.chapter_outlines);
        
        // Save the chapter outlines to localStorage for future use
        localStorage.setItem('chapterOutlines', JSON.stringify(response.data.chapter_outlines));
      } else {
        console.error('Invalid response format:', response.data);
        useFallbackChapters();
      }
    } catch (error) {
      console.error('Error fetching detailed outline:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        console.error('API Error Status:', error.response?.status);
      }
      
      // Use fallback data to allow the user to continue
      useFallbackChapters();
    } finally {
      // Complete loading with a slight delay for better UX
      setTimeout(() => {
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }, 1000);
    }
  };

  // Helper function for fallback chapter data
  const useFallbackChapters = () => {
    const dummyChapters: ChapterOutline[] = [
      {
        number: 1,
        title: 'Chapter 1: Beginning',
        summary: 'Introduction to the main characters and setting. The world is established and the protagonist is introduced.'
      },
      {
        number: 2,
        title: 'Chapter 2: Conflict',
        summary: 'Introducing the main challenge or problem. The protagonist faces their first obstacle and begins to understand the stakes.'
      },
      {
        number: 3,
        title: 'Chapter 3: Resolution',
        summary: 'How the protagonists overcome their challenges. The climax of the story unfolds and leads to a satisfying conclusion.'
      }
    ];
    
    setChapterOutlines(dummyChapters);
    localStorage.setItem('chapterOutlines', JSON.stringify(dummyChapters));
  };

  const handleModify = (chapter: ChapterOutline) => {
    setEditedChapter({...chapter});
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editedChapter) return;

    const updatedChapters = chapterOutlines.map(chapter => 
      chapter.number === editedChapter.number ? editedChapter : chapter
    );

    setChapterOutlines(updatedChapters);
    
    // Save to localStorage
    localStorage.setItem('chapterOutlines', JSON.stringify(updatedChapters));
    
    setIsEditing(false);
  };

  const LoadingOverlay = () => {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-slate-800 rounded-xl p-8 shadow-2xl border border-amber-700/30">
          <h3 className="text-2xl font-bold text-center text-amber-500 mb-6 font-sans var(--font-quantico)">
            Creating Your Chapter Outlines
          </h3>
          
          <div className="space-y-4 mb-8">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-amber-300 text-center font-sans var(--font-capriola) mb-1">Your Selected Story Seed</p>
              <p className="text-white/80 text-sm text-center italic">{selectedSeedIdea?.summary}</p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-700/20 to-amber-500/20 rounded-full blur-xl"></div>
              <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin mx-auto"></div>
            </div>
            
            <div className="min-h-[80px] flex items-center justify-center">
              <p className="text-center text-white font-sans var(--font-capriola) animate-pulse text-lg">{loadingMessage}</p>
            </div>
          </div>
          
          <div className="w-full bg-slate-700 h-3 mt-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-700 to-amber-500" 
              style={{ width: `${loadingProgress}%`, transition: 'width 0.5s ease-in-out' }}
            ></div>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-white/60 text-sm">
              {Math.round(loadingProgress)}% complete
            </p>
            <p className="text-amber-400/70 text-xs mt-2">
              Our AI is carefully crafting chapter outlines based on your story seed.
              This may take a minute.
            </p>
          </div>
        </div>
        
        <div className="mt-10 max-w-md">
          <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-lg border border-amber-700/20">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
              <span className="text-white text-lg">💡</span>
            </div>
            <p className="text-white/80 text-sm">
              We're carefully structuring each chapter to create a captivating narrative flow with satisfying character arcs.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`${quantico.variable} ${capriola.variable} min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white`}>
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white`}>
      <div className="fixed left-4 top-4">
        <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
          <Link href="/create/assist-me/seed-ideas">Back</Link>
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <h1 className="text-4xl font-bold mb-2 text-center font-sans var(--font-quantico) pt-8">
          Chapter Outlines
        </h1>
        
        {selectedSeedIdea && (
          <div className="max-w-3xl mx-auto mb-10 bg-slate-800/50 p-6 rounded-lg border border-amber-700/30">
            <h2 className="text-xl font-bold mb-3 text-amber-500 font-sans var(--font-quantico)">
              Your Story Seed
            </h2>
            <p className="text-white/90 font-sans var(--font-capriola) leading-relaxed">
              {selectedSeedIdea.summary}
            </p>
          </div>
        )}
        
        <div className="mb-6 text-center">
          <p className="text-amber-300 font-sans var(--font-capriola)">
            Review your chapter outlines below. You can modify any chapter to adjust the story's direction.
          </p>
        </div>
        
        <div className="space-y-6">
          {chapterOutlines.length > 0 ? (
            chapterOutlines
              .sort((a, b) => a.number - b.number)
              .map((chapter, index) => (
                <div key={`chapter-${chapter.number}`} className="bg-slate-800/80 p-6 rounded-lg border border-amber-700/20 shadow-lg transition-all hover:shadow-amber-700/10 hover:border-amber-600/30">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-3 font-sans var(--font-quantico) text-amber-500">
                        {chapter.title}
                      </h2>
                      <div className="mb-4">
                        <p className="text-white/80 font-sans var(--font-capriola) leading-relaxed text-sm md:text-base">
                          {chapter.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end space-x-3 md:space-x-0 md:space-y-3">
                      <button 
                        className="bg-amber-600 text-white px-4 py-2 rounded-md font-bold hover:bg-amber-700 transition-colors flex items-center space-x-2"
                        onClick={() => handleModify(chapter)}
                      >
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-16 bg-slate-800/50 rounded-xl">
              <p className="text-white/60 text-xl font-sans var(--font-capriola)">No chapter outlines available yet.</p>
            </div>
          )}
        </div>
        
        <div className="mt-10 text-center">
          <button 
            className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-lg"
            onClick={() => {
              // Store finalized chapter outlines for next step
              localStorage.setItem('finalizedChapterOutlines', JSON.stringify(chapterOutlines));
              // Navigate to the next page
              router.push('/create/assist-me/seed-ideas/chapter-outlines/generate');
            }}
            disabled={chapterOutlines.length === 0}
          >
            Continue with Chapter Outlines
          </button>
        </div>
      </div>
      
      {isEditing && editedChapter && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 p-8 rounded-xl max-w-3xl w-full border border-amber-600/30 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 font-sans var(--font-quantico) text-amber-500">
              Edit Chapter Outline
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 font-sans var(--font-capriola) text-white/80">
                Chapter Title
              </label>
              <input 
                type="text"
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-md border border-slate-600 focus:border-amber-500 focus:ring-amber-500"
                value={editedChapter.title}
                onChange={(e) => setEditedChapter({...editedChapter, title: e.target.value})}
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium mb-2 font-sans var(--font-capriola) text-white/80">
                Chapter Summary
              </label>
              <textarea 
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-md border border-slate-600 focus:border-amber-500 focus:ring-amber-500 h-60 resize-none"
                value={editedChapter.summary}
                onChange={(e) => setEditedChapter({...editedChapter, summary: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button 
                className="bg-slate-700 text-white px-6 py-3 rounded-md font-bold hover:bg-slate-600 transition-colors"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-amber-600 text-white px-6 py-3 rounded-md font-bold hover:bg-amber-700 transition-colors"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes loadingBar {
          0% { width: 5%; }
          50% { width: 70%; }
          75% { width: 85%; }
          95% { width: 95%; }
          100% { width: 5%; }
        }
        .animate-loading-bar {
          animation: loadingBar 8s infinite;
        }
      `}</style>
    </div>
  );
};

export default Page;