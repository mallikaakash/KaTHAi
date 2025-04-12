"use client"
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Quantico, Capriola } from 'next/font/google';
import { GoogleGenAI } from "@google/genai";
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

interface SeedIdea {
  id: string;
  summary: string;
}

interface TextToSpeechResponse {
  request_id: string;
  audios: string[]; // base64 encoded audio
}

interface SpeechToTextResponse {
  request_id: string;
  transcript: string;
  timestamps?: {
    timestamps: {
      end_time_seconds: number[];
      start_time_seconds: number[];
      words: string[];
    }
  };
  diarized_transcript?: {
    entries: {
      transcript: string;
      start_time_seconds: number;
      end_time_seconds: number;
      speaker_id: string;
    }[];
  };
  language_code: string;
}

const Page = () => {
  const [storyData, setStoryData] = useState<CompleteStory | null>(null);
  const [seedIdea, setSeedIdea] = useState<SeedIdea | null>(null);
  const [bookCover, setBookCover] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverPrompt, setCoverPrompt] = useState('');
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Add selected language state
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [selectedSpeaker, setSelectedSpeaker] = useState("meera");

  useEffect(() => {
    // Load story data from localStorage
    const storedStory = localStorage.getItem('complete_story');
    const storedSeedIdea = localStorage.getItem('selectedSeedIdea');
    
    // Load previously generated cover if it exists
    const savedCover = localStorage.getItem('book_cover_url');
    if (savedCover) {
      setBookCover(savedCover);
    }
    
    let parsedStory = null;
    let parsedSeedIdea = null;
    
    if (storedStory) {
      try {
        parsedStory = JSON.parse(storedStory) as CompleteStory;
        setStoryData(parsedStory);
      } catch (error) {
        console.error('Error parsing story data:', error);
        setError('Failed to load story data. Please go back and try again.');
      }
    } else {
      setError('No story data found. Please go back and generate chapters first.');
    }
    
    if (storedSeedIdea) {
      try {
        parsedSeedIdea = JSON.parse(storedSeedIdea) as SeedIdea;
        setSeedIdea(parsedSeedIdea);
      } catch (error) {
        console.error('Error parsing seed idea:', error);
      }
    }
    
    // Create a default cover prompt based on available data
    if (parsedStory && parsedSeedIdea) {
      const mainCharacters = parsedStory.chapters[0]?.summary?.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b|\b[A-Z][a-z]+\b/g) || [];
      
      const defaultPrompt = `Design a professional, high-quality book cover for "The Phantom Next Door", a horror novel.
      

Story Summary: ${parsedSeedIdea.summary}

Design Style: The cover should reflect the standards of high-end publishers like Penguin or Scholastic—clean, compelling, and visually polished to appeal to a mainstream audience.

THE OUTPUT MUST BE JUST AN IMAGE AND NOTHING ELSE. NO NEED FOR TEXT, ETC.

The cover should be a single image, not a combination of multiple images.`;
      
      setCoverPrompt(defaultPrompt);
    } else if (parsedStory) {
      const defaultPrompt = `Create a professional, high-quality book cover for "${parsedStory.title}", a ${parsedStory.genre} novel.
The story is about: ${parsedStory.chapters[0]?.summary || ''}
Style: Photorealistic, cinematic, professional book cover with title text and author name well integrated.`;
      
      setCoverPrompt(defaultPrompt);
    }
  }, []);

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
    if (!storyData?.chapters[currentChapter]) return;
    
    setGeneratingAudio(true);
    setError(null);
    
    try {
      // Get the chapter content from the current chapter
      const chapterContent = storyData.chapters[currentChapter].content;
      
      // Sarvam AI has a limit of 500 characters per input
      // Split the content into chunks of 500 characters
      const textChunks = [];
      for (let i = 0; i < chapterContent.length; i += 490) {
        textChunks.push(chapterContent.slice(i, i + 490));
      }
      
      // Process only the first chunk for now (API allows up to 3 chunks)
      const textToProcess = textChunks.slice(0, 3);
      
      // Hardcoded API key for testing
      //IDHAR
      const apiKey = process.env.NEXT_PUBLIC_SARVAM_API_KEY;
      
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
        
        // Store the audio URL in localStorage for this chapter
        const audioUrls = JSON.parse(localStorage.getItem('chapter_audio_urls') || '{}');
        audioUrls[`chapter_${currentChapter}`] = audioBase64; // Store base64 for persistence
        localStorage.setItem('chapter_audio_urls', JSON.stringify(audioUrls));
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

  // Handle chapter change
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chapterIndex = parseInt(e.target.value, 10);
    setCurrentChapter(chapterIndex);
    
    // Check if we already have audio for this chapter in localStorage
    const audioUrls = JSON.parse(localStorage.getItem('chapter_audio_urls') || '{}');
    const savedAudio = audioUrls[`chapter_${chapterIndex}`];
    
    if (savedAudio) {
      // Convert base64 back to blob and create URL
      const blob = base64ToBlob(savedAudio, 'audio/wav');
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
    } else {
      setAudioUrl(null); // Clear previous audio
    }
  };

  const generateBookCover = async () => {
    if (!storyData) return;
    
    setGeneratingCover(true);
    setError(null);
    
    try {
      // Get API key from environment variable or use the hardcoded one
      //IDHAR
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ;
      
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: coverPrompt,
        config: {
          responseModalities: ["text","image"]
        },
      });

      const response = await model;
      
      if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        if (candidate && candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              console.log("Gemini response text:", part.text);
            } else if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              
              // Create a data URL for the image (works in browser environment)
              const imageUrl = `data:image/png;base64,${base64Data}`;
              setBookCover(imageUrl);
              localStorage.setItem('book_cover_url', imageUrl);
              console.log("Image generated and URL set.");
            }
          }
        } else {
          throw new Error('Invalid content structure in the response');
        }
      } else {
        throw new Error('No valid candidates found in the response');
      }
    } catch (error) {
      console.error('Error generating book cover:', error);
      setError('Failed to generate book cover. Please try again.');
    } finally {
      setGeneratingCover(false);
    }
  };

  const generatePdf = async () => {
    if (!storyData) return;
    
    setGeneratingPdf(true);
    setError(null);
    
    try {
      // Make API call to generate PDF
      const response = await axios.post('http://localhost:8000/api/story/generate-pdf', {
        story: storyData,
        cover_image_url: bookCover
      }, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadCover = () => {
    if (!bookCover) return;
    
    // Handle both base64 data URLs and blob URLs
    try {
      const link = document.createElement('a');
      
      // If it's a data URL, we can use it directly
      if (bookCover.startsWith('data:')) {
        link.href = bookCover;
      } 
      // If it's a blob URL, we can also use it directly
      else if (bookCover.startsWith('blob:')) {
        link.href = bookCover;
      }
      // For other URLs, might need to fetch and convert to blob first
      else {
        // Use existing URL as is
        link.href = bookCover;
      }
      
      link.download = `${storyData?.title || 'book'}_cover.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading cover:', error);
      setError('Failed to download cover. Please try again.');
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${storyData?.title || 'book'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
        <div className='flex flex-col items-center justify-center'>
          <div className="fixed left-4 top-4">
            <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
              <Link href="/create/assist-me/seed-ideas/chapter-outlines">Back</Link>
            </button>
          </div>
        </div>
        
        <div className="min-h-[80vh] w-screen max-w-6xl mx-auto bg-slate-50 shadow-2xl rounded-4xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-1 font-sans var(--font-quantico)">Finalize Your Story</h1>
          <h2 className="text-base sm:text-lg italic text-center text-amber-600 mb-4 sm:mb-6 font-sans var(--font-capriola)">Generate a book cover and create your audiobook</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {storyData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 sm:mb-6 flex-grow">
              {/* Book Cover Generation - Left Panel */}
              <div className="border-2 border-amber-200 bg-white rounded-xl p-3 sm:p-4 shadow-lg overflow-y-auto flex flex-col">
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-4 sticky top-0 bg-white py-2">
                  Book Cover
                </h2>
                
                <div className="mb-4">
                  <label className="block text-amber-800 mb-2 font-sans var(--font-capriola)">
                    Cover Description
                  </label>
                  <textarea 
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="Describe how you want your book cover to look..."
                    className="w-full h-32 p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
                  />
                  <p className="text-xs text-amber-600 mt-1">Uses Gemini AI to generate an image based on your story details.</p>
                </div>
                
                <button 
                  onClick={generateBookCover}
                  disabled={generatingCover || !storyData}
                  className={`bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) mb-4 ${
                    generatingCover ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {generatingCover ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Cover with Gemini AI...
                    </span>
                  ) : 'Generate Book Cover'}
                </button>
                
                {bookCover && (
                  <div className="flex-grow flex flex-col items-center justify-center border-2 border-amber-100 rounded-lg p-4 bg-amber-50/50 relative">
                    <div className="relative w-64 h-96 shadow-xl rounded-md overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={bookCover} 
                        alt="Generated Book Cover" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={downloadCover}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-sans var(--font-quantico) flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Cover
                      </button>
                      <button
                        onClick={generateBookCover}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg font-sans var(--font-quantico) text-sm"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Audiobook Creation - Right Panel */}
              <div className="border-2 border-amber-200 bg-white rounded-xl p-3 sm:p-4 shadow-lg overflow-y-auto flex flex-col">
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-4 sticky top-0 bg-white py-2">
                  Audiobook Creator
                </h2>
                
                <div className="bg-amber-50/50 p-4 rounded-lg border-2 border-amber-100 mb-6">
                  <h3 className="text-lg font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">
                    {/* {storyData.title} */}
                    The Phantom Next Door
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">Genre:</span> {storyData.genre}</p>
                    <p><span className="font-semibold">Author:</span> {storyData.author}</p>
                    <p><span className="font-semibold">Chapters:</span> {storyData.chapters.length}</p>
                  </div>
                </div>
                
                {/* Chapter Selection */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-amber-800 mb-2 font-sans var(--font-capriola)">
                      Select Chapter
                    </label>
                    <select
                      value={currentChapter}
                      onChange={handleChapterChange}
                      className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-800"
                    >
                      {storyData.chapters.map((chapter, index) => (
                        <option key={chapter.number} value={index}>
                          {chapter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Voice and Language Settings */}
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
                
                {/* Text-to-Speech Button */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                  <button 
                    onClick={generateSpeech}
                    disabled={generatingAudio || !storyData}
                    className={`bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) ${
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
                    ) : 'Generate Audiobook for This Chapter'}
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
                        Now playing - <br/>{storyData.chapters[currentChapter].title}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <a 
                        href={audioUrl} 
                        download={`${storyData.title}_Chapter_${storyData.chapters[currentChapter].number}.mp3`}
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
                
                <div className="flex justify-center mt-auto pt-4">
                  <button 
                    onClick={generatePdf}
                    disabled={generatingPdf || !storyData}
                    className={`bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) ${
                      generatingPdf ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {generatingPdf ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating PDF...
                      </span>
                    ) : 'Generate PDF'}
                  </button>
                  
                  {pdfUrl && (
                    <button
                      onClick={downloadPdf}
                      className="ml-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-sans var(--font-quantico) flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="mt-2 text-xl font-medium text-amber-800">No Story Data Found</h3>
                <p className="mt-1 text-gray-600">Please go back and generate chapters first.</p>
                <div className="mt-6">
                  <Link href="/create/assist-me/seed-ideas/chapter-outlines" className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-sans var(--font-quantico)">
                    Return to Chapter Outlines
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-auto pt-6">
            <Link 
              href="/" 
              className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-base sm:text-lg"
            >
              Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
