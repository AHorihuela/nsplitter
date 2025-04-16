import { useEffect, RefObject } from 'react';
import { SliceLines, ImageDimensions, Point } from '../utils/types';
import { findContainingBoundaries } from '../utils/lineManagement';
import { calculateSliceRegions } from '../utils/imageSlicing';

interface UseCanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  containerRef: RefObject<HTMLDivElement>;
  imageFile: File | null;
  lines: SliceLines;
  hoveredLine: { type: 'horizontal' | 'vertical', index: number } | null;
  hoverLine: Point | null;
  isShiftPressed: boolean;
  onDimensionsChange?: (dimensions: ImageDimensions) => void;
}

export function useCanvasDrawing({
  canvasRef,
  containerRef,
  imageFile,
  lines,
  hoveredLine,
  hoverLine,
  isShiftPressed,
  onDimensionsChange
}: UseCanvasDrawingProps) {
  useEffect(() => {
    if (!imageFile || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Use the original image dimensions (100% size)
      
      // Set canvas to original image dimensions
      let width = img.width;
      let height = img.height;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image at its original size
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Make canvas responsive using CSS
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';

      // Calculate slice regions using the same algorithm as export
      const sliceRegions = calculateSliceRegions(lines, { width, height });
      
      // Draw the slice numbers in the top-right corner of each region
      ctx.save();
      sliceRegions.forEach((region, index) => {
        // Draw a semi-transparent background for the number label
        const labelSize = 24;
        const padding = 5;
        const labelX = region.x + region.width - labelSize - padding;
        const labelY = region.y + padding;
        
        // Create a rounded rectangle background
        const cornerRadius = 4;
        ctx.fillStyle = 'rgba(37, 99, 235, 0.85)'; // blue-600 with opacity
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(labelX + cornerRadius, labelY);
        ctx.lineTo(labelX + labelSize - cornerRadius, labelY);
        ctx.quadraticCurveTo(labelX + labelSize, labelY, labelX + labelSize, labelY + cornerRadius);
        ctx.lineTo(labelX + labelSize, labelY + labelSize - cornerRadius);
        ctx.quadraticCurveTo(labelX + labelSize, labelY + labelSize, labelX + labelSize - cornerRadius, labelY + labelSize);
        ctx.lineTo(labelX + cornerRadius, labelY + labelSize);
        ctx.quadraticCurveTo(labelX, labelY + labelSize, labelX, labelY + labelSize - cornerRadius);
        ctx.lineTo(labelX, labelY + cornerRadius);
        ctx.quadraticCurveTo(labelX, labelY, labelX + cornerRadius, labelY);
        ctx.closePath();
        ctx.fill();
        
        // Add a subtle shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Draw slice number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          (index + 1).toString(),
          labelX + labelSize / 2,
          labelY + labelSize / 2
        );
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });
      ctx.restore();

      // Draw existing slice lines
      ctx.lineWidth = 2;

      // Draw horizontal lines
      lines.horizontal.forEach((y, index) => {
        const isHovered = hoveredLine?.type === 'horizontal' && hoveredLine.index === index;
        ctx.strokeStyle = isHovered ? '#ef4444' : '#2563eb'; // red-500 : blue-600
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      // Draw vertical lines within their sections
      lines.vertical.forEach((line, index) => {
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
          const { upperBound, lowerBound } = findContainingBoundaries(hoverLine.y, height, lines.horizontal);
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
      onDimensionsChange?.({ width, height });

      // Clean up
      URL.revokeObjectURL(img.src);
    };

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile, lines, hoveredLine, hoverLine, isShiftPressed, onDimensionsChange]);

  return {
    getScale: () => {
      if (!canvasRef.current) return 1;
      const rect = canvasRef.current.getBoundingClientRect();
      return canvasRef.current.width / rect.width;
    }
  };
} 