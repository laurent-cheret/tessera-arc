import React from 'react';
import './ARCGrid.css';

const ARCGrid = ({ grid, title, maxSize = 300 }) => {
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

  if (!grid || grid.length === 0) {
    return <div className="arc-grid-container">No grid data</div>;
  }

  // Calculate grid dimensions
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Calculate cell size based on the larger dimension
  const maxDimension = Math.max(rows, cols);
  const cellSize = Math.floor(maxSize / maxDimension);
  
  // Ensure minimum cell size for visibility (at least 4px)
  const finalCellSize = Math.max(cellSize, 4);

  // Calculate actual grid dimensions
  const gridWidth = cols * finalCellSize;
  const gridHeight = rows * finalCellSize;

  return (
    <div className="arc-grid-container">
      {title && <h3>{title}</h3>}
      <div 
        className="arc-grid"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="arc-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="arc-cell"
                style={{ 
                  backgroundColor: colors[cell] !== undefined ? colors[cell] : '#CCCCCC',
                  border: '1px solid #333',
                  width: `${finalCellSize}px`,
                  height: `${finalCellSize}px`,
                  minWidth: `${finalCellSize}px`,
                  minHeight: `${finalCellSize}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="grid-dimensions">
        {rows} × {cols}
      </div>
    </div>
  );
};

export default ARCGrid;