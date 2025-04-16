import React, { useRef, useState } from 'react';
import { ImageDimensions, Point } from '../utils/types';
import { createImageSlicesZip, downloadZip } from '../utils/imageSlicing';
import { useMouseInteractions } from '../hooks/useMouseInteractions';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useLineManagement } from '../hooks/useLineManagement';
import { CanvasControls } from './CanvasControls';

interface ImageCanvasProps {
  imageFile: File | null;
  onLoad?: (dimensions: ImageDimensions) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageFile, onLoad }) => {
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
      // Start dragging a line
    },
    onDragEnd: () => {
      // End dragging a line
    },
    onDrag: (point: Point) => {
      if (hoveredLine) {
        handleLineDrag(hoveredLine.type, hoveredLine.index, point);
      }
    },
    onLineAdd: (point: Point, isShiftPressed: boolean) => {
      handleLineAdd(point, isShiftPressed);
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

  return (
    <div className="relative flex flex-col w-full gap-2">
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
      <CanvasControls
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={clearLines}
        onExport={handleExport}
        isProcessing={isProcessing}
        showExport={!!imageFile}
      />
    </div>
  );
};

export default ImageCanvas; 