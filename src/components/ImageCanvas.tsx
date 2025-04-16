import React, { useEffect, useRef, useState, MouseEvent, useCallback } from 'react';
import { SliceLines, ImageDimensions, Point, VerticalLine } from '../utils/types';
import { findContainingBoundaries, updateSliceLinesOnHorizontalDrag, updateSliceLinesOnVerticalDrag } from '../utils/lineManagement';
import { HistoryState, createInitialHistory, addToHistory, undo, redo } from '../utils/history';
import { saveLinesToStorage, getLinesFromStorage } from '../utils/storage';
import UndoRedo from './UndoRedo';
import { createImageSlicesZip, downloadZip } from '../utils/imageSlicing';

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
  const [history, setHistory] = useState<HistoryState>(() => {
    const storedLines = getLinesFromStorage();
    return createInitialHistory(storedLines || { horizontal: [], vertical: [] });
  });
  const [canvasDimensions, setCanvasDimensions] = useState<ImageDimensions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<{ type: 'horizontal' | 'vertical', index: number } | null>(null);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);

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
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaledThreshold = threshold * scaleX;

    interface NearestLine {
      type: 'horizontal' | 'vertical';
      index: number;
      distance: number;
    }

    let nearestLine: NearestLine | null = null;

    // Check horizontal lines
    history.present.horizontal.forEach((y, index) => {
      const distance = Math.abs(y - point.y);
      if (distance <= scaledThreshold && (!nearestLine || distance < nearestLine.distance)) {
        nearestLine = { type: 'horizontal', index, distance };
      }
    });

    // Check vertical lines
    history.present.vertical.forEach((line, index) => {
      const distance = Math.abs(line.x - point.x);
      if (distance <= scaledThreshold && 
          point.y >= line.upperBound - scaledThreshold && 
          point.y <= line.lowerBound + scaledThreshold &&
          (!nearestLine || distance < nearestLine.distance)) {
        nearestLine = { type: 'vertical', index, distance };
      }
    });

    return nearestLine ? { type: nearestLine.type, index: nearestLine.index } : null;
  };

  const findNearestLineWithThreshold = useCallback((point: Point) => {
    return findNearestLine(point, history.present, 5);
  }, [history.present]);

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
        : updateSliceLinesOnVerticalDrag(history.present, dragState.index, point.x);
      
      setHistory(prev => ({
        ...prev,
        present: newState
      }));
    } else {
      setHoverLine(point);
      const nearest = findNearestLineWithThreshold(point);
      if (nearest && nearest.type && nearest.index !== null) {
        setHoveredLine({ type: nearest.type, index: nearest.index });
      } else {
        setHoveredLine(null);
      }
    }
  };

  // Handle mouse down for drag start
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    const nearest = findNearestLineWithThreshold(point);
    if (nearest && nearest.type && nearest.index !== null) {
      e.preventDefault();
      setDragState({
        type: nearest.type,
        index: nearest.index,
        initialPosition: nearest.type === 'horizontal' 
          ? history.present.horizontal[nearest.index]
          : history.present.vertical[nearest.index].x
      });
    }
  };

  // Handle mouse up for drag end
  const handleMouseUp = () => {
    if (dragState) {
      setHistory(prev => addToHistory(prev, prev.present));
      setJustFinishedDrag(true);
      // Reset the flag after a short delay
      setTimeout(() => setJustFinishedDrag(false), 100);
    }
    setDragState(null);
  };

  // Handle click to add slice line
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (dragState || justFinishedDrag) return;
    
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
      // Set a minimum width for better precision
      const minWidth = 800;
      const containerWidth = Math.max(minWidth, container.clientWidth - 48);
      
      let width = img.width;
      let height = img.height;
      
      // Calculate scale based on minimum width
      const scale = containerWidth / width;
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
      ctx.lineWidth = 2;

      // Draw horizontal lines
      history.present.horizontal.forEach((y, index) => {
        const isHovered = hoveredLine?.type === 'horizontal' && hoveredLine.index === index;
        ctx.strokeStyle = isHovered ? '#ef4444' : '#2563eb'; // red-500 : blue-600
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw vertical lines within their sections
      history.present.vertical.forEach((line, index) => {
        const isHovered = hoveredLine?.type === 'vertical' && hoveredLine.index === index;
        ctx.strokeStyle = isHovered ? '#ef4444' : '#2563eb'; // red-500 : blue-600
        ctx.beginPath();
        ctx.moveTo(line.x, line.upperBound);
        ctx.lineTo(line.x, line.lowerBound);
        ctx.stroke();
      });

      // Draw hover guide if exists
      if (hoverLine && !hoveredLine) {
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
  }, [imageFile, onLoad, history.present, hoverLine, isShiftPressed, hoveredLine]);

  // Update session storage whenever lines change
  useEffect(() => {
    saveLinesToStorage(history.present);
  }, [history.present]);

  const handleExport = async () => {
    if (!canvasRef.current || !canvasDimensions || !imageFile) return;

    try {
      setIsProcessing(true);
      const fileType = imageFile.type || 'image/jpeg';
      const zipBlob = await createImageSlicesZip(
        canvasRef.current,
        history.present,
        canvasDimensions,
        fileType
      );
      downloadZip(zipBlob);
    } catch (error) {
      console.error('Failed to export slices:', error);
      // TODO: Add proper error handling UI
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear all lines
  const handleClearLines = useCallback(() => {
    setHistory(prev => addToHistory(prev, { horizontal: [], vertical: [] }));
  }, []);

  // Reset lines when image changes
  useEffect(() => {
    handleClearLines();
  }, [imageFile, handleClearLines]);

  return (
    <div className="relative flex flex-col w-full gap-2">
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-50 border rounded-lg shadow-inner overflow-auto"
        style={{ maxHeight: 'calc(90vh - 120px)' }}
      >
        <div className="flex items-center justify-center p-3">
          <canvas
            ref={canvasRef}
            className={`rounded-lg shadow-lg ${dragState ? 'cursor-move' : hoveredLine ? 'cursor-pointer' : 'cursor-crosshair'}`}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setHoverLine(null);
              setDragState(null);
              setHoveredLine(null);
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UndoRedo
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
          <button
            onClick={handleClearLines}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Clear Lines
          </button>
        </div>
        {imageFile && (
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md shadow-sm text-white
              ${isProcessing
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'}
              transition-colors duration-200
            `}
          >
            {isProcessing ? 'Processing...' : 'Export Slices'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageCanvas; 