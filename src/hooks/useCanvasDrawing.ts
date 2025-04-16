import { useEffect, RefObject } from 'react';
import { SliceLines, ImageDimensions, Point } from '../utils/types';
import { findContainingBoundaries } from '../utils/lineManagement';

interface DrawingOptions {
  hoveredLine: { type: 'horizontal' | 'vertical', index: number } | null;
  hoverLine: Point | null;
  isShiftPressed: boolean;
}

export function useCanvasDrawing(
  canvasRef: RefObject<HTMLCanvasElement>,
  containerRef: RefObject<HTMLDivElement>,
  imageFile: File | null,
  lines: SliceLines,
  options: DrawingOptions,
  onLoad?: (dimensions: ImageDimensions) => void
) {
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

      // Draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Draw existing slice lines
      ctx.lineWidth = 2;

      // Draw horizontal lines
      lines.horizontal.forEach((y, index) => {
        const isHovered = options.hoveredLine?.type === 'horizontal' && options.hoveredLine.index === index;
        ctx.strokeStyle = isHovered ? '#ef4444' : '#2563eb'; // red-500 : blue-600
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw vertical lines within their sections
      lines.vertical.forEach((line, index) => {
        const isHovered = options.hoveredLine?.type === 'vertical' && options.hoveredLine.index === index;
        ctx.strokeStyle = isHovered ? '#ef4444' : '#2563eb'; // red-500 : blue-600
        ctx.beginPath();
        ctx.moveTo(line.x, line.upperBound);
        ctx.lineTo(line.x, line.lowerBound);
        ctx.stroke();
      });

      // Draw hover guide if exists
      if (options.hoverLine && !options.hoveredLine) {
        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        if (options.isShiftPressed) {
          // For vertical hover guide, only show between containing boundaries
          const { upperBound, lowerBound } = findContainingBoundaries(options.hoverLine.y, height, lines.horizontal);
          ctx.beginPath();
          ctx.moveTo(options.hoverLine.x, upperBound);
          ctx.lineTo(options.hoverLine.x, lowerBound);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, options.hoverLine.y);
          ctx.lineTo(width, options.hoverLine.y);
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
  }, [imageFile, onLoad, lines, options.hoveredLine, options.hoverLine, options.isShiftPressed]);

  return {
    getScale: () => {
      if (!canvasRef.current) return 1;
      const rect = canvasRef.current.getBoundingClientRect();
      return canvasRef.current.width / rect.width;
    }
  };
} 