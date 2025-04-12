'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface SurpriseStory {
  title: string;
  content: string;
  category: string;
  story_type: string;
  length: string;
  tone: string;
  target_audience: string;
  word_count: number;
  created_at: string;
}

interface TextToSpeechResponse {
  request_id: string;
  audios: string[]; // base64 encoded audio
}

const StoryPage = () => {
  const router = useRouter();
  const [story, setStory] = useState<SurpriseStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio generation states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Language and speaker selection
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [selectedSpeaker, setSelectedSpeaker] = useState("meera");

  useEffect(() => {
    // Retrieve the story from localStorage
    const storedStory = localStorage.getItem('surpriseStory');
    
    if (storedStory) {
      try {
        const parsedStory = JSON.parse(storedStory);
        setStory(parsedStory);
      } catch (error) {
        console.error('Error parsing story from localStorage:', error);
        setError('Failed to load the story. Please try generating a new one.');
      }
    } else {
      setError('No story found. Please generate a new story.');
    }
    
    setIsLoading(false);
  }, []);

  const handleBack = () => {
    router.push('/create/surprise-me');
  };

  const handleGenerateNew = () => {
    router.push('/create/surprise-me');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Function to handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
    setAudioUrl(null); // Clear previous audio
  };
  
  // Function to handle speaker change
  const handleSpeakerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpeaker(e.target.value);
    setAudioUrl(null); // Clear previous audio
  };

  // Function to generate speech from text using Sarvam AI
  const generateSpeech = async () => {
    if (!story?.content) return;
    
    setGeneratingAudio(true);
    setError(null);
    
    try {
      // Get the story content
      const storyContent = story.content;
      
      // Sarvam AI has a limit of 500 characters per input
      // Split the content into chunks of 500 characters
      const textChunks = [];
      for (let i = 0; i < storyContent.length; i += 490) {
        textChunks.push(storyContent.slice(i, i + 490));
      }
      
      // Process only the first chunk for now (API allows up to 3 chunks)
      const textToProcess = textChunks.slice(0, 3);
      
      // Hardcoded API key for testing
      const apiKey = "4c271227-c828-428a-8253-0e5ce0b13ed5";
      
      // Call Sarvam AI Text-to-Speech API with correct header
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey
        },
        body: JSON.stringify({
          inputs: textToProcess,
          target_language_code: selectedLanguage,
          speaker: selectedSpeaker,
          pitch: 0,
          pace: 0.8,
          loudness: 1.55,
          speech_sample_rate: 22050,
          enable_preprocessing: false,
          model: "bulbul:v1"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      
      const data: TextToSpeechResponse = await response.json();
      
      if (data.audios && data.audios.length > 0) {
        // Convert base64 audio to a playable URL
        const audioBase64 = data.audios[0];
        const blob = base64ToBlob(audioBase64, 'audio/wav');
        const audioUrl = URL.createObjectURL(blob);
        
        setAudioUrl(audioUrl);
        
        // Remove localStorage storage to avoid quota exceeded error
        // We'll just keep the audio URL in memory
      } else {
        throw new Error('No audio data received from the API');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setError(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingAudio(false);
    }
  };
  
  // Utility function to convert base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };

  // Function to toggle audio playback
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (isLoading) {
    return (
      <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
        <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">Loading Your Story</h3>
            <p className="text-center text-amber-700 font-sans var(--font-capriola)">Please wait while we prepare your story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
        <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">Error</h3>
            <p className="text-center text-gray-700 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <button 
                className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors font-sans var(--font-quantico)"
                onClick={handleBack}
              >
                Go Back
              </button>
              <button 
                className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)"
                onClick={handleGenerateNew}
              >
                Generate New Story
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      <div className="min-h-screen bg-slate-900/85 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="fixed left-4 top-4">
            <button 
              className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'
              onClick={handleBack}
            >
              Back
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">{story?.title}</h1>
            
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-sans var(--font-quantico)">{story?.category}</span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-sans var(--font-quantico)">{story?.story_type}</span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-sans var(--font-quantico)">{story?.length}</span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-sans var(--font-quantico)">{story?.tone}</span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-sans var(--font-quantico)">{story?.target_audience}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500 mb-8 border-b border-amber-200 pb-4">
              <span>Word Count: {story?.word_count}</span>
              <span>Created: {story?.created_at ? formatDate(story.created_at) : 'Unknown'}</span>
            </div>
            
            <div className="prose prose-lg max-w-none prose-headings:text-amber-800 prose-a:text-amber-600">
              {story?.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-800 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* Audio Generation Section */}
            <div className="mt-12 border-t border-amber-200 pt-8">
              <h2 className="text-2xl font-bold text-center text-amber-800 mb-6 font-sans var(--font-quantico)">Listen to Your Story</h2>
              
              <div className="bg-amber-50/50 p-4 rounded-lg border-2 border-amber-100 mb-6">
                <h3 className="text-lg font-semibold text-amber-800 font-sans var(--font-quantico) mb-4">
                  Audiobook Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-amber-800 mb-2 font-sans var(--font-capriola)">
                      Language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={handleLanguageChange}
                      className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
                    >
                      <option value="bn-IN">Bengali</option>
                      <option value="en-IN">English (India)</option>
                      <option value="gu-IN">Gujarati</option>
                      <option value="hi-IN">Hindi</option>
                      <option value="kn-IN">Kannada</option>
                      <option value="ml-IN">Malayalam</option>
                      <option value="mr-IN">Marathi</option>
                      <option value="od-IN">Odia</option>
                      <option value="pa-IN">Punjabi</option>
                      <option value="ta-IN">Tamil</option>
                      <option value="te-IN">Telugu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-amber-800 mb-2 font-sans var(--font-capriola)">
                      Voice
                    </label>
                    <select
                      value={selectedSpeaker}
                      onChange={handleSpeakerChange}
                      className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
                    >
                      <option value="meera">meera</option>
                      <option value="arvind">arvind</option>
                      <option value="vidya">vidya</option>
                      <option value="arjun">arjun</option>
                    </select>
                  </div>
                </div>
                
                <button 
                  onClick={generateSpeech}
                  disabled={generatingAudio || !story}
                  className={`bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) w-full ${
                    generatingAudio ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {generatingAudio ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Audio...
                    </span>
                  ) : 'Generate Audiobook'}
                </button>
              </div>
              
              {/* Audio Player */}
              {audioUrl && (
                <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">
                    Audiobook Player
                  </h3>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button 
                      onClick={togglePlayback}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    
                    <audio 
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={handleAudioEnded}
                      controls
                      className="w-full"
                    />
                    
                    <div className="text-amber-800">
                      Now playing - <br/>{story?.title}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <a 
                      href={audioUrl} 
                      download={`${story?.title || 'story'}.mp3`}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-sans var(--font-quantico) flex items-center justify-center w-full md:w-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Audio
                    </a>
                  </div>
                  
                  <p className="text-sm text-amber-600 mt-4 text-center">
                    Audio generated with Sarvam AI Text-to-Speech
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-12 flex justify-center">
              <button 
                className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-lg"
                onClick={handleGenerateNew}
              >
                Generate Another Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPage; 