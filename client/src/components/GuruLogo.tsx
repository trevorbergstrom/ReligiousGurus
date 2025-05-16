import React from 'react';

const GuruLogo: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="512" height="512" rx="100" fill="#0d9488"/>
      {/* Meditation posture - stylized person sitting cross-legged */}
      <circle cx="256" cy="160" r="70" fill="white" /> {/* Head */}
      <path d="M166 320C166 289.1 191.1 264 222 264H290C320.9 264 346 289.1 346 320V350C346 350 306 380 256 380C206 380 166 350 166 350V320Z" fill="white" /> {/* Body */}
      <path d="M146 380C146 380 173 410 256 410C339 410 366 380 366 380V420C366 420 318 455 256 455C194 455 146 420 146 420V380Z" fill="white" /> {/* Crossed legs */}
      
      {/* Hands in meditation pose */}
      <circle cx="190" cy="330" r="15" fill="white" />
      <circle cx="322" cy="330" r="15" fill="white" />
    </svg>
  );
};

export default GuruLogo;