import { useState, useCallback } from 'react';
import { SliceLines, Point, ImageDimensions } from '../utils/types';
import { findContainingBoundaries, updateSliceLinesOnHorizontalDrag, updateSliceLinesOnVerticalDrag } from '../utils/lineManagement';
import { HistoryState, createInitialHistory, addToHistory, undo, redo } from '../utils/history';
import { saveLinesToStorage, getLinesFromStorage } from '../utils/storage';

interface DragState {
  type: 'horizontal' | 'vertical';
  index: number;
  initialPosition: number;
}

interface NearestLine {
  type: 'horizontal' | 'vertical';
  index: number;
  distance: number;
}

export function useLineManagement(canvasDimensions: ImageDimensions | null) {
  const [history, setHistory] = useState<HistoryState>(() => {
    const storedLines = getLinesFromStorage();
    return createInitialHistory(storedLines || { horizontal: [], vertical: [] });
  });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ type: 'horizontal' | 'vertical', index: number } | null>(null);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);

  const findNearestLine = useCallback((point: Point, threshold: number = 10, scale: number): { type: 'horizontal' | 'vertical', index: number } | null => {
    const scaledThreshold = threshold * scale;
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
  }, [history.present]);

  const handleDragStart = useCallback((point: Point, nearestLine: { type: 'horizontal' | 'vertical', index: number }) => {
    setDragState({
      ...nearestLine,
      initialPosition: nearestLine.type === 'horizontal' 
        ? history.present.horizontal[nearestLine.index]
        : history.present.vertical[nearestLine.index].x
    });
  }, [history.present]);

  const handleDragMove = useCallback((point: Point) => {
    if (!dragState || !canvasDimensions) return;

    const newState = dragState.type === 'horizontal'
      ? updateSliceLinesOnHorizontalDrag(history.present, dragState.index, point.y, canvasDimensions)
      : updateSliceLinesOnVerticalDrag(history.present, dragState.index, point.x);
    
    setHistory(prev => ({
      ...prev,
      present: newState
    }));
  }, [dragState, canvasDimensions, history.present]);

  const handleDragEnd = useCallback(() => {
    if (dragState) {
      setHistory(prev => addToHistory(prev, prev.present));
      setJustFinishedDrag(true);
      setTimeout(() => setJustFinishedDrag(false), 100);
    }
    setDragState(null);
  }, [dragState]);

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

  const addLine = useCallback((point: Point, isVertical: boolean) => {
    if (!canvasDimensions || justFinishedDrag) return;

    setHistory(prev => {
      const newState = {
        ...prev.present,
        ...(isVertical
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
  }, [canvasDimensions, justFinishedDrag]);

  return {
    lines: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    dragState,
    hoveredLine,
    justFinishedDrag,
    findNearestLine,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleUndo,
    handleRedo,
    addLine,
    setHoveredLine
  };
} 