import React, { useState, useEffect } from 'react';
import './PaintingGridAnimation.css';

const PaintingGridAnimation = () => {
  const [grid, setGrid] = useState([]);
  const [currentShape, setCurrentShape] = useState(0);
  
  // ARC colors (excluding black)
  const arcColors = [
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

  // Define shapes to paint
  const shapes = [
    // 3x3 square
    { rows: 3, cols: 3, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
    // Rectangle (2x4)
    { rows: 2, cols: 4, cells: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3]] },
    // Pyramid (3 rows)
    { rows: 3, cols: 5, cells: [[0,2],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3],[2,4]] },
  ];

  useEffect(() => {
    const shape = shapes[currentShape];
    // Initialize empty grid
    const emptyGrid = Array(shape.rows).fill(null).map(() => 
      Array(shape.cols).fill('#000000')
    );
    setGrid(emptyGrid);

    let cellIndex = 0;
    const paintInterval = setInterval(() => {
      if (cellIndex < shape.cells.length) {
        const [row, col] = shape.cells[cellIndex];
        const randomColor = arcColors[Math.floor(Math.random() * arcColors.length)];
        
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(r => [...r]);
          newGrid[row][col] = randomColor;
          return newGrid;
        });
        
        cellIndex++;
      } else {
        // Finished painting this shape, move to next after pause
        clearInterval(paintInterval);
        setTimeout(() => {
          setCurrentShape((prev) => (prev + 1) % shapes.length);
        }, 1500);
      }
    }, 200);

    return () => clearInterval(paintInterval);
  }, [currentShape]);

  return (
    <div className="painting-animation-container">
      <div className="painting-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="painting-row">
            {row.map((color, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="painting-cell"
                style={{ 
                  backgroundColor: color,
                  animation: color !== '#000000' ? 'paintPop 0.3s ease-out' : 'none'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaintingGridAnimation;