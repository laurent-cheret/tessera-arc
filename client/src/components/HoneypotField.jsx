import React, { useEffect, useRef } from 'react';

const HoneypotField = ({ value, onChange }) => {
  const inputRef = useRef(null);

  // Monitor DOM changes (catches bots that directly manipulate DOM)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    // Poll for changes every 100ms
    const interval = setInterval(() => {
      if (input.value !== value) {
        console.warn('🤖 Honeypot field changed directly in DOM!');
        onChange(input.value);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [value, onChange]);

  return (
    <div 
      style={{ 
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
      tabIndex="-1"
    >
      <label htmlFor="website">Website</label>
      <input
        ref={inputRef}
        type="text"
        id="website"
        name="website"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        tabIndex="-1"
      />
    </div>
  );
};

export default HoneypotField;