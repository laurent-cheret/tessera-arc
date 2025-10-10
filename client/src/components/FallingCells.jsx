import React from 'react';

const FallingCells = () => {
  // ARC colors (excluding black)
  const colors = [
    '#0074D9', // Blue
    '#FF4136', // Red
    '#2ECC40', // Green
    '#FFDC00', // Yellow
    '#AAAAAA', // Gray
    '#F012BE', // Magenta
    '#FF851B', // Orange
    '#7FDBFF', // Cyan
    '#870C25', // Maroon
  ];

  // Create 20 falling cells with random colors
  const cells = Array.from({ length: 20 }, (_, i) => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return (
      <div
        key={i}
        className="arc-cell"
        style={{ backgroundColor: randomColor }}
      />
    );
  });

  return (
    <div className="falling-cells">
      {cells}
    </div>
  );
};

export default FallingCells;