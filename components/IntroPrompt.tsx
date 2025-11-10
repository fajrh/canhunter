import React, { useState, useEffect } from 'react';

interface GameMessageProps {
  text: string;
}

const GameMessage: React.FC<GameMessageProps> = ({ text: fullText }) => {
  const [text, setText] = useState('');
  const typingSpeed = 50; // ms

  useEffect(() => {
    // Reset typing animation when the message prop changes
    setText('');
  }, [fullText]);


  useEffect(() => {
    if (text.length < fullText.length) {
      const timer = setTimeout(() => {
        setText(fullText.slice(0, text.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timer);
    }
  }, [text, fullText]);

  const promptStyle: React.CSSProperties = {
    fontFamily: '"Lucida Console", Monaco, monospace',
    fontSize: '14px',
    color: '#39FF14', // Neon green
    textShadow: '0 0 5px #39FF14, 0 0 10px #39FF14',
  };

  return (
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-4 bg-black/50 rounded-lg pointer-events-none text-center max-w-[90vw]"
    >
      <p style={promptStyle}>{text}<span className="animate-ping opacity-75">_</span></p>
    </div>
  );
};

export default GameMessage;