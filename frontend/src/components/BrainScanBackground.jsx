import React from 'react';

export default function BrainScanBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      
      {/* Centered Subtle Brain Vector Graphic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] scale-110 sm:scale-125">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full max-w-5xl h-auto"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Brain Hemisphere Contour Lines */}
          <path 
            d="M 400 90 
               C 300 80, 200 130, 160 220 
               C 120 310, 150 420, 240 480 
               C 310 520, 370 510, 400 480 
               C 430 510, 490 520, 560 480 
               C 650 420, 680 310, 640 220 
               C 600 130, 500 80, 400 90 Z" 
            stroke="url(#brainGlowGrad)" 
            strokeWidth="3"
            strokeDasharray="8 4"
            className="animate-pulse"
          />

          {/* Left Hemisphere Cortical Sulci Folds */}
          <path d="M 220 180 Q 280 160 320 220 T 260 320" stroke="#f97316" strokeWidth="2.5" strokeOpacity="0.7" fill="none" />
          <path d="M 180 260 Q 250 240 310 300 T 220 420" stroke="#ea580c" strokeWidth="2" strokeOpacity="0.6" fill="none" />
          <path d="M 250 360 Q 310 340 360 400" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" fill="none" />

          {/* Right Hemisphere Cortical Sulci Folds */}
          <path d="M 580 180 Q 520 160 480 220 T 540 320" stroke="#f97316" strokeWidth="2.5" strokeOpacity="0.7" fill="none" />
          <path d="M 620 260 Q 550 240 490 300 T 580 420" stroke="#ea580c" strokeWidth="2" strokeOpacity="0.6" fill="none" />
          <path d="M 550 360 Q 490 340 440 400" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.6" fill="none" />

          {/* Central Longitudinal Fissure & Cerebellum Line */}
          <path d="M 400 90 L 400 480" stroke="#f97316" strokeWidth="2.5" strokeDasharray="6 6" />

          {/* Neural Synapse Nodes */}
          <circle cx="220" cy="180" r="5" fill="#f97316" className="animate-ping" />
          <circle cx="580" cy="180" r="5" fill="#f97316" className="animate-ping" />
          <circle cx="320" cy="220" r="4" fill="#f59e0b" />
          <circle cx="480" cy="220" r="4" fill="#f59e0b" />
          <circle cx="240" cy="480" r="6" fill="#ea580c" />
          <circle cx="560" cy="480" r="6" fill="#ea580c" />

          <defs>
            <linearGradient id="brainGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Glowing Vertical Scan Beam (Top to Bottom Linear Motion) */}
      <div className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-orange-500/20 to-orange-500/40 border-b-2 border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-scan-sweep"></div>
    </div>
  );
}
