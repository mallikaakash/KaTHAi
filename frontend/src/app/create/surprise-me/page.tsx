'use client'
import React, { useState } from 'react';
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

// Story categories and options
const storyCategories = {
  children: {
    name: "Children's Stories",
    description: "Perfect for bedtime reading to put your tiny tots to sleep",
    options: [
      { id: "fairy_tale", name: "Fairy Tale", description: "Magical stories with princesses, dragons, and enchanted forests" },
      { id: "fable", name: "Fable", description: "Stories with moral lessons featuring animals as characters" },
      { id: "adventure", name: "Adventure", description: "Exciting journeys and quests for young heroes" },
      { id: "educational", name: "Educational", description: "Stories that teach about science, history, or life skills" }
    ],
    audience: [
      { id: "toddlers", name: "Toddlers", description: "Ages 2-4" },
      { id: "young_children", name: "Young Children", description: "Ages 5-7" },
      { id: "older_children", name: "Older Children", description: "Ages 8-12" }
    ]
  },
  fiction: {
    name: "Adult Fiction",
    description: "Variety of fiction genres for adult readers",
    options: [
      { id: "mystery", name: "Mystery", description: "Intriguing stories with puzzles to solve" },
      { id: "romance", name: "Romance", description: "Stories about love, relationships, and connections" },
      { id: "fantasy", name: "Fantasy", description: "Imaginative stories in magical worlds" },
      { id: "thriller", name: "Thriller", description: "Suspenseful stories that keep you on the edge of your seat" }
    ],
    audience: [
      { id: "adults", name: "Adults", description: "General adult audience" }
    ]
  },
  nonfiction: {
    name: "Non-Fiction & Self-Help",
    description: "Books that offer food for thought and inspiration",
    options: [
      { id: "self_help", name: "Self-Help", description: "Inspirational stories about personal growth and overcoming challenges" },
      { id: "biography", name: "Biography", description: "True stories about remarkable individuals" },
      { id: "mindfulness", name: "Mindfulness", description: "Stories focused on mental well-being and presence" },
      { id: "motivational", name: "Motivational", description: "Stories that inspire action and positive change" }
    ],
    audience: [
      { id: "teens", name: "Teens", description: "Ages 13-17" },
      { id: "adults", name: "Adults", description: "Ages 18+" }
    ]
  }
};

// Story settings
const storySettings = {
  length: [
    { id: "short", name: "Short Story", description: "A quick read (5-10 minutes)" },
    { id: "medium", name: "Medium Story", description: "A moderate read (10-20 minutes)" },
    { id: "long", name: "Long Story", description: "A longer read (20-30 minutes)" }
  ],
  tone: [
    { id: "whimsical", name: "Whimsical", description: "Playful and imaginative" },
    { id: "serious", name: "Serious", description: "Thoughtful and meaningful" },
    { id: "humorous", name: "Humorous", description: "Funny and lighthearted" },
    { id: "inspiring", name: "Inspiring", description: "Uplifting and motivational" }
  ]
};

const Page = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Creative writing process messages
  const loadingMessages = [
    "Creating your magical story...",
    "Weaving narrative elements together...",
    "Adding special touches to your story...",
    "Almost ready with your surprise story...",
    "Finalizing the perfect tale for you...",
    "Your story is taking shape...",
    "Preparing your personalized narrative...",
  ];

  // Rotate through loading messages
  React.useEffect(() => {
    if (!isLoading) return;
    
    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);
    
    setLoadingMessage(loadingMessages[0]);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedOption(null);
    setSelectedAudience(null);
    setStep(2);
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setStep(3);
  };

  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
    setStep(4);
  };

  const handleLengthSelect = (lengthId: string) => {
    setSelectedLength(lengthId);
    setStep(5);
  };

  const handleToneSelect = (toneId: string) => {
    setSelectedTone(toneId);
    setStep(6);
  };

  const handleGenerateStory = async () => {
    if (!selectedCategory || !selectedOption || !selectedLength || !selectedTone || !selectedAudience) {
      setError("Please complete all selections before generating your story");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the selected category
      const category = storyCategories[selectedCategory as keyof typeof storyCategories];
      
      // Find the selected option and audience within the category
      const option = category.options.find(opt => opt.id === selectedOption);
      const audience = category.audience.find(aud => aud.id === selectedAudience);
      const length = storySettings.length.find(l => l.id === selectedLength);
      const tone = storySettings.tone.find(t => t.id === selectedTone);
      
      // Prepare request data
      const requestData = {
        category: category.name,
        story_type: option?.name || "",
        length: length?.name || "Short Story",
        tone: tone?.name || "Whimsical",
        target_audience: audience?.name || "",
        prompt: `Generate a ${length?.name.toLowerCase()} ${option?.name.toLowerCase()} story with a ${tone?.name.toLowerCase()} tone for ${audience?.name.toLowerCase()}.`
      };
      
      // Make API call to the backend endpoint
      const response = await axios.post('http://localhost:8000/api/story/surprise-me', requestData);
      
      // Store the generated story in localStorage
      localStorage.setItem('surpriseStory', JSON.stringify(response.data));
      
      // Navigate to the story display page
      router.push('/create/surprise-me/story');
      
    } catch (error) {
      console.error('Error generating story:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while generating your story');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push('/');
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedOption(null);
    setSelectedLength(null);
    setSelectedTone(null);
    setSelectedAudience(null);
    setError(null);
  };

  // Loading overlay component
  const LoadingOverlay = () => {
    return (
      <div className="fixed inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-t-4 border-b-4 border-amber-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-center text-amber-800 mb-2 font-sans var(--font-quantico)">Creating Your Story</h3>
          <div className="h-12">
            <p className="text-center text-amber-700 font-sans var(--font-capriola) animate-pulse">{loadingMessage}</p>
          </div>
          <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-700 animate-loading-bar"></div>
          </div>
        </div>
        <p className="text-white mt-6 font-sans var(--font-capriola) text-sm max-w-md text-center">
          We're crafting a special story just for you...
        </p>
      </div>
    );
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(storyCategories).map(([id, category]) => (
              <div 
                key={id}
                className="border-2 rounded-xl p-6 shadow-lg border-amber-200 bg-white hover:border-amber-400 transition-all cursor-pointer"
                onClick={() => handleCategorySelect(id)}
              >
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{category.name}</h2>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex justify-end">
                  <button className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors font-sans var(--font-quantico)">
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 2:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {storyCategories[selectedCategory as keyof typeof storyCategories]?.options.map((option) => (
              <div 
                key={option.id}
                className={`border-2 rounded-xl p-6 shadow-lg ${selectedOption === option.id ? 'border-amber-600 bg-amber-50' : 'border-amber-200 bg-white hover:border-amber-400'} transition-all cursor-pointer`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{option.name}</h2>
                <p className="text-gray-600">{option.description}</p>
              </div>
            ))}
          </div>
        );
      
      case 3:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {storyCategories[selectedCategory as keyof typeof storyCategories]?.audience.map((audience) => (
              <div 
                key={audience.id}
                className={`border-2 rounded-xl p-6 shadow-lg ${selectedAudience === audience.id ? 'border-amber-600 bg-amber-50' : 'border-amber-200 bg-white hover:border-amber-400'} transition-all cursor-pointer`}
                onClick={() => handleAudienceSelect(audience.id)}
              >
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{audience.name}</h2>
                <p className="text-gray-600">{audience.description}</p>
              </div>
            ))}
          </div>
        );
      
      case 4:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {storySettings.length.map((length) => (
              <div 
                key={length.id}
                className={`border-2 rounded-xl p-6 shadow-lg ${selectedLength === length.id ? 'border-amber-600 bg-amber-50' : 'border-amber-200 bg-white hover:border-amber-400'} transition-all cursor-pointer`}
                onClick={() => handleLengthSelect(length.id)}
              >
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{length.name}</h2>
                <p className="text-gray-600">{length.description}</p>
              </div>
            ))}
          </div>
        );
      
      case 5:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {storySettings.tone.map((tone) => (
              <div 
                key={tone.id}
                className={`border-2 rounded-xl p-6 shadow-lg ${selectedTone === tone.id ? 'border-amber-600 bg-amber-50' : 'border-amber-200 bg-white hover:border-amber-400'} transition-all cursor-pointer`}
                onClick={() => handleToneSelect(tone.id)}
              >
                <h2 className="text-xl font-semibold text-amber-800 font-sans var(--font-quantico) mb-2">{tone.name}</h2>
                <p className="text-gray-600">{tone.description}</p>
              </div>
            ))}
          </div>
        );
      
      case 6:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-amber-200">
              <h2 className="text-2xl font-bold text-amber-800 font-sans var(--font-quantico) mb-6 text-center">Your Story Preferences</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Category:</span>
                  <span className="text-gray-700">{storyCategories[selectedCategory as keyof typeof storyCategories]?.name}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Story Type:</span>
                  <span className="text-gray-700">
                    {storyCategories[selectedCategory as keyof typeof storyCategories]?.options.find(opt => opt.id === selectedOption)?.name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Audience:</span>
                  <span className="text-gray-700">
                    {storyCategories[selectedCategory as keyof typeof storyCategories]?.audience.find(aud => aud.id === selectedAudience)?.name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Length:</span>
                  <span className="text-gray-700">{storySettings.length.find(l => l.id === selectedLength)?.name}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                  <span className="font-semibold text-amber-800">Tone:</span>
                  <span className="text-gray-700">{storySettings.tone.find(t => t.id === selectedTone)?.name}</span>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button 
                  className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico) text-lg"
                  onClick={handleGenerateStory}
                >
                  Generate My Story
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get the current step title
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Choose a Story Category";
      case 2:
        return "Select a Story Type";
      case 3:
        return "Choose Target Audience";
      case 4:
        return "Choose Story Length";
      case 5:
        return "Select Story Tone";
      case 6:
        return "Review & Generate";
      default:
        return "Surprise Me";
    }
  };

  // Get the current step description
  const getStepDescription = () => {
    switch (step) {
      case 1:
        return "What kind of story would you like to create?";
      case 2:
        return "Select a specific type of story within this category";
      case 3:
        return "Who is this story for?";
      case 4:
        return "How long would you like your story to be?";
      case 5:
        return "What tone would you like for your story?";
      case 6:
        return "Review your selections and generate your story";
      default:
        return "Let us create a story for you";
    }
  };

  return (
    <div className={`${quantico.variable} ${capriola.variable} min-h-screen w-full bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center bg-fixed`}>
      {isLoading && <LoadingOverlay />}
      <div className="min-h-screen bg-slate-900/85 px-4 py-8 flex items-center justify-center">
        <div className='flex flex-col items-center justify-center'>
          <div className="fixed left-4 top-4">
            <button 
              className='bg-gradient-to-r from-amber-700 to-amber-600 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-amber-300/50 transition-all font-sans var(--font-quantico)'
              onClick={handleBack}
            >
              Back
            </button>
          </div>
        </div>
        
        <div className="min-h-[80vh] w-screen max-w-6xl mx-auto bg-slate-50 shadow-2xl rounded-4xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-amber-800 mb-1 font-sans var(--font-quantico)">{getStepTitle()}</h1>
          <h2 className="text-base sm:text-lg italic text-center text-amber-600 mb-6 sm:mb-8 font-sans var(--font-capriola)">{getStepDescription()}</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="flex-grow overflow-y-auto">
            {renderStepContent()}
          </div>
          
          <div className="flex justify-between mt-8 pt-4 border-t border-amber-200">
            <button 
              className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors font-sans var(--font-quantico)"
              onClick={handleReset}
            >
              Start Over
            </button>
            
            {step > 1 && (
              <button 
                className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors font-sans var(--font-quantico)"
                onClick={handleBack}
              >
                Previous Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
