import React, { useMemo } from 'react';

const MotivationalQuote = () => {
  // Your massive library of quotes
  const quotes = [
    { text: "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.", author: "APJ Abdul Kalam" },
    { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
    { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
    { text: "To succeed in your mission, you must have single-minded devotion to your goal.", author: "APJ Abdul Kalam" },
    { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
    { text: "Genius is 1% talent and 99% percent hard work.", author: "Albert Einstein" },
    { text: "You have to dream before your dreams can come true.", author: "APJ Abdul Kalam" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
    { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
    { text: "Don't read success stories, you will only get a message. Read failure stories, you will get some ideas to get success.", author: "APJ Abdul Kalam" },
    { text: "There is no substitute for hard work.", author: "Thomas A. Edison" },
    { text: "If you want to shine like a sun, first burn like a sun.", author: "APJ Abdul Kalam" },
    { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
    { text: "We are what our repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "Do not wait; the time will never be 'just right.' Start where you stand.", author: "George Herbert" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Man needs his difficulties because they are necessary to enjoy success.", author: "APJ Abdul Kalam" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.", author: "Marie Curie" },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
    { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "Self-belief and hard work will always earn you success.", author: "Virat Kohli" },
    { text: "You cannot change your future, but you can change your habits, and surely your habits will change your future.", author: "APJ Abdul Kalam" },
    { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "If you fall asleep now, you will dream. If you study now, you will live your dream.", author: "Unknown" },
    { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
    { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "Let me tell you the secret that has led me to my goal. My strength lies solely in my tenacity.", author: "Louis Pasteur" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
    { text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", author: "Pelé" },
    { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "Fall seven times and stand up eight.", author: "Japanese Proverb" },
    { text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward.", author: "Martin Luther King Jr." },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { text: "Excellence is a continuous process and not an accident.", author: "APJ Abdul Kalam" }
    // Simply paste more quotes here to reach your 200 goal!
  ];

  // Calculate the quote of the day
  const dailyQuote = useMemo(() => {
    const today = new Date();
    // Convert current time to total days since the Unix Epoch (Jan 1, 1970)
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    
    // The modulo operator (%) perfectly loops the index back to 0 when it hits the array length
    const quoteIndex = daysSinceEpoch % quotes.length;
    
    return quotes[quoteIndex];
  }, [quotes]);

  return (
    <div className="relative overflow-hidden bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* Quote Icon */}
        <div className="hidden md:flex shrink-0 items-center justify-center w-14 h-14 bg-gray-800/50 rounded-full border border-gray-700 text-blue-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Quote Text */}
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm font-bold text-blue-500 tracking-widest uppercase mb-3">
            Quote of the Day
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-gray-200 leading-snug mb-4">
            "{dailyQuote.text}"
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-8 h-[2px] bg-blue-500/50"></div>
            <p className="text-gray-400 font-semibold tracking-wide">
              {dailyQuote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalQuote;