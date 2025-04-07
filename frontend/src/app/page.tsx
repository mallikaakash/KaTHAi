'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';


const Page = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white text-2xl md:text-3xl font-serif tracking-wider"
          >
            KathAI
          </motion.div>
          <div className="hidden md:flex space-x-8">
            {['Home', 'The Writer\'s Desk', 'The Reader\'s Nook', 'Features', 'Community'].map((item) => (
              <motion.a 
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-white/80 hover:text-amber-400 transition-colors"
                whileHover={{ y: -2 }}
              >
                {item}
              </motion.a>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-sm border border-amber-600 text-amber-600 rounded-md hover:bg-amber-600/10 transition-all"
          >
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-cover bg-center h-screen" style={{ backgroundImage: "url('/bg-image.png')" }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 container mx-auto px-8 flex flex-col items-start justify-center h-full">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-[var(--font-playfair-display)] text-white leading-tight gradient-text">
              KathAI: Weave Your Next Story, Instantly.
            </h1>
            <p className="mt-6 text-xl font-sans text-white/90">
              The advanced AI writing partner for inspired authors and curious readers. Generate, assist, and listen – no sign-up required.
            </p>
            <div className="mt-8 relative w-fit">
            <Link href="/create">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors duration-300 relative z-10 overflow-hidden group animated-border-button cta-button"
              >
                <span className="relative z-10">
                  Start Creating Now</span>
              </motion.button>
              </Link>
              <p className="mt-3 text-sm text-white/80">No login needed. Just begin.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Writer's Desk Section */}
      <section id="the-writer's-desk" className="py-20 bg-gradient-to-b h-screen my-auto from-gray-50 to-gray-100">
          <div className="container m-auto px-8 flex flex-col lg:flex-row gap-12 items-center">
            {/* Writer's Desk Section */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 transform hover:scale-105 transition-all duration-500 perspective-1000"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl hover:shadow-amber-200/50 transform hover:rotate-y-5 transition-all duration-500 border border-amber-100">
                <div className="p-8">
                  <span className="text-amber-600 font-medium tracking-wider uppercase text-sm font-['Montserrat']">For Writers</span>
                  <h2 className="text-4xl md:text-5xl font-[var(--font-playfair-display)] text-gray-800  gradient-text">
                    Your Co-Author <br className="hidden md:block" />
                    <span className="italic">is Ready</span>
                  </h2>
                  <div className="w-42 h-1 bg-amber-600 mb-6"></div>
                  <p className="text-xl text-gray-700 mb-8 font-['Merriweather'] leading-relaxed">
                    From the <span className="text-amber-700 font-semibold">spark of an idea</span> to polished prose, KathAI works alongside you. Our sophisticated AI assists with brainstorming plots, developing characters, refining language, and overcoming writer's block.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 transition-all duration-300 transform hover:translate-z-10"
                  >
                    <span>Start Writing</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2"
            >
              <span className="text-indigo-600 font-medium tracking-wider uppercase text-sm font-['Montserrat']">For Readers</span>
              <h2 className="text-4xl md:text-5xl font-[var(--font-playfair-display)] text-gray-800 mb-4 gradient-text">
                Endless Worlds <br className="hidden md:block" />
                <span className="italic">at Your Fingertips</span>
              </h2>
              <div className="w-20 h-1 bg-indigo-600 mb-6"></div>
              <p className="text-xl text-gray-700 mb-8 font-['Merriweather'] leading-relaxed">
                Craving a <span className="text-indigo-700 font-semibold">unique narrative</span>? Let KathAI craft it for you. Use our "Surprise Me" feature for instant, original stories tailored to your mood or genre. Transform any text into an engaging audiobook.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all duration-300"
              >
                <span>Discover Stories</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                </svg>
              </motion.button>
            </motion.div>
          
        </div>
      </section>

      

      {/* Features Section */}
      <section id="features" className="py-20 bg-white h-screen">
        <div className="container mx-auto px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-[var(--font-playfair-display)] text-center text-gray-800 mb-16 gradient-text"
          >
            The KathAI Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Seamless Ideation",
                icon: "💡",
                description: "Generate concepts, outlines, characters, and world details to kickstart your creativity."
              },
              {
                title: "Intelligent Writing Assist",
                icon: "✒️",
                description: "Draft passages, refine sentences, enhance tone, and ensure grammatical precision."
              },
              {
                title: "On-Demand Story Generation",
                icon: "✨",
                description: "Instantly create unique short stories or novel ideas. Perfect for readers seeking fresh narratives."
              },
              {
                title: "Instant Audio Conversion",
                icon: "🔊",
                description: "Turn generated stories or your own text into high-quality audiobooks effortlessly."
              },
              {
                title: "Frictionless Access",
                icon: "🔓",
                description: "No sign-ups, no logins. Dive straight into KathAI and start creating or reading immediately."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow hover-lift card-hover"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How KathAI Works */}
      <section id="how-it-works" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-[var(--font-playfair-display)] text-center mb-16 gradient-text"
          >
            Storytelling Made Simple
          </motion.h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "Step 1",
                title: "Prompt or Choose",
                description: "Enter your idea, select 'Surprise Me', or paste text",
                icon: "📝"
              },
              {
                step: "Step 2",
                title: "AI Crafts",
                description: "KathAI generates, assists, or converts",
                icon: "🧠"
              },
              {
                step: "Step 3",
                title: "Experience",
                description: "Read, refine, or listen to your story",
                icon: "📚"
              }
            ].map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex flex-col items-center text-center p-6 bg-gray-800 rounded-xl w-full md:w-1/3 hover-lift card-hover"
              >
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-amber-500 font-bold mb-2">{step.step}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="community" className="py-20 bg-amber-50">
        <div className="container mx-auto px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-[var(--font-playfair-display)] text-center text-gray-800 mb-16 gradient-text"
          >
            Hear from KathAI Users
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "KathAI helped me overcome writer's block during my novel draft. The character development suggestions were particularly insightful.",
                author: "Maya K., Novelist",
                avatar: "https://via.placeholder.com/100"
              },
              {
                quote: "I use the 'Surprise Me' feature every night to read my kids a new bedtime story. They're always excited to hear what adventure comes next!",
                author: "Thomas R., Parent",
                avatar: "https://via.placeholder.com/100"
              },
              {
                quote: "Converting my short stories to audio has doubled my audience. KathAI's voice quality is remarkably natural and engaging.",
                author: "Priya M., Content Creator",
                avatar: "https://via.placeholder.com/100"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-sm hover-lift card-hover"
              >
                <div className="flex items-center mb-4">
                  <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full mr-4" />
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                  </div>
                </div>
                <p className="italic text-gray-600">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-amber-700 to-amber-900 text-white">
        <div className="container mx-auto px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-[var(--font-playfair-display)] mb-6">Ready to Bring Your Story to Life?</h2>
            <p className="text-xl mb-8">Experience the future of narrative creation with KathAI. Your partner for writing assistance and endless reading adventures awaits.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-amber-800 text-lg font-bold rounded-md hover:bg-amber-100 transition-colors animated-border-button cta-button"
            >
              Generate Your First Story
            </motion.button>
            <p className="mt-4 text-amber-200">Free to start. No account needed.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-[var(--font-playfair-display)] mb-4 gradient-text">KathAI</h3>
              <p className="text-gray-400">Your AI writing partner for inspired creation.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">About KathAI</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Writing Tips</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>© {new Date().getFullYear()} KathAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Page;
