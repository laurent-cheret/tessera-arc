import React, { useState, useRef, useEffect } from 'react';
import './ColorAutocompleteTextarea.css';

const ColorAutocompleteTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  rows = 4,
  className = '',
  maxLength
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentWordInfo, setCurrentWordInfo] = useState(null);
  const [filteredColors, setFilteredColors] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Official ARC colors
  const arcColors = [
    { name: 'BLACK', hex: '#000000', triggers: ['black'] },
    { name: 'BLUE', hex: '#0074D9', triggers: ['blue', 'dark blue', 'navy'] },
    { name: 'RED', hex: '#FF4136', triggers: ['red', 'crimson', 'scarlet'] },
    { name: 'GREEN', hex: '#2ECC40', triggers: ['green', 'lime', 'emerald'] },
    { name: 'YELLOW', hex: '#FFDC00', triggers: ['yellow', 'gold', 'golden'] },
    { name: 'GRAY', hex: '#AAAAAA', triggers: ['gray', 'grey', 'silver'] },
    { name: 'MAGENTA', hex: '#F012BE', triggers: ['magenta', 'purple', 'pink', 'violet', 'fuchsia', 'hot pink', 'lavender', 'hotpink'] },
    { name: 'ORANGE', hex: '#FF851B', triggers: ['orange', 'tangerine'] },
    { name: 'CYAN', hex: '#7FDBFF', triggers: ['cyan', 'light blue', 'sky blue', 'turquoise', 'aqua', 'teal', 'lightblue'] },
    { name: 'MAROON', hex: '#870C25', triggers: ['maroon', 'brown', 'burgundy', 'dark red', 'wine', 'mahogany', 'darkred'] }
  ];

  // Find which color matches the word
  const findMatchingColor = (word) => {
    const lowerWord = word.toLowerCase().trim();
    for (let color of arcColors) {
      if (color.triggers.some(trigger => trigger === lowerWord)) {
        return color.name;
      }
    }
    return null;
  };

  // Filter colors based on partial input
  const getFilteredColors = (partialWord) => {
    const lower = partialWord.toLowerCase().trim();
    if (lower.length < 2) return [];

    const matches = arcColors.filter(color => 
      color.triggers.some(trigger => trigger.startsWith(lower) || trigger.includes(lower))
    );

    // Sort by relevance (exact start match first)
    return matches.sort((a, b) => {
      const aExact = a.triggers.some(t => t.startsWith(lower));
      const bExact = b.triggers.some(t => t.startsWith(lower));
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
  };

  // Get cursor position in pixels
  const getCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const textareaRect = textarea.getBoundingClientRect();
    const cursorPos = textarea.selectionStart;
    
    // Create invisible div to measure text position
    const div = document.createElement('div');
    const styles = getComputedStyle(textarea);
    
    // Copy textarea styles exactly
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.top = '0';
    div.style.left = '-9999px';
    div.style.width = textarea.clientWidth + 'px';
    div.style.height = 'auto';
    div.style.font = styles.font;
    div.style.fontSize = styles.fontSize;
    div.style.fontFamily = styles.fontFamily;
    div.style.fontWeight = styles.fontWeight;
    div.style.lineHeight = styles.lineHeight;
    div.style.letterSpacing = styles.letterSpacing;
    div.style.padding = styles.padding;
    div.style.border = styles.border;
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    
    // Get text before cursor
    const textBefore = value.substring(0, cursorPos);
    div.textContent = textBefore;
    
    // Add marker span at cursor position
    const marker = document.createElement('span');
    marker.textContent = '|';
    div.appendChild(marker);
    
    document.body.appendChild(div);
    
    // Get marker position
    const markerRect = marker.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    
    document.body.removeChild(div);
    
    // Calculate absolute position on screen
    const paddingTop = parseInt(styles.paddingTop);
    const paddingLeft = parseInt(styles.paddingLeft);
    
    const lineHeight = parseInt(styles.lineHeight) || 20;
    
    // Position relative to textarea's position on screen
    const top = textareaRect.top + (markerRect.top - divRect.top) + paddingTop + lineHeight + 5;
    const left = textareaRect.left + (markerRect.left - divRect.left) + paddingLeft;
    
    return { top, left };
  };

  // Check for color word and show dropdown
  const checkForColorWord = () => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const text = value;
    
    // Find word boundaries
    let start = cursorPos;
    let end = cursorPos;
    
    // Go back to find word start
    while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) {
      start--;
    }
    
    // Go forward to find word end (but only if cursor is in the middle)
    while (end < text.length && /[a-zA-Z]/.test(text[end])) {
      end++;
    }
    
    const word = text.substring(start, end);
    
    // Check if cursor is at or after the word
    if (cursorPos < start || cursorPos > end) {
      setShowDropdown(false);
      return;
    }
    
    // Check for two-word phrases ONLY if previous word is a color modifier
    const colorModifiers = ['light', 'dark', 'hot', 'sky'];
    let phraseStart = start;
    let fullWord = word;
    
    if (start > 0 && text[start - 1] === ' ') {
      let prevWordEnd = start - 1;
      let prevWordStart = prevWordEnd;
      while (prevWordStart > 0 && /[a-zA-Z]/.test(text[prevWordStart - 1])) {
        prevWordStart--;
      }
      const prevWord = text.substring(prevWordStart, prevWordEnd).toLowerCase();
      
      // Only combine words if previous word is a known color modifier
      if (colorModifiers.includes(prevWord)) {
        fullWord = prevWord + ' ' + word;
        phraseStart = prevWordStart;
      }
    }
    
    if (fullWord.length >= 2) {
      const matches = getFilteredColors(fullWord);
      
      if (matches.length > 0) {
        const pos = getCursorPosition();
        setDropdownPosition(pos);
        setFilteredColors(matches);
        
        // Only reset selectedIndex if dropdown was hidden or if filtered colors changed
        if (!showDropdown) {
          setSelectedIndex(0);
        } else {
          // Keep current selection, but clamp to valid range
          setSelectedIndex(prev => Math.min(prev, matches.length - 1));
        }
        
        setCurrentWordInfo({
          word: fullWord,
          start: fullWord.includes(' ') ? phraseStart : start,
          end: end
        });
        setShowDropdown(true);
        return;
      }
    }
    
    setShowDropdown(false);
  };

  // Replace word with color tag
  const replaceWithColor = (colorName) => {
    if (!currentWordInfo) return;

    const before = value.substring(0, currentWordInfo.start);
    const after = value.substring(currentWordInfo.end);
    const newValue = before + `[${colorName}] ` + after;
    
    const syntheticEvent = { target: { value: newValue } };
    onChange(syntheticEvent);
    
    setShowDropdown(false);
    setCurrentWordInfo(null);
    
    // Move cursor after the inserted color
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = currentWordInfo.start + colorName.length + 3; // [COLOR] + space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Handle text change
  const handleChange = (e) => {
    const oldValue = value;
    const newValue = e.target.value;
    
    onChange(e);
    
    // Check if user completed a color word (pressed space or punctuation)
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const charBefore = newValue[cursorPos - 1];
    
    if (charBefore === ' ' || charBefore === '.' || charBefore === ',' || charBefore === '\n') {
      // Check if the word before space is a color
      let wordEnd = cursorPos - 1;
      let wordStart = wordEnd;
      while (wordStart > 0 && /[a-zA-Z]/.test(newValue[wordStart - 1])) {
        wordStart--;
      }
      
      // Check for two-word phrases
      let phraseStart = wordStart;
      const word = newValue.substring(wordStart, wordEnd);
      let fullWord = word;
      
      const colorModifiers = ['light', 'dark', 'hot', 'sky'];
      if (wordStart > 0 && newValue[wordStart - 1] === ' ') {
        let prevWordEnd = wordStart - 1;
        let prevWordStart = prevWordEnd;
        while (prevWordStart > 0 && /[a-zA-Z]/.test(newValue[prevWordStart - 1])) {
          prevWordStart--;
        }
        const prevWord = newValue.substring(prevWordStart, prevWordEnd).toLowerCase();
        
        // Only combine if previous word is a color modifier
        if (colorModifiers.includes(prevWord)) {
          fullWord = prevWord + ' ' + word;
          phraseStart = prevWordStart;
        }
      }
      
      const matchedColor = findMatchingColor(fullWord);
      
      if (matchedColor) {
        // Auto-replace with extra space after
        const before = newValue.substring(0, phraseStart);
        const after = newValue.substring(cursorPos);
        const replaced = before + `[${matchedColor}] ` + after;
        
        const syntheticEvent = { target: { value: replaced } };
        onChange(syntheticEvent);
        
        setShowDropdown(false);
        
        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = phraseStart + matchedColor.length + 3; // [COLOR] + space
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
        return;
      }
    }
    
    setTimeout(checkForColorWord, 10);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => Math.min(prev + 1, filteredColors.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredColors.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      replaceWithColor(filteredColors[selectedIndex].name);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowDropdown(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position on scroll
  useEffect(() => {
    if (!showDropdown) return;

    const handleScroll = () => {
      if (showDropdown) {
        const pos = getCursorPosition();
        setDropdownPosition(pos);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showDropdown]);

  return (
    <div className="color-autocomplete-wrapper">
      <textarea
        ref={textareaRef}
        className={`color-autocomplete-textarea ${className}`}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          // Don't re-check on arrow keys - they're handled in handleKeyDown
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
            checkForColorWord();
          }
        }}
        onClick={checkForColorWord}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
      
      {showDropdown && filteredColors.length > 0 && (
        <div 
          ref={dropdownRef}
          className="color-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {filteredColors.map((color, index) => (
            <div
              key={color.name}
              className={`color-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => replaceWithColor(color.name)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div 
                className="color-dropdown-swatch"
                style={{ backgroundColor: color.hex }}
              />
              <span className="color-dropdown-name">{color.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorAutocompleteTextarea;