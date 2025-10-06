import React, { useState, useEffect } from 'react';
import './TypewriterAnimation.css';

const TypewriterAnimation = ({ phrases, speed = 50, pauseDuration = 2000, isItalic = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    if (isTyping) {
      if (charIndex < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, pause before erasing
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, pauseDuration);
        return () => clearTimeout(timeout);
      }
    } else {
      // Erasing phase
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, speed / 2);
        return () => clearTimeout(timeout);
      } else {
        // Finished erasing, move to next phrase
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, currentPhraseIndex, phrases, speed, pauseDuration]);

  return (
    <div className="typewriter-container">
      <span className={isItalic ? "typewriter-text italic" : "typewriter-text"}>
        {displayText}
        <span className="typewriter-cursor">|</span>
      </span>
    </div>
  );
};

export default TypewriterAnimation;