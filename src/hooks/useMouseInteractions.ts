import { useState, useCallback, RefObject } from 'react';
import { Point, SliceLines } from '../utils/types';
import { findNearestLine } from '../utils/lineManagement';

const DRAG_THRESHOLD = 5;

interface UseMouseInteractionsProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  lines: SliceLines;
  onDragStart: (type: 'horizontal' | 'vertical', index: number) => void;
  onDragEnd: () => void;
  onDrag: (point: Point) => void;
  onLineAdd: (point: Point, isShiftPressed: boolean) => void;
}

export function useMouseInteractions({
  canvasRef,
  lines,
  onDragStart,
  onDragEnd,
  onDrag,
  onLineAdd
}: UseMouseInteractionsProps) {
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ type: 'horizontal' | 'vertical', index: number } | null>(null);
  const [hoverLine, setHoverLine] = useState<Point | null>(null);

  const getCanvasPoint = useCallback((e: MouseEvent | React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale
    };
  }, [canvasRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (isDragging) {
      onDrag(point);
      return;
    }

    // Find nearest line for hover effect
    const nearest = findNearestLine(point, lines);
    if (nearest && nearest.distance < DRAG_THRESHOLD) {
      setHoveredLine(nearest);
      setHoverLine(null);
    } else {
      setHoveredLine(null);
      setHoverLine(point);
    }
  }, [isDragging, lines, getCanvasPoint, onDrag]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    setDragStartPoint(point);

    if (hoveredLine) {
      setIsDragging(true);
      onDragStart(hoveredLine.type, hoveredLine.index);
    }
  }, [hoveredLine, getCanvasPoint, onDragStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragStartPoint) return;

    const point = getCanvasPoint(e);
    const dx = Math.abs(point.x - dragStartPoint.x);
    const dy = Math.abs(point.y - dragStartPoint.y);

    if (!isDragging && dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
      onLineAdd(point, isShiftPressed);
    }

    if (isDragging) {
      onDragEnd();
    }

    setIsDragging(false);
    setDragStartPoint(null);
  }, [dragStartPoint, isDragging, isShiftPressed, getCanvasPoint, onLineAdd, onDragEnd]);

  const handleMouseLeave = useCallback(() => {
    setHoveredLine(null);
    setHoverLine(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  }, []);

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
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp
    }
  };
} 