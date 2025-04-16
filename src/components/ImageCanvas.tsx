import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ImageDimensions, Point } from '../utils/types';
import { createImageSlicesZip, downloadZip } from '../utils/imageSlicing';
import { useMouseInteractions } from '../hooks/useMouseInteractions';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useLineManagement } from '../hooks/useLineManagement';

// Constants for interaction
const DRAG_THRESHOLD = 5;

interface ImageCanvasProps {
  imageFile: File | null;
  onLoad?: (dimensions: ImageDimensions) => void;
  onControlStateChange?: (state: {
    canUndo: boolean;
    canRedo: boolean;
    canExport: boolean;
    isProcessing: boolean;
  }) => void;
}

// Define ref type for component
export interface ImageCanvasRef {
  handleUndo: () => void;
  handleRedo: () => void;
  clearLines: () => void;
  handleExport: () => void;
}

const ImageCanvas = forwardRef<ImageCanvasRef, ImageCanvasProps>(({ 
  imageFile, 
  onLoad,
  onControlStateChange
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<ImageDimensions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Line management hook
  const {
    history,
    handleUndo,
    handleRedo,
    handleLineAdd,
    handleLineDrag,
    handleLineRemove,
    clearLines
  } = useLineManagement(canvasDimensions);

  // Mouse interactions hook
  const {
    isShiftPressed,
    isDragging,
    hoveredLine,
    hoverLine,
    handlers
  } = useMouseInteractions({
    canvasRef,
    canvasDimensions,
    lines: history.present,
    onDragStart: (type, index) => {
      // Properly handle the start of a drag operation
      console.log('Started dragging', type, 'line at index', index);
    },
    onDragEnd: () => {
      // Properly handle the end of a drag operation
      console.log('Ended dragging line');
    },
    onDrag: (point: Point) => {
      if (hoveredLine) {
        handleLineDrag(hoveredLine.type, hoveredLine.index, point);
      }
    },
    onLineAdd: (point: Point, isShiftPressed: boolean) => {
      handleLineAdd(point, isShiftPressed);
    },
    onLineRemove: (point: Point) => {
      // Get the scale factor to adjust the threshold for removal
      const getScale = () => {
        if (!canvasRef.current) return 1;
        const rect = canvasRef.current.getBoundingClientRect();
        return canvasRef.current.width / rect.width;
      };
      
      // Apply the scale to the threshold
      handleLineRemove(point, DRAG_THRESHOLD / getScale());
    }
  });

  // Canvas drawing hook
  useCanvasDrawing({
    canvasRef,
    containerRef,
    imageFile,
    lines: history.present,
    hoveredLine,
    hoverLine,
    isShiftPressed,
    onDimensionsChange: (dimensions) => {
      setCanvasDimensions(dimensions);
      onLoad?.(dimensions);
    }
  });

  // Handle export
  const handleExport = async () => {
    if (!canvasRef.current || !canvasDimensions || !imageFile) return;

    try {
      setIsProcessing(true);
      // Update control state
      onControlStateChange?.({
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        canExport: true,
        isProcessing: true
      });
      
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
      // Update control state
      onControlStateChange?.({
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        canExport: true,
        isProcessing: false
      });
    }
  };

  // Update control state on history changes
  React.useEffect(() => {
    onControlStateChange?.({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      canExport: !!imageFile,
      isProcessing
    });
  }, [history.past.length, history.future.length, imageFile, isProcessing, onControlStateChange]);

  // Expose methods for external components
  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    clearLines,
    handleExport
  }), [handleUndo, handleRedo, clearLines, handleExport]);

  return (
    <div className="relative flex flex-col w-full">
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-50 border rounded-lg shadow-inner"
      >
        <div className="flex items-center justify-center p-3">
          <canvas
            ref={canvasRef}
            className={`rounded-lg shadow-lg ${
              isDragging ? 'cursor-move' : 
              hoveredLine ? 'cursor-pointer' : 
              'cursor-crosshair'
            }`}
            onMouseMove={handlers.onMouseMove}
            onMouseDown={handlers.onMouseDown}
            onMouseUp={handlers.onMouseUp}
            onMouseLeave={handlers.onMouseLeave}
            onClick={handlers.onClick}
            onDoubleClick={handlers.onDoubleClick}
          />
        </div>
      </div>
    </div>
  );
});

export default ImageCanvas; 