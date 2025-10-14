import React, { useState, useEffect, useRef } from 'react';
import './InteractiveGrid.css';

const InteractiveGrid = ({ initialGrid, currentGrid, onGridChange, onAction }) => {
  const [grid, setGrid] = useState(currentGrid || initialGrid);
  const [selectedColor, setSelectedColor] = useState(1);
  const [mode, setMode] = useState('edit'); // 'edit', 'select', 'fill'
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  
  const gridRef = useRef(null);

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

  // Color names for display
  const colorNames = {
    0: 'Black',
    1: 'Blue',
    2: 'Red',
    3: 'Green',
    4: 'Yellow',
    5: 'Gray',
    6: 'Magenta',
    7: 'Orange',
    8: 'Cyan',
    9: 'Maroon'
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

  // Helper: Deep compare two grids
  const gridsAreEqual = (grid1, grid2) => {
    if (grid1.length !== grid2.length) return false;
    if (grid1[0]?.length !== grid2[0]?.length) return false;
    
    for (let i = 0; i < grid1.length; i++) {
      for (let j = 0; j < grid1[0].length; j++) {
        if (grid1[i][j] !== grid2[i][j]) return false;
      }
    }
    return true;
  };

  // Helper: Check if grid is all zeros
  const isGridAllZeros = (grid) => {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] !== 0) return false;
      }
    }
    return true;
  };

  // EDIT MODE: Click individual cells
  const handleCellClick = (rowIndex, colIndex) => {
    if (mode === 'edit') {
      const oldValue = grid[rowIndex][colIndex];
      
      // Only proceed if the cell value is actually changing
      if (oldValue === selectedColor) {
        console.log('Skipped redundant cell click: cell already has this color');
        return;
      }
      
      const newGrid = grid.map((row, rIdx) =>
        rIdx === rowIndex
          ? row.map((cell, cIdx) => (cIdx === colIndex ? selectedColor : cell))
          : [...row]
      );

      updateGrid(newGrid);

      if (onAction) {
        onAction({
          type: 'cell_change',
          row: rowIndex,
          col: colIndex,
          oldValue,
          newValue: selectedColor,
          timestamp: Date.now()
        });
      }
    } else if (mode === 'fill') {
      // FILL MODE: Fill entire grid with selected color
      handleFillAll();
    }
  };

  // SELECT MODE: Mouse down to start selection
  const handleMouseDown = (rowIndex, colIndex) => {
    if (mode === 'select') {
      setIsSelecting(true);
      setSelectionStart({ row: rowIndex, col: colIndex });
      setSelectionEnd({ row: rowIndex, col: colIndex });
    }
  };

  // SELECT MODE: Mouse move to update selection
  const handleMouseMove = (rowIndex, colIndex) => {
    if (mode === 'select' && isSelecting) {
      setSelectionEnd({ row: rowIndex, col: colIndex });
    }
  };

  // SELECT MODE: Mouse up to apply selection
  const handleMouseUp = () => {
    if (mode === 'select' && isSelecting && selectionStart && selectionEnd) {
      applySelection();
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  // Apply color to selected region
  const applySelection = () => {
    if (!selectionStart || !selectionEnd) return;

    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    const newGrid = grid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (rIdx >= minRow && rIdx <= maxRow && cIdx >= minCol && cIdx <= maxCol) {
          return selectedColor;
        }
        return cell;
      })
    );

    updateGrid(newGrid);

    if (onAction) {
      onAction({
        type: 'select_region',
        startRow: minRow,
        startCol: minCol,
        endRow: maxRow,
        endCol: maxCol,
        color: selectedColor,
        cellsAffected: (maxRow - minRow + 1) * (maxCol - minCol + 1),
        timestamp: Date.now()
      });
    }
  };

  // FILL MODE: Fill entire grid
  const handleFillAll = () => {
    // Check if grid already all has this color
    const allSameColor = grid.every(row => row.every(cell => cell === selectedColor));
    if (allSameColor) {
      console.log('Skipped redundant fill: grid already has this color');
      return;
    }

    const newGrid = grid.map(row => row.map(() => selectedColor));
    updateGrid(newGrid);

    if (onAction) {
      onAction({
        type: 'fill_all',
        color: selectedColor,
        timestamp: Date.now()
      });
    }
  };

  // Check if cell is in selection
  const isCellSelected = (rowIndex, colIndex) => {
    if (!isSelecting || !selectionStart || !selectionEnd) return false;
    
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    
    return rowIndex >= minRow && rowIndex <= maxRow && 
           colIndex >= minCol && colIndex <= maxCol;
  };

  const resetGrid = () => {
    if (isGridAllZeros(grid)) {
      console.log('Skipped redundant reset: grid is already empty');
      return;
    }
    
    const emptyGrid = grid.map(row => row.map(() => 0));
    updateGrid(emptyGrid);

    if (onAction) {
      onAction({
        type: 'reset',
        timestamp: Date.now()
      });
    }
  };

  const copyFromInitial = () => {
    if (gridsAreEqual(grid, initialGrid)) {
      console.log('Skipped redundant copy: grid is already identical to input');
      return;
    }
    
    const copiedGrid = initialGrid.map(row => [...row]);
    updateGrid(copiedGrid);

    if (onAction) {
      onAction({
        type: 'copy_from_input',
        timestamp: Date.now()
      });
    }
  };

  const resizeGrid = (newRows, newCols) => {
    if (newRows === grid.length && newCols === grid[0]?.length) {
      console.log('Skipped redundant resize: dimensions unchanged');
      return;
    }
    
    const newGrid = Array(newRows).fill(null).map((_, rowIdx) =>
      Array(newCols).fill(null).map((_, colIdx) => {
        if (rowIdx < grid.length && colIdx < grid[0].length) {
          return grid[rowIdx][colIdx];
        }
        return 0;
      })
    );
    
    updateGrid(newGrid);

    if (onAction) {
      onAction({
        type: 'resize',
        newRows,
        newCols,
        timestamp: Date.now()
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
                className="color-option-wrapper"
              >
                <div
                  className={`color-option ${selectedColor === parseInt(value) ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(parseInt(value))}
                  title={colorNames[value]}
                />
                <div className="color-name">{colorNames[value]}</div>
              </div>
            ))}
          </div>
          <p className="selected-color-label">
            Selected: {colorNames[selectedColor]}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mode-selector">
          <h4>Edit Mode:</h4>
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => setMode('edit')}
              title="Click individual cells to change color"
            >
              ✏️ Edit
            </button>
            <button 
              className={`mode-btn ${mode === 'select' ? 'active' : ''}`}
              onClick={() => setMode('select')}
              title="Click and drag to select a region, then apply color"
            >
              ⬚ Select
            </button>
            <button 
              className={`mode-btn ${mode === 'fill' ? 'active' : ''}`}
              onClick={() => setMode('fill')}
              title="Click anywhere to fill entire grid with selected color"
            >
              🪣 Fill
            </button>
          </div>
          <p className="mode-description">
            {mode === 'edit' && '✏️ Click cells to paint them'}
            {mode === 'select' && '⬚ Drag to select a region, then paint'}
            {mode === 'fill' && '🪣 Click anywhere to fill entire grid'}
          </p>
        </div>

        {/* The Grid */}
        <div 
          className="interactive-grid"
          ref={gridRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="interactive-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`interactive-cell ${isCellSelected(rowIndex, colIndex) ? 'selected' : ''}`}
                  style={{
                    backgroundColor: colors[cell],
                    cursor: mode === 'edit' ? 'pointer' : mode === 'select' ? 'crosshair' : 'copy'
                  }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
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