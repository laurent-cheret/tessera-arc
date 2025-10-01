import React, { useState, useEffect } from 'react';
import './InteractiveGrid.css';

const InteractiveGrid = ({ initialGrid, currentGrid, onGridChange, onAction }) => {
  const [grid, setGrid] = useState(currentGrid || initialGrid);
  const [selectedColor, setSelectedColor] = useState(1);
  const [actionCount, setActionCount] = useState(0);

  // Official ARC color palette
  const colors = {
    0: '#000000', // Black
    1: '#0074D9', // Blue
    2: '#FF4136', // Red
    3: '#2ECC40', // Green
    4: '#FFDC00', // Yellow
    5: '#AAAAAA', // Gray
    6: '#F012BE', // Magenta
    7: '#FF851B', // Orange
    8: '#7FDBFF', // Cyan
    9: '#870C25', // Maroon
  };

  // Sync with external grid changes
  useEffect(() => {
    if (currentGrid) {
      setGrid(currentGrid);
    }
  }, [currentGrid]);

  const updateGrid = (newGrid) => {
    setGrid(newGrid);
    if (onGridChange) {
      onGridChange(newGrid);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    const oldValue = grid[rowIndex][colIndex];
    const newGrid = grid.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) => (cIdx === colIndex ? selectedColor : cell))
        : [...row]
    );

    updateGrid(newGrid);
    setActionCount(prev => prev + 1);

    if (onAction) {
      // FIXED: Explicitly pass row and col, even if they are 0
      onAction({
        type: 'cell_change',
        row: rowIndex,        // This will be 0, 1, 2, etc.
        col: colIndex,        // This will be 0, 1, 2, etc. - FIXED!
        oldValue,
        newValue: selectedColor,
        timestamp: Date.now(),
        actionNumber: actionCount + 1
      });
      
      // DEBUG: Log to console to verify correct values
      console.log('🔍 Action logged:', {
        row: rowIndex,
        col: colIndex,
        oldValue,
        newValue: selectedColor,
        actionNumber: actionCount + 1
      });
    }
  };

  const resetGrid = () => {
    const emptyGrid = grid.map(row => row.map(() => 0));
    updateGrid(emptyGrid);
    setActionCount(prev => prev + 1);

    if (onAction) {
      onAction({
        type: 'reset',
        timestamp: Date.now(),
        actionNumber: actionCount + 1
      });
    }
  };

  const copyFromInitial = () => {
    const copiedGrid = initialGrid.map(row => [...row]);
    updateGrid(copiedGrid);
    setActionCount(prev => prev + 1);

    if (onAction) {
      onAction({
        type: 'copy_from_input',
        timestamp: Date.now(),
        actionNumber: actionCount + 1
      });
    }
  };

  const resizeGrid = (newRows, newCols) => {
    const newGrid = Array(newRows).fill(null).map((_, rowIdx) =>
      Array(newCols).fill(null).map((_, colIdx) => {
        if (rowIdx < grid.length && colIdx < grid[0].length) {
          return grid[rowIdx][colIdx];
        }
        return 0;
      })
    );
    
    updateGrid(newGrid);
    setActionCount(prev => prev + 1);

    if (onAction) {
      onAction({
        type: 'resize',
        newRows,
        newCols,
        timestamp: Date.now(),
        actionNumber: actionCount + 1
      });
    }
  };

  const handleResize = () => {
    const input = prompt('Enter grid size (e.g., "5x5" or "10x8"):');
    if (!input) return;
    
    const match = input.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
    if (!match) {
      alert('Invalid format. Please use format like "5x5" or "10x8"');
      return;
    }
    
    const rows = parseInt(match[1]);
    const cols = parseInt(match[2]);
    
    if (rows < 1 || rows > 30 || cols < 1 || cols > 30) {
      alert('Grid dimensions must be between 1 and 30');
      return;
    }
    
    resizeGrid(rows, cols);
  };

  return (
    <div className="interactive-grid-container">
      <div className="interactive-grid-wrapper">
        {/* Color Picker */}
        <div className="color-picker">
          <h4>Select Color:</h4>
          <div className="color-options">
            {Object.entries(colors).map(([value, color]) => (
              <div
                key={value}
                className={`color-option ${selectedColor === parseInt(value) ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(parseInt(value))}
                title={`Color ${value}`}
              />
            ))}
          </div>
          <p className="selected-color-label">Selected: Color {selectedColor}</p>
        </div>

        {/* The Grid */}
        <div className="interactive-grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="interactive-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="interactive-cell"
                  style={{
                    backgroundColor: colors[cell],
                    cursor: 'pointer'
                  }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  title={`Cell (${rowIndex}, ${colIndex}): ${cell}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Tools */}
        <div className="grid-tools">
          <button className="tool-btn" onClick={copyFromInitial}>
            📋 Copy from Input
          </button>
          <button className="tool-btn resize-btn" onClick={handleResize}>
            📐 Resize Grid
          </button>
          <button className="tool-btn reset-btn" onClick={resetGrid}>
            🔄 Reset Grid
          </button>
        </div>
        
        <div className="grid-info">
          <p>Grid size: {grid.length} × {grid[0]?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGrid;