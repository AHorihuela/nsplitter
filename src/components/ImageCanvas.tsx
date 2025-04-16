import React, { useEffect, useRef, useState, MouseEvent, useCallback } from 'react';
import { SliceLines, ImageDimensions, Point, VerticalLine } from '../utils/types';
import { findContainingBoundaries, updateSliceLinesOnHorizontalDrag, updateSliceLinesOnVerticalDrag } from '../utils/lineManagement';
import { HistoryState, createInitialHistory, addToHistory, undo, redo } from '../utils/history';
import UndoRedo from './UndoRedo';

interface ImageCanvasProps {
  imageFile: File | null;
  onLoad?: (dimensions: ImageDimensions) => void;
}

interface DragState {
  type: 'horizontal' | 'vertical';
  index: number;
  initialPosition: number;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageFile, onLoad }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [hoverLine, setHoverLine] = useState<Point | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [history, setHistory] = useState<HistoryState>(() => 
    createInitialHistory({ horizontal: [], vertical: [] })
  );
  const [canvasDimensions, setCanvasDimensions] = useState<ImageDimensions | null>(null);

  // Get mouse coordinates relative to canvas
  const getCanvasCoordinates = (e: MouseEvent<HTMLCanvasElement>): Point | null => {
    if (!canvasRef.current || !canvasDimensions) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get position relative to canvas element
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  // Find the nearest line to a point
  const findNearestLine = (point: Point, threshold: number = 10): { type: 'horizontal' | 'vertical', index: number } | null => {
    // Convert threshold to canvas scale
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaledThreshold = threshold * scaleX;

    // Check horizontal lines
    for (let i = 0; i < history.present.horizontal.length; i++) {
      if (Math.abs(history.present.horizontal[i] - point.y) <= scaledThreshold) {
        return { type: 'horizontal', index: i };
      }
    }

    // Check vertical lines
    for (let i = 0; i < history.present.vertical.length; i++) {
      const line = history.present.vertical[i];
      if (Math.abs(line.x - point.x) <= scaledThreshold && 
          point.y >= line.upperBound - scaledThreshold && 
          point.y <= line.lowerBound + scaledThreshold) {
        return { type: 'vertical', index: i };
      }
    }

    return null;
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    setHistory(prev => {
      const newHistory = undo(prev);
      return newHistory || prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory(prev => {
      const newHistory = redo(prev);
      return newHistory || prev;
    });
  }, []);

  // Handle mouse movement for hover guide or drag
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point || !canvasDimensions) return;

    if (dragState) {
      e.preventDefault();
      const newState = dragState.type === 'horizontal'
        ? updateSliceLinesOnHorizontalDrag(history.present, dragState.index, point.y, canvasDimensions)
        : updateSliceLinesOnVerticalDrag(history.present, dragState.index, point.x, canvasDimensions);
      
      setHistory(prev => ({
        ...prev,
        present: newState
      }));
    } else {
      setHoverLine(point);
    }
  };

  // Handle mouse down for drag start
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    const nearestLine = findNearestLine(point);
    if (nearestLine) {
      e.preventDefault();
      setDragState({
        ...nearestLine,
        initialPosition: nearestLine.type === 'horizontal' 
          ? history.present.horizontal[nearestLine.index]
          : history.present.vertical[nearestLine.index].x
      });
    }
  };

  // Handle mouse up for drag end
  const handleMouseUp = () => {
    if (dragState) {
      setHistory(prev => addToHistory(prev, prev.present));
    }
    setDragState(null);
  };

  // Handle click to add slice line
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (dragState) return;
    
    const point = getCanvasCoordinates(e);
    if (!point || !canvasDimensions) return;

    setHistory(prev => {
      const newState = {
        ...prev.present,
        ...(isShiftPressed
          ? {
              vertical: [
                ...prev.present.vertical,
                {
                  x: point.x,
                  ...findContainingBoundaries(point.y, canvasDimensions.height, prev.present.horizontal)
                }
              ].sort((a, b) => a.x - b.x)
            }
          : {
              horizontal: [...prev.present.horizontal, point.y].sort((a, b) => a - b)
            })
      };
      return addToHistory(prev, newState);
    });
  };

  // Handle double click to remove lines
  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point || !canvasDimensions) return;

    const threshold = 10; // pixels
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaledThreshold = threshold * scaleX;

    setHistory(prev => {
      const newState = {
        horizontal: prev.present.horizontal.filter(h => Math.abs(h - point.y) > scaledThreshold),
        vertical: prev.present.vertical.filter(v => {
          const isWithinXThreshold = Math.abs(v.x - point.x) > scaledThreshold;
          const isWithinYRange = point.y >= v.upperBound - scaledThreshold && point.y <= v.lowerBound + scaledThreshold;
          return !(isWithinXThreshold === false && isWithinYRange);
        })
      };
      return addToHistory(prev, newState);
    });
  };

  // Draw the image and lines
  useEffect(() => {
    if (!imageFile || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Get container dimensions
      const containerWidth = container.clientWidth - 48;
      const containerHeight = window.innerHeight * 0.7;
      
      let width = img.width;
      let height = img.height;
      
      // Calculate scale to fit container while maintaining aspect ratio
      const scaleWidth = containerWidth / width;
      const scaleHeight = containerHeight / height;
      const scale = Math.min(scaleWidth, scaleHeight);
      
      width = width * scale;
      height = height * scale;

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      setCanvasDimensions({ width, height });

      // Draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Draw existing slice lines
      ctx.strokeStyle = '#2563eb'; // blue-600
      ctx.lineWidth = 2;

      // Draw horizontal lines
      history.present.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw vertical lines within their sections
      history.present.vertical.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.x, line.upperBound);
        ctx.lineTo(line.x, line.lowerBound);
        ctx.stroke();
      });

      // Draw hover guide if exists
      if (hoverLine) {
        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        if (isShiftPressed) {
          // For vertical hover guide, only show between containing boundaries
          const { upperBound, lowerBound } = findContainingBoundaries(hoverLine.y, height, history.present.horizontal);
          ctx.beginPath();
          ctx.moveTo(hoverLine.x, upperBound);
          ctx.lineTo(hoverLine.x, lowerBound);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, hoverLine.y);
          ctx.lineTo(width, hoverLine.y);
          ctx.stroke();
        }
        
        ctx.setLineDash([]);
      }

      // Notify parent of dimensions
      onLoad?.({ width, height });

      // Clean up
      URL.revokeObjectURL(img.src);
    };

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile, onLoad, history.present, hoverLine, isShiftPressed]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <UndoRedo
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-50 border rounded-lg shadow-inner overflow-hidden"
        style={{ minHeight: '70vh' }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full rounded-lg shadow-lg ${dragState ? 'cursor-move' : 'cursor-crosshair'}`}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setHoverLine(null);
              setDragState(null);
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageCanvas; 