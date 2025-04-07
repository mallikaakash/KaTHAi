"use client"
import React, { useState, useEffect } from 'react';
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

interface ChapterOutline {
  number: number;
  title: string;
  summary: string;
}

const Page = () => {
  const [chapterOutlines, setChapterOutlines] = useState<ChapterOutline[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterOutline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedOutlines = localStorage.getItem('chapterOutlines');
    if (storedOutlines) {
      try {
        const parsedOutlines = JSON.parse(storedOutlines);
        // Handle both formats: direct array or nested in chapter_outlines
        const outlines = Array.isArray(parsedOutlines) 
          ? parsedOutlines 
          : (parsedOutlines.chapter_outlines || []);
        
        setChapterOutlines(outlines.sort((a: ChapterOutline, b: ChapterOutline) => a.number - b.number));
        if (outlines.length > 0) {
          setSelectedChapter(outlines[0]);
        }
      } catch (error) {
        console.error('Error parsing chapter outlines:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleChapterSelect = (chapter: ChapterOutline) => {
    setSelectedChapter(chapter);
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
                      <h3 className="text-lg font-semibold mb-3 font-sans var(--font-quantico) text-amber-800">
                        Summary
                      </h3>
                      <p className="text-gray-800 font-sans var(--font-capriola) leading-relaxed">
                        {selectedChapter.summary}
                      </p>
                    </div>
                    
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
              Continue with Chapter Outlines
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
