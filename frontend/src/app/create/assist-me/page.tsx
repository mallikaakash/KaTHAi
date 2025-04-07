'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Quantico, Capriola } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function App() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [setting, setSetting] = useState('');
  const [genre, setGenre] = useState('');
  const [chapters, setChapters] = useState(1);
  const [writingStyle, setWritingStyle] = useState('');
  const [narrationStyle, setNarrationStyle] = useState('');
  const [characterCount, setCharacterCount] = useState(1);
  const [characters, setCharacters] = useState([{ name: '', description: '' }]);
  const [storyMode, setStoryMode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Creative writing process messages
  const loadingMessages = [
    "Deconstructing plot ideas...",
    "Forming characters...",
    "Generating character outlines...",
    "Developing plot lines...",
    "Crafting character arcs according to plot...",
    "Weaving narrative threads...",
    "Adding literary devices...",
    "Balancing pacing and tension...",
    "Ahhhaaa...yes we can add this twist!",
    "This will be a great chapter cliffhanger!",
    "Sprinkling in foreshadowing...",
    "Perfecting emotional arcs...",
    "Refining dialogue patterns...",
    "Ensuring narrative consistency...",
    "Building world details...",
    "Almost done...",
    "Sorry this is taking long, creating art takes time!",
    "Polishing final story seeds...",
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

  const genres = [
    'Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Horror', 
    'Adventure', 'Historical', 'Cyberpunk', 'Thriller', 'Comedy',
    'Drama', 'Dystopian', 'Young Adult', 'Children\'s'
  ];

  const writingStyles = [
    { value: 'Contemporary', label: 'Contemporary', description: 'Modern, straightforward narrative with clean prose' },
    { value: 'Literary', label: 'Literary', description: 'Eloquent prose with deeper themes and symbolism' },
    { value: 'Regency', label: 'Regency Romance', description: 'Manners, wit, and blossoming romance, reminiscent of Jane Austen' },
    { value: 'YA_Adventure', label: 'Young Adult Adventure', description: 'Action-packed stories with humor and relatable characters' },
    { value: 'Medieval', label: 'Old English', description: 'Knights, dragons, and archaic language with historical tone' },
    { value: 'Hardboiled', label: 'Hard-Boiled Detective', description: 'Gritty, cynical narration with sharp dialogue' },
    { value: 'SciFi_Thriller', label: 'Sci-Fi Thriller', description: 'Futuristic landscapes with suspenseful plots and high stakes' },
    { value: 'Poetic', label: 'Poetic', description: 'Lyrical prose with rich imagery and metaphors' },
    { value: 'Minimalist', label: 'Minimalist', description: 'Sparse, concise writing with understated emotion' }
  ];

  const narrationStyles = [
    { value: 'First_Person', label: 'First Person', description: 'Story told from "I/we" perspective' },
    { value: 'Second_Person', label: 'Second Person', description: 'Story told from "you" perspective' },
    { value: 'Third_Person', label: 'Third Person Limited', description: 'Story follows one character\'s perspective' },
    { value: 'Third_Person_Omniscient', label: 'Third Person Omniscient', description: 'All-knowing narrator with access to all characters\' thoughts' },
    { value: 'Epistolary', label: 'Epistolary', description: 'Story told through letters, documents, or diary entries' },
    { value: 'Stream_of_Consciousness', label: 'Stream of Consciousness', description: 'Flowing narrative that mimics thought processes' }
  ];

  const handleCharacterCountChange = (count: number) => {
    setCharacterCount(count);
    setCharacters(Array(count).fill({ name: '', description: '' }));
  };

  const updateCharacter = (index: number, field: 'name' | 'description', value: string) => {
    const newCharacters = [...characters];
    newCharacters[index] = { ...newCharacters[index], [field]: value };
    setCharacters(newCharacters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Transform the data to match the backend's expected format
      const formattedCharacters = characters.map(char => ({
        name: char.name,
        description: char.description
      }));

      const storySettings = {
        narrative_perspective: narrationStyle,
        setting_description: setting,
        time_period: null,
        world_building_details: null
      };

      const requestData = {
        genre: genre,
        idea: prompt,
        target_chapter_count: chapters,
        target_chapter_length: 3000,  // default value
        writing_style: writingStyle,
        character_count: characters.length,
        characters: formattedCharacters,
        story_settings: storySettings
      };

      console.log('Sending request with formatted data:', requestData);

      const response = await axios.post('http://localhost:8001/api/story/generate-seed-ideas', requestData);

      console.log('Received response:', response.data);

      // Store the response data in localStorage
      localStorage.setItem('storyData', JSON.stringify(response.data));

      // Navigate to results page
      router.push('/create/assist-me/seed-ideas');

    } catch (error) {
      console.error('Error generating seed ideas:', error);
      // You may want to add error handling UI here
    } finally {
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
          <h3 className="text-xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">Creating Your Story Seeds</h3>
          <div className="h-12">
            <p className="text-center text-amber-700 font-sans var(--font-capriola) animate-pulse">{loadingMessage}</p>
          </div>
          <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-700 animate-loading-bar"></div>
          </div>
        </div>
        <p className="text-white mt-6 font-sans var(--font-capriola) text-sm max-w-md text-center">
          We're crafting unique story ideas just for you. This creative process may take a moment...
        </p>
      </div>
    );
  };

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      {isLoading && <LoadingOverlay />}
      <div className="min-h-screen bg-slate-900/85 px-4 py-8">
      <div className='flex flex-col items-center justify-center'>
     
        <div className="fixed left-4 top-4">
          <button className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'>
            <Link href="/create">
              Back
            </Link>
          </button>
        </div>
      </div>
        <div className="max-w-4xl mx-auto bg-slate-50 shadow-2xl rounded-2xl p-6 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-center text-amber-800 mb-1 font-sans var(--font-quantico)">Narrative Forge</h1>
          <h2 className="text-lg italic text-center text-amber-600 mb-6 font-sans var(--font-capriola)">Craft your literary masterpiece with AI</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-base font-medium text-slate-800 font-sans var(--font-quantico)">Story Concept</label>
                <textarea
                  className="w-full rounded-lg p-3 border-2 border-amber-200 shadow-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 h-24 bg-white text-sm"
                  placeholder="What's your main story idea?"
                  style={{ color: 'rgba(0, 0, 0, 0.8)' }}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-base font-medium text-slate-800 font-sans var(--font-quantico)">Setting Details</label>
                <textarea
                  className="w-full rounded-lg p-3 border-2 border-amber-200 shadow-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 h-24 bg-white text-sm"
                  placeholder="Describe your story's setting..."
                  style={{ color: 'rgba(0, 0, 0, 0.8)' }}
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-medium text-slate-800 font-sans var(--font-quantico)">Genre</label>
                <select
                  className="w-full p-2 rounded-lg border-2 border-amber-200 shadow-sm bg-white focus:ring-amber-400 focus:border-amber-400 text-sm text-gray-800/60"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-medium text-slate-800 font-sans var(--font-quantico)">Chapters</label>
                <input
                  type="number"
                  className="w-full p-2 rounded-lg border-2 border-amber-200 shadow-sm bg-white focus:ring-amber-400 focus:border-amber-400 text-sm text-gray-800/60"
                  min={1}
                  max={12}
                  value={chapters}
                  onChange={(e) => setChapters(parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-base font-medium text-slate-800 font-sans var(--font-quantico)">Characters</label>
                <input
                  type="number"
                  className="w-full p-2 rounded-lg border-2 border-amber-200 shadow-sm bg-white focus:ring-amber-400 focus:border-amber-400 text-sm text-gray-800/60"
                  min={1}
                  max={10}
                  value={characterCount}
                  onChange={(e) => handleCharacterCountChange(parseInt(e.target.value))}
                />
              </div>
            </div>

            {characterCount > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 text-center font-sans var(--font-quantico)">Character Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((char, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 rounded-lg space-y-2 border-2 border-amber-200 shadow-md">
                      <div className="text-sm font-medium text-amber-700 mb-1 font-sans var(--font-quantico)">Character {idx + 1}</div>
                      <input
                        type="text"
                        placeholder="Character Name"
                        className="w-full p-2 rounded-lg border-2 border-amber-200 shadow-sm bg-white focus:ring-amber-400 focus:border-amber-400 text-sm font-sans var(--font-capriola)"
                        style={{ color: 'rgba(0, 0, 0, 0.8)' }}
                        value={char.name}
                        onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                      />
                      <textarea
                        placeholder="Physical appearance, personality traits, background, motivations..."
                        className="w-full p-2 rounded-lg border-2 border-amber-200 shadow-sm bg-white focus:ring-amber-400 focus:border-amber-400 h-20 text-sm font-sans var(--font-capriola)"
                        style={{ color: 'rgba(0, 0, 0, 0.8)' }}
                        value={char.description}
                        onChange={(e) => updateCharacter(idx, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800 text-center font-sans var(--font-quantico)">Writing Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {writingStyles.map((style) => (
                  <div key={style.value} className="relative group">
                    <button
                      type="button"
                      onClick={() => setWritingStyle(style.value)}
                      className={`w-full p-3 rounded-full text-center transition-all bg-white border-2 border-amber-400 shadow-md hover:bg-amber-50 ${
                        writingStyle === style.value 
                          ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 border-amber-600' 
                          : 'text-slate-800 hover:border-amber-500'
                      }`}
                    >
                      <span className="font-sans var(--font-capriola)">{style.label}</span>
                    </button>
                    <div className="absolute z-10 invisible group-hover:visible bg-slate-900 text-white p-2 rounded mt-1 text-xs w-full font-sans var(--font-capriola)">
                      {style.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-800 text-center font-sans var(--font-quantico)">Narration Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {narrationStyles.map((style) => (
                  <div key={style.value} className="relative group">
                    <button
                      type="button"
                      onClick={() => setNarrationStyle(style.value)}
                      className={`w-full p-3 rounded-full text-center transition-all bg-white border-2 border-amber-400 shadow-md hover:bg-amber-50 ${
                        narrationStyle === style.value 
                          ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 border-amber-600' 
                          : 'text-slate-800 hover:border-amber-500'
                      }`}
                    >
                      <span className="font-sans var(--font-capriola)">{style.label}</span>
                    </button>
                    <div className="absolute z-10 invisible group-hover:visible bg-slate-900 text-white p-2 rounded mt-1 text-xs w-full font-sans var(--font-capriola)">
                      {style.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium text-slate-800 text-center mb-4 font-sans var(--font-quantico)">Story Structure</label>
              <div className="flex justify-center gap-6">
                <button
                  type="button"
                  className={`w-48 p-3 rounded-full text-center transition-all font-sans var(--font-capriola) bg-white border-2 border-amber-400 shadow-md hover:bg-amber-50 ${
                    storyMode === 'multi-chapter' 
                      ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 border-amber-600' 
                      : 'text-slate-800 hover:border-amber-500'
                  }`}
                  onClick={() => setStoryMode('multi-chapter')}
                >
                  Multi-Chapter
                </button>
                <button
                  type="button"
                  className={`w-48 p-3 rounded-full text-center transition-all font-sans var(--font-capriola) bg-white border-2 border-amber-400 shadow-md hover:bg-amber-50 ${
                    storyMode === 'extended-narrative' 
                      ? 'text-white bg-gradient-to-r from-amber-600 to-amber-700 border-amber-600' 
                      : 'text-slate-800 hover:border-amber-500'
                  }`}
                  onClick={() => setStoryMode('extended-narrative')}
                >
                  Extended Narrative
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white border-2 border-amber-400 text-slate-800 py-3 px-6 rounded-full text-base font-semibold shadow-lg hover:bg-amber-50 transition-all font-sans var(--font-quantico) disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Forging Ideas..." : "Forge Seed Ideas"}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .font-sans.var\\(--font-quantico\\) {
          font-family: var(--font-quantico);
        }
        .font-sans.var\\(--font-capriola\\) {
          font-family: var(--font-capriola);
        }
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
}