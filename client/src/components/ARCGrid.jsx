import React from 'react';
import './ARCGrid.css';

const ARCGrid = ({ grid, title }) => {
  // Official ARC color palette (10 colors)
  const colors = {
    0: '#000000', // Black
    1: '#0074D9', // Blue
    2: '#FF4136', // Red
    3: '#2ECC40', // Green
    4: '#FFDC00', // Yellow
    5: '#AAAAAA', // Gray
    6: '#F012BE', // Magenta/Pink
    7: '#FF851B', // Orange
    8: '#7FDBFF', // Cyan/Sky Blue
    9: '#870C25', // Brown/Maroon
  };

  return (
    <div className="arc-grid-container">
      <h3>{title}</h3>
      <div className="arc-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="arc-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="arc-cell"
                style={{ 
                  backgroundColor: colors[cell] !== undefined ? colors[cell] : '#CCCCCC',
                  border: '1px solid #333'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ARCGrid;