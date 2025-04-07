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
      <div className={`${quantico.variable} ${capriola.variable} min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center`}>
        <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white`}>
      <div className="fixed left-4 top-4 z-10">
        <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
          <Link href="/create/assist-me/seed-ideas">Back</Link>
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8 text-center font-sans var(--font-quantico) pt-8 text-amber-500">
          Chapter Outlines
        </h1>
        
        {chapterOutlines.length === 0 ? (
          <div className="bg-slate-800/80 p-8 rounded-lg shadow-lg text-center">
            <p className="text-xl text-amber-300 font-sans var(--font-capriola)">
              No chapter outlines found. Please go back and generate some outlines first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chapter List - Left Panel */}
            <div className="bg-slate-800/80 p-6 rounded-lg shadow-lg border border-amber-700/20 lg:col-span-1 h-[70vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 font-sans var(--font-quantico) text-amber-500 sticky top-0 bg-slate-800 py-2">
                Chapters
              </h2>
              <div className="space-y-3">
                {chapterOutlines.map((chapter) => (
                  <div 
                    key={chapter.number}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedChapter?.number === chapter.number 
                        ? 'bg-amber-700/30 border-l-4 border-amber-500' 
                        : 'bg-slate-700/50 hover:bg-slate-700/80'
                    }`}
                    onClick={() => handleChapterSelect(chapter)}
                  >
                    <h3 className="font-bold text-amber-400 font-sans var(--font-quantico)">
                      Chapter {chapter.number}
                    </h3>
                    <p className="text-white/90 text-sm truncate">{chapter.title}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chapter Detail - Right Panel */}
            <div className="bg-slate-800/80 p-6 rounded-lg shadow-lg border border-amber-700/20 lg:col-span-2 h-[70vh] overflow-y-auto">
              {selectedChapter ? (
                <div className="animate-fadeIn">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-white font-bold">{selectedChapter.number}</span>
                    </div>
                    <h2 className="text-3xl font-bold font-sans var(--font-quantico) text-amber-500">
                      {selectedChapter.title}
                    </h2>
                  </div>
                  
                  <div className="bg-slate-700/30 p-6 rounded-lg border border-amber-600/20">
                    <h3 className="text-xl font-bold mb-4 font-sans var(--font-quantico) text-amber-400">
                      Summary
                    </h3>
                    <p className="text-white/90 font-sans var(--font-capriola) leading-relaxed text-lg">
                      {selectedChapter.summary}
                    </p>
                  </div>
                  
                  <div className="mt-8 flex justify-between">
                    <button 
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
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
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
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
                  <p className="text-white/60 text-xl font-sans var(--font-capriola)">
                    Select a chapter to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-10 text-center">
          <button 
            className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-lg"
            disabled={chapterOutlines.length === 0}
          >
            Continue with Chapter Outlines
          </button>
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
