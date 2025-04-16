import { useState, useCallback, RefObject, MouseEvent, useEffect } from 'react';
import { Point, ImageDimensions, SliceLines } from '../utils/types';
import { findNearestLine } from '../utils/lineManagement';

const DRAG_THRESHOLD = 5;

interface UseMouseInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasDimensions: ImageDimensions | null;
  lines: SliceLines;
  onDragStart: (type: 'horizontal' | 'vertical', index: number) => void;
  onDragEnd: () => void;
  onDrag: (point: Point) => void;
  onLineAdd: (point: Point, isShiftPressed: boolean) => void;
  onLineRemove?: (point: Point) => void;
}

interface MouseHandlers {
  onMouseMove: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave: () => void;
  onClick: (e: MouseEvent<HTMLCanvasElement>) => void;
  onDoubleClick: (e: MouseEvent<HTMLCanvasElement>) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onKeyUp: (e: KeyboardEvent) => void;
}

export function useMouseInteractions({
  canvasRef,
  canvasDimensions,
  lines,
  onDragStart,
  onDragEnd,
  onDrag,
  onLineAdd,
  onLineRemove
}: UseMouseInteractionsProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ type: 'horizontal' | 'vertical', index: number } | null>(null);
  const [hoverLine, setHoverLine] = useState<Point | null>(null);

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

  const getScale = (): number => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return canvasRef.current.width / rect.width;
  };

  const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    if (isDragging) {
      onDrag(point);
      return;
    }

    // Find nearest line for hover effect
    const scale = getScale();
    const nearest = findNearestLine(point, lines, DRAG_THRESHOLD / scale);
    if (nearest && nearest.type && nearest.index !== null) {
      setHoveredLine({ type: nearest.type, index: nearest.index });
      setHoverLine(null);
    } else {
      setHoveredLine(null);
      setHoverLine(point);
    }
  }, [isDragging, lines, onDrag, getCanvasCoordinates, getScale]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    setDragStartPoint(point);

    if (hoveredLine) {
      setIsDragging(true);
      onDragStart(hoveredLine.type, hoveredLine.index);
    }
  }, [hoveredLine, onDragStart]);

  const handleMouseUp = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point || !dragStartPoint) return;

    const dx = Math.abs(point.x - dragStartPoint.x);
    const dy = Math.abs(point.y - dragStartPoint.y);

    if (isDragging) {
      onDragEnd();
      setIsDragging(false);
    } else if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      onLineAdd(point, isShiftPressed);
    }

    setDragStartPoint(null);
  }, [dragStartPoint, isDragging, isShiftPressed, onLineAdd, onDragEnd]);

  const handleClick = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    // Do nothing - line creation is handled in mouseUp
    e.preventDefault();
  }, []);

  const handleDoubleClick = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(e);
    if (!point) return;

    // Remove line if double-clicked
    const scale = getScale();
    const nearest = findNearestLine(point, lines, DRAG_THRESHOLD / scale);
    if (nearest && nearest.type && nearest.index !== null) {
      if (onLineRemove) {
        onLineRemove(point);
      }
    }
  }, [lines, onLineRemove]);

  const handleMouseLeave = useCallback(() => {
    setHoveredLine(null);
    setHoverLine(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      console.log('Shift key pressed');
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      console.log('Shift key released');
      setIsShiftPressed(false);
    }
  }, []);

  // Add effect to handle keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Add debug logging for shift state changes
  useEffect(() => {
    console.log('Shift pressed state:', isShiftPressed);
  }, [isShiftPressed]);

  return {
    isShiftPressed,
    isDragging,
    hoveredLine,
    hoverLine,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp
    } as MouseHandlers
  };
} 