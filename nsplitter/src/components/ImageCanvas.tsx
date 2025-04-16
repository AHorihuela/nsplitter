import React, { useEffect, useRef, useState, MouseEvent } from 'react';
import { SliceLines, ImageDimensions, Point, VerticalLine } from '../utils/types';

interface ImageCanvasProps {
  imageFile: File | null;
  onLoad?: (dimensions: ImageDimensions) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageFile, onLoad }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [hoverLine, setHoverLine] = useState<Point | null>(null);
  const [sliceLines, setSliceLines] = useState<SliceLines>({
    horizontal: [],
    vertical: []
  });
  const [canvasDimensions, setCanvasDimensions] = useState<ImageDimensions | null>(null);

  // Find the containing horizontal boundaries for a given y-coordinate
  const findContainingBoundaries = (y: number, height: number) => {
    const allBoundaries = [0, ...sliceLines.horizontal, height].sort((a, b) => a - b);
    let upperBound = 0;
    let lowerBound = height;

    for (let i = 0; i < allBoundaries.length - 1; i++) {
      if (y >= allBoundaries[i] && y <= allBoundaries[i + 1]) {
        upperBound = allBoundaries[i];
        lowerBound = allBoundaries[i + 1];
        break;
      }
    }

    return { upperBound, lowerBound };
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

  // Handle mouse movement for hover guide
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !canvasDimensions) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverLine({ x, y });
  };

  // Handle click to add slice line
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !canvasDimensions) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSliceLines(prev => {
      if (isShiftPressed) {
        const { upperBound, lowerBound } = findContainingBoundaries(y, canvasDimensions.height);
        const newVerticalLine: VerticalLine = {
          x,
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
          horizontal: [...prev.horizontal, y].sort((a, b) => a - b)
        };
      }
    });
  };

  // Handle double click to remove lines
  const handleDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !canvasDimensions) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const threshold = 10; // pixels

    setSliceLines(prev => ({
      horizontal: prev.horizontal.filter(h => Math.abs(h - y) > threshold),
      vertical: prev.vertical.filter(v => {
        const isWithinXThreshold = Math.abs(v.x - x) > threshold;
        const isWithinYRange = y >= v.upperBound - threshold && y <= v.lowerBound + threshold;
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
          className="max-w-full max-h-full rounded-lg shadow-lg cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onDoubleClick={handleDoubleClick}
          onMouseLeave={() => setHoverLine(null)}
        />
      </div>
    </div>
  );
};

export default ImageCanvas; 