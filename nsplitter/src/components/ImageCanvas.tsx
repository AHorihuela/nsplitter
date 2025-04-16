import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { SliceLines, ImageDimensions, Point, VerticalLine } from '../utils/types';

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
  const [sliceLines, setSliceLines] = useState<SliceLines>({
    horizontal: [],
    vertical: []
  });
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

  // Find the containing horizontal boundaries for a given y-coordinate
  const findContainingBoundaries = (y: number, height: number, horizontalLines: number[] = sliceLines.horizontal) => {
    const allBoundaries = [0, ...horizontalLines, height].sort((a, b) => a - b);
    let upperBound = 0;
    let lowerBound = height;

    for (let i = 0; i < allBoundaries.length - 1; i++) {
      if (y >= allBoundaries[i] && y <= allBoundaries[i + 1]) {
        upperBound = allBoundaries[i];
        lowerBound = allBoundaries[i + 1];
        break;
      }
    }

    console.log('Finding boundaries:', {
      y,
      horizontalLines,
      allBoundaries,
      upperBound,
      lowerBound
    });

    return { upperBound, lowerBound };
  };

  // Find the nearest line to a point
  const findNearestLine = (point: Point, threshold: number = 10): { type: 'horizontal' | 'vertical', index: number } | null => {
    // Convert threshold to canvas scale
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaledThreshold = threshold * scaleX;

    // Check horizontal lines
    for (let i = 0; i < sliceLines.horizontal.length; i++) {
      if (Math.abs(sliceLines.horizontal[i] - point.y) <= scaledThreshold) {
        return { type: 'horizontal', index: i };
      }
    }

    // Check vertical lines
    for (let i = 0; i < sliceLines.vertical.length; i++) {
      const line = sliceLines.vertical[i];
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

  // Handle mouse movement for hover guide or drag
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point || !canvasDimensions) return;

    if (dragState) {
      e.preventDefault();
      setSliceLines(prev => {
        if (dragState.type === 'horizontal') {
          console.log('Dragging horizontal line:', {
            dragIndex: dragState.index,
            currentPosition: prev.horizontal[dragState.index],
            newPosition: point.y,
            allHorizontalLines: prev.horizontal,
            verticalLines: prev.vertical.map(v => ({
              x: v.x,
              upper: v.upperBound,
              lower: v.lowerBound
            }))
          });

          const newHorizontal = [...prev.horizontal];
          const oldY = newHorizontal[dragState.index];
          newHorizontal[dragState.index] = Math.max(0, Math.min(point.y, canvasDimensions.height));
          const sortedHorizontal = newHorizontal.sort((a, b) => a - b);

          // Update vertical lines' boundaries when horizontal lines move
          const newVertical = prev.vertical.map((line, idx) => {
            // If the line was bounded by the moved horizontal line,
            // we need to update its boundaries
            const wasUpperBound = Math.abs(line.upperBound - oldY) < 1;
            const wasLowerBound = Math.abs(line.lowerBound - oldY) < 1;

            console.log(`Checking vertical line ${idx}:`, {
              x: line.x,
              currentUpper: line.upperBound,
              currentLower: line.lowerBound,
              movedLineOldPosition: oldY,
              wasUpperBound,
              wasLowerBound
            });

            if (wasUpperBound || wasLowerBound) {
              const { upperBound, lowerBound } = findContainingBoundaries(line.x, canvasDimensions.height, sortedHorizontal);
              console.log(`Updating vertical line ${idx} bounds:`, {
                oldUpper: line.upperBound,
                oldLower: line.lowerBound,
                newUpper: upperBound,
                newLower: lowerBound
              });
              return {
                ...line,
                upperBound,
                lowerBound
              };
            }
            return line;
          });

          console.log('Updated state:', {
            horizontalLines: sortedHorizontal,
            verticalLines: newVertical.map(v => ({
              x: v.x,
              upper: v.upperBound,
              lower: v.lowerBound
            }))
          });

          return {
            horizontal: sortedHorizontal,
            vertical: newVertical
          };
        } else {
          console.log('Dragging vertical line:', {
            dragIndex: dragState.index,
            currentX: prev.vertical[dragState.index].x,
            newX: point.x,
            currentPoint: point
          });

          const newVertical = [...prev.vertical];
          const line = newVertical[dragState.index];
          const { upperBound, lowerBound } = findContainingBoundaries(point.y, canvasDimensions.height);
          
          console.log('Updating vertical line bounds:', {
            oldX: line.x,
            newX: point.x,
            oldUpper: line.upperBound,
            oldLower: line.lowerBound,
            newUpper: upperBound,
            newLower: lowerBound
          });

          newVertical[dragState.index] = {
            ...line,
            x: Math.max(0, Math.min(point.x, canvasDimensions.width)),
            upperBound,
            lowerBound
          };
          return {
            ...prev,
            vertical: newVertical.sort((a, b) => a.x - b.x)
          };
        }
      });
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
          ? sliceLines.horizontal[nearestLine.index]
          : sliceLines.vertical[nearestLine.index].x
      });
    }
  };

  // Handle mouse up for drag end
  const handleMouseUp = () => {
    setDragState(null);
  };

  // Handle click to add slice line
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (dragState) return;
    
    const point = getCanvasCoordinates(e);
    if (!point || !canvasDimensions) return;

    setSliceLines(prev => {
      if (isShiftPressed) {
        const { upperBound, lowerBound } = findContainingBoundaries(point.y, canvasDimensions.height);
        const newVerticalLine: VerticalLine = {
          x: point.x,
          upperBound,
          lowerBound
        };
        
        // Sort vertical lines by x-coordinate
        const newVertical = [...prev.vertical, newVerticalLine]
          .sort((a, b) => a.x - b.x);
        
        return {
          ...prev,
          vertical: newVertical
        };
      } else {
        return {
          ...prev,
          horizontal: [...prev.horizontal, point.y].sort((a, b) => a - b)
        };
      }
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

    setSliceLines(prev => ({
      horizontal: prev.horizontal.filter(h => Math.abs(h - point.y) > scaledThreshold),
      vertical: prev.vertical.filter(v => {
        const isWithinXThreshold = Math.abs(v.x - point.x) > scaledThreshold;
        const isWithinYRange = point.y >= v.upperBound - scaledThreshold && point.y <= v.lowerBound + scaledThreshold;
        return !(isWithinXThreshold === false && isWithinYRange);
      })
    }));
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
      sliceLines.horizontal.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw vertical lines within their sections
      sliceLines.vertical.forEach(line => {
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
          const { upperBound, lowerBound } = findContainingBoundaries(hoverLine.y, height);
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
  }, [imageFile, onLoad, sliceLines, hoverLine, isShiftPressed]);

  return (
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
  );
};

export default ImageCanvas; 