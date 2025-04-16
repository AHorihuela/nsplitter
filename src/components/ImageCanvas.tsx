import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { ImageDimensions, Point } from '../utils/types';
import { createImageSlicesZip, downloadZip } from '../utils/imageSlicing';
import { useMouseInteractions } from '../hooks/useMouseInteractions';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useLineManagement } from '../hooks/useLineManagement';

// Constants for interaction
const DRAG_THRESHOLD = 5;

interface ImageCanvasProps {
  imageFile: File | null;
  imageHash?: string | null;
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
  updateImageHash: (hash: string) => void;
}

const ImageCanvas = forwardRef<ImageCanvasRef, ImageCanvasProps>(({ 
  imageFile, 
  imageHash,
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
    clearLines,
    updateImageHash
  } = useLineManagement(canvasDimensions);

  // Update imageHash when it changes externally
  useEffect(() => {
    if (imageHash) {
      updateImageHash(imageHash);
    }
  }, [imageHash, updateImageHash]);

  // Additional effect to ensure lines persist after component mounts
  useEffect(() => {
    // This effect runs once on component mount
    if (imageHash) {
      // Force a re-load of lines from storage for this hash
      updateImageHash(imageHash);
    }
  }, []);

  // Add a separate effect to notify parent when lines change
  useEffect(() => {
    onControlStateChange?.({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      canExport: !!imageFile,
      isProcessing
    });
  }, [history.past.length, history.future.length, history.present, imageFile, isProcessing, onControlStateChange]);

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
      
      console.log('Export: Starting image slicing process');
      const fileType = imageFile.type || 'image/jpeg';
      const zipBlob = await createImageSlicesZip(
        canvasRef.current,
        history.present,
        canvasDimensions,
        fileType,
        imageFile
      );
      console.log('Export: Image slicing complete, downloading ZIP');
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

  // Expose methods for external components
  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    clearLines,
    handleExport,
    updateImageHash
  }), [handleUndo, handleRedo, clearLines, handleExport, updateImageHash]);

  return (
    <div className="relative flex flex-col w-full">
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-50 border rounded-lg shadow-inner overflow-auto"
      >
        <div className="flex items-center justify-center p-3">
          <canvas
            ref={canvasRef}
            className="shadow-lg max-w-full"
            style={{
              cursor: isDragging ? 'move' : hoveredLine ? 'pointer' : 'crosshair'
            }}
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