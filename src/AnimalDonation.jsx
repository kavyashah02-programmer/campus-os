import React from 'react';

const AnimalDonation = () => {
  // --- DONATION DETAILS ---
  const donationWebsite = "https://srkps.in/donations/general-fund-legacy/"; 

  const donationSteps = [
    {
      step: 1,
      instruction: "Click the 'Go to Donation Portal' button above. You will be redirected to the official SRKPS donation page.",
      image: "/image_dbcbd2.jpg"
    },
    {
      step: 2,
      instruction: "Scroll down the page. (Note: If the QR Code is unavailable due to technical errors, please use the manual details form). Enter your donation amount, fill in your PAN No., and click 'Donate Now'.",
      image: "/image_dbd257.png"
    },
    {
      step: 3,
      instruction: "Fill in your personal information and billing details securely, then click 'Donate' at the bottom of the form.",
      image: "/image_dbcb19.png"
    },
    {
      step: 4,
      instruction: "You will be securely redirected to the CCAvenue Payment Gateway. Choose your preferred payment method and complete the transaction.",
      image: "/image_ccavenue.png"
    },
    {
      step: 5,
      instruction: "After a successful payment, you will be redirected back to the website where you can download your donation receipt. Thank you for helping the animals!",
      image: null
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col pb-10">
      
      {/* --- HEADER --- */}
      <header className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="text-rose-500">❤️</span> Animal Wellbeing Fund
          </h1>
          <p className="text-gray-400 text-sm mt-1">Be their voice. Help us provide food, shelter, and medical care.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* --- LEFT COLUMN: Persuasive Message --- */}
        <div className="bg-[#121212] rounded-2xl border border-gray-800 p-8 shadow-lg flex flex-col relative overflow-hidden h-fit">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5">
            <svg className="w-64 h-64 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-6 leading-tight z-10">
            They cannot ask for help.<br />
            <span className="text-rose-500">But we can be their voice.</span>
          </h2>
          
          <div className="space-y-4 text-gray-300 leading-relaxed z-10">
            <p>
              Every single day, thousands of stray and abandoned animals struggle to survive on the streets. They face starvation, severe weather, untreated injuries, and cruelty. They have no one to turn to—except us.
            </p>
            <p>
              Your contribution, no matter how small, has a direct and immediate impact. It buys nutritious food for starving puppies, funds emergency surgeries for injured animals, and provides safe, warm shelters for those left out in the cold.
            </p>
            <p className="font-bold text-white text-lg mt-4 border-l-4 border-rose-500 pl-4">
              By choosing to donate today, you aren't just giving money. You are giving a second chance at life, love, and happiness to a furry friend who truly needs it.
            </p>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Guide & Link --- */}
        <div className="space-y-6">
          
          {/* Website Link Section */}
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-800 pb-3 w-full flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              Donate Online
            </h3>
            <p className="text-sm text-gray-400 mb-6">Visit the official SRKPS website to make a secure online donation.</p>
            
            <a 
              href={donationWebsite} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:scale-105 duration-300 flex items-center justify-center gap-2"
            >
              Go to Donation Portal
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>

          {/* Visual Step-by-Step Guide */}
          <div className="bg-[#121212] rounded-2xl border border-gray-800 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              How to Donate
            </h3>
            
            <div className="space-y-2">
              {donationSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  {/* Timeline Line & Number */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/50 font-bold flex items-center justify-center shrink-0 z-10 text-sm">
                      {step.step}
                    </div>
                    {index !== donationSteps.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-800 mt-2"></div>
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="pb-8 pt-1 flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      {step.instruction}
                    </p>
                    {step.image && (
                      <img 
                        src={step.image} 
                        alt={`Step ${step.step}`} 
                        className="rounded-xl border border-gray-700 shadow-md w-full object-cover opacity-90 hover:opacity-100 transition-opacity" 
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnimalDonation;