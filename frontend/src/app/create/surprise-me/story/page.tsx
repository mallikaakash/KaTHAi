'use client'
import React, { useEffect, useState } from 'react';
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

const StoryPage = () => {
  const router = useRouter();
  const [story, setStory] = useState<SurpriseStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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