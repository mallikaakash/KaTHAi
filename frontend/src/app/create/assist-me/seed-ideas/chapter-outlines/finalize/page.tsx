"use client"
import React, { useState, useEffect } from 'react';
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

const Page = () => {
  const [storyData, setStoryData] = useState<CompleteStory | null>(null);
  const [seedIdea, setSeedIdea] = useState<SeedIdea | null>(null);
  const [bookCover, setBookCover] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverPrompt, setCoverPrompt] = useState('');

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
      
      const defaultPrompt = `Create a professional, high-quality book cover for "The Phantom Next Door a Horror novel.
The story is about: ${parsedSeedIdea.summary}
Setting: ${parsedStory.chapters[0]?.summary?.split('.')[0] || ''}
Style: A professional, high=quality book cover that resembles high-end publishers such as Penguin Publishers or Scholastic books.`;
      
      setCoverPrompt(defaultPrompt);
    } else if (parsedStory) {
      const defaultPrompt = `Create a professional, high-quality book cover for "${parsedStory.title}", a ${parsedStory.genre} novel.
The story is about: ${parsedStory.chapters[0]?.summary || ''}
Style: Photorealistic, cinematic, professional book cover with title text and author name well integrated.`;
      
      setCoverPrompt(defaultPrompt);
    }
  }, []);

  const generateBookCover = async () => {
    if (!storyData) return;
    
    setGeneratingCover(true);
    setError(null);
    
    try {
      // Get API key from environment variable - Replace with your actual implementation
      // In production, you should use a secured environment variable
      const apiKey = "AIzaSyBG3RSqSTWtrnFbOHvH5CH4EzImbszXbLA";
      
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
          <h2 className="text-base sm:text-lg italic text-center text-amber-600 mb-4 sm:mb-6 font-sans var(--font-capriola)">Generate a book cover and download your completed story</h2>
          
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
              
              {/* PDF Generation - Right Panel */}
              <div className="border-2 border-amber-200 bg-white rounded-xl p-3 sm:p-4 shadow-lg overflow-y-auto flex flex-col">
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-4 sticky top-0 bg-white py-2">
                  Complete Story
                </h2>
                
                <div className="bg-amber-50/50 p-4 rounded-lg border-2 border-amber-100 mb-6">
                  <h3 className="text-lg font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">
                    The Phantom Next Door
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">Genre:</span> {storyData.genre}</p>
                    <p><span className="font-semibold">Author:</span> {storyData.author}</p>
                    <p><span className="font-semibold">Total Words:</span> {storyData.total_word_count.toLocaleString()}</p>
                    <p><span className="font-semibold">Chapters:</span> {storyData.chapters.length}</p>
                  </div>
                </div>
                
                <div className="mb-4 flex-grow overflow-y-auto">
                  <h3 className="text-lg font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">
                    Chapter Summary
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-white border border-amber-200 rounded-lg">
                    {storyData.chapters.map((chapter) => (
                      <div key={chapter.number} className="border-b border-amber-100 pb-2 last:border-b-0">
                        <p className="font-semibold">Chapter {chapter.number}: {chapter.title}</p>
                        <p className="text-sm text-gray-600">{chapter.word_count.toLocaleString()} words</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-center mt-auto">
                  <button 
                    onClick={generatePdf}
                    disabled={generatingPdf || !storyData}
                    className={`w-full bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) mb-3 ${
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
                      className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 px-6 py-3 rounded-lg font-sans var(--font-quantico) flex items-center justify-center"
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
              href="/dashboard" 
              className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-base sm:text-lg"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
