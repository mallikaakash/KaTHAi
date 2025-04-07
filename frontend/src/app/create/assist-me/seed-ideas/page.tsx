'use client'
import React, { useEffect, useState } from 'react';
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

interface BackendResponse {
  seed_ideas: SeedIdea[];
}

interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
}

interface DetailedOutlineResponse {
  chapter_outlines: ChapterOutline[];
}

interface StoryData {
  title: string;
  content: string;
  characters: Character[];
  genre: string;
  writingStyle: string;
  narrationStyle: string;
  storyMode: string;
  chapters: number;
  setting: string;
  prompt: string;
}

const Page = () => {
  const router = useRouter();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [seedIdeas, setSeedIdeas] = useState<SeedIdea[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Creative writing process messages
  const loadingMessages = [
    "Preparing your story framework...",
    "Crafting narrative elements...",
    "Building character arcs...",
    "Establishing plot structure...",
    "Balancing pacing and tension...",
    "This will be a great story seed!",
    "Almost ready for your creative journey...",
  ];

  // Rotate through loading messages
  useEffect(() => {
    if (!isLoading) return;
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);
    
    setLoadingMessage(loadingMessages[0]);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const data = localStorage.getItem('storyData');
    if (data) {
      try {
        const parsedData = JSON.parse(data) as BackendResponse;
        if (parsedData.seed_ideas && Array.isArray(parsedData.seed_ideas)) {
          setSeedIdeas(parsedData.seed_ideas);
        } else {
          console.error('Seed ideas data is not in the expected format:', parsedData);
        }
      } catch (error) {
        console.error('Error parsing storyData from localStorage:', error);
      }
    }
  }, []);

  // Handle individual story edits
  const handleEditStory = (id: string, summary: string) => {
    const updatedSeedIdeas = seedIdeas.map(idea => 
      idea.id === id ? { ...idea, summary } : idea
    );
    setSeedIdeas(updatedSeedIdeas);
    localStorage.setItem('storyData', JSON.stringify({ seed_ideas: updatedSeedIdeas }));
  };

  // Handle selection and submission to backend
  const handleSelectStory = (id: string) => {
    setSelectedStoryId(prevId => (prevId === id ? null : id));
  };

  const handleSubmitSelectedStory = async () => {
    if (selectedStoryId === null) return;
    
    setIsLoading(true);
    setError(null);
    const selectedIdea = seedIdeas.find(idea => idea.id === selectedStoryId);
    
    if (!selectedIdea) {
      setIsLoading(false);
      setError("Selected story not found");
      return;
    }
    
    try {
      // Store the selected seed idea for the next page
      localStorage.setItem('selectedSeedIdea', JSON.stringify(selectedIdea));
      
      // Get story input data from localStorage
      const storyInputData = localStorage.getItem('storyData');
      const parsedStoryData = storyInputData ? JSON.parse(storyInputData) : null;
      
      // Extract original input data that was used to generate seed ideas
      const originalStoryData = localStorage.getItem('originalStoryInput');
      const originalData = originalStoryData ? JSON.parse(originalStoryData) : null;
      
      // Prepare story settings with proper format
      const storySettings = {
        narrative_perspective: originalData?.narrationStyle || "Third Person",
        setting_description: originalData?.setting || "Contemporary setting",
        time_period: "Contemporary",
        world_building_details: "Magic exists but is hidden from the public"
      };
      
      // Prepare characters with proper format
      const characters = Array.isArray(originalData?.characters) ? 
        originalData.characters.slice(0, 15).map((char: any) => ({
          name: (char.name || "").trim() || "Character",
          description: (char.description || "").trim() || "A character in the story"
        })) : [{
          name: "Main Character",
          description: "The protagonist of the story"
        }];
      
      // Prepare request data matching the expected format
      const requestData = {
        seed_summary: selectedIdea.summary,
        genre: (originalData?.genre || "Fantasy").trim(),
        target_chapter_count: Math.max(1, Math.min(30, parseInt(originalData?.chapters) || 3)),
        target_chapter_length: 3000,
        writing_style: (originalData?.writingStyle || "descriptive and whimsical").trim(),
        character_count: characters.length,
        characters: characters,
        story_settings: storySettings
      };
      
      console.log("Request data:", requestData);
      
      // Make API call to the backend endpoint
      const response = await axios.post('http://localhost:8000/api/story/create-detailed-outline', requestData);
      
      console.log("API response:", response.data);
      
      // Handle the response
      if (response.data && response.data.chapter_outlines) {
        // Store the chapter outlines for the next page
        localStorage.setItem('chapterOutlines', JSON.stringify(response.data));
        
        // Navigate to the next page
        router.push('/create/assist-me/seed-ideas/chapter-outlines');
      } else {
        throw new Error('Invalid response format from the server');
      }
      
    } catch (error) {
      console.error('Error submitting story:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing your request');
      setIsLoading(false);
    }
  };

  // Loading overlay component
  const LoadingOverlay = () => {
    return (
      <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">Processing Your Selection</h3>
          <div className="h-12">
            <p className="text-center text-amber-700 font-sans var(--font-capriola) animate-pulse">{loadingMessage}</p>
          </div>
          <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-700 animate-loading-bar"></div>
          </div>
        </div>
        <p className="text-white mt-6 font-sans var(--font-capriola) text-sm max-w-md text-center">
          We're preparing your story seed for the next creative step...
        </p>
      </div>
    );
  };

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      {isLoading && <LoadingOverlay />}
      <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
        <div className='flex flex-col items-center justify-center'>
          <div className="fixed left-4 top-4">
            <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
              <Link href="/create/assist-me">Back</Link>
            </button>
          </div>
        </div>
        
        <div className="min-h-[80vh] w-screen max-w-6xl mx-auto bg-slate-50 shadow-2xl rounded-4xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-1 font-sans var(--font-quantico)">Story Seeds</h1>
          <h2 className="text-base sm:text-lg italic text-center text-amber-600 mb-4 sm:mb-6 font-sans var(--font-capriola)">Select a narrative seed to develop further</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {seedIdeas.length === 0 ? (
            <div className="text-center py-8 flex-grow">
              <p className="text-lg text-amber-800">No story ideas available. Please go back and create some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-4 mb-4 sm:mb-6 flex-grow overflow-y-auto">
              {seedIdeas.map((idea) => (
                <div 
                  key={idea.id} 
                  className={`border-2 rounded-xl p-3 sm:p-4 shadow-lg ${selectedStoryId === idea.id ? 'border-amber-600 bg-amber-50' : 'border-amber-200 bg-white'} w-full flex flex-col`}
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{`Story Seed ${idea.id.split('_')[1] ? parseInt(idea.id.split('_')[1]) + 1 : ''}`}</h2>
                  <div className="mb-3 flex-grow">
                    <textarea 
                      className="w-full h-full min-h-[120px] border rounded-lg p-2 text-sm border-amber-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-800 resize-none"
                      value={idea.summary} 
                      onChange={(e) => handleEditStory(idea.id, e.target.value)}
                    />
                  </div>
                  <button 
                    className={`w-full py-2 px-4 rounded-lg font-sans var(--font-quantico) transition-colors ${
                      selectedStoryId === idea.id 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                    onClick={() => handleSelectStory(idea.id)}
                  >
                    {selectedStoryId === idea.id ? 'Deselect' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {selectedStoryId !== null && (
            <div className="flex justify-center mt-auto pt-4">
              <button 
                className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-base sm:text-lg"
                onClick={handleSubmitSelectedStory}
              >
                Continue with Selected Seed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default Page;
