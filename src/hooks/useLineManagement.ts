import { useState, useCallback, useEffect, useRef } from 'react';
import { SliceLines, Point, ImageDimensions } from '../utils/types';
import { findContainingBoundaries, updateSliceLinesOnHorizontalDrag, updateSliceLinesOnVerticalDrag, updateVerticalLineBoundaries } from '../utils/lineManagement';
import { HistoryState, createInitialHistory, addToHistory, undo, redo } from '../utils/history';
import { saveLinesToStorage, getLinesFromStorage, getCurrentImageHash } from '../utils/storage';

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

interface UseLineManagementResult {
  history: HistoryState;
  handleUndo: () => void;
  handleRedo: () => void;
  handleLineAdd: (point: Point, isShiftPressed: boolean) => void;
  handleLineDrag: (type: 'horizontal' | 'vertical', index: number, point: Point) => void;
  handleLineRemove: (point: Point, threshold: number) => void;
  clearLines: () => void;
  updateImageHash: (hash: string) => void;
}

export function useLineManagement(canvasDimensions: ImageDimensions | null): UseLineManagementResult {
  const [imageHash, setImageHash] = useState<string | null>(() => getCurrentImageHash());
  const imageHashRef = useRef<string | null>(imageHash);
  const [history, setHistory] = useState<HistoryState>(() => {
    const currentHash = getCurrentImageHash();
    // Only load lines if we have a current image hash
    if (currentHash) {
      const storedLines = getLinesFromStorage(currentHash);
      if (storedLines) {
        console.log('Loaded lines for image hash:', currentHash, storedLines);
        return createInitialHistory(storedLines);
      }
    }
    return createInitialHistory({ horizontal: [], vertical: [] });
  });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ type: 'horizontal' | 'vertical', index: number } | null>(null);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);

  // Update imageHashRef when imageHash changes
  useEffect(() => {
    imageHashRef.current = imageHash;
  }, [imageHash]);

  // Update the current image hash
  const updateImageHash = useCallback((hash: string) => {
    console.log('Updating image hash to:', hash);
    setImageHash(hash);
    // Load lines for this image if they exist
    const storedLines = getLinesFromStorage(hash);
    if (storedLines) {
      console.log('Found stored lines for hash:', hash, storedLines);
      setHistory(createInitialHistory(storedLines));
    } else {
      console.log('No stored lines found for hash:', hash);
      // If no lines exist for this image, reset to empty
      setHistory(createInitialHistory({ horizontal: [], vertical: [] }));
    }
  }, []);

  const findNearestLine = useCallback((point: Point, threshold: number = 10, scale: number): { type: 'horizontal' | 'vertical', index: number } | null => {
    const scaledThreshold = threshold / scale;
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

    // Type safety assertion
    return nearestLine ? { 
      type: nearestLine.type as 'horizontal' | 'vertical', 
      index: nearestLine.index 
    } : null;
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

  const handleLineAdd = useCallback((point: Point, isShiftPressed: boolean) => {
    if (!canvasDimensions || justFinishedDrag) return;

    setHistory(prev => {
      const newState = {
        ...prev.present,
        ...(isShiftPressed
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

  const handleLineDrag = useCallback((type: 'horizontal' | 'vertical', index: number, point: Point) => {
    if (!canvasDimensions) return;

    setHistory(prev => {
      const newState = type === 'horizontal'
        ? updateSliceLinesOnHorizontalDrag(prev.present, index, point.y, canvasDimensions)
        : updateSliceLinesOnVerticalDrag(prev.present, index, point.x);
      
      return {
        ...prev,
        present: newState
      };
    });
  }, [canvasDimensions]);

  const handleLineRemove = useCallback((point: Point, threshold: number) => {
    if (!canvasDimensions) return;
    
    setHistory(prev => {
      // Check if we're removing a horizontal line
      const removingHorizontal = prev.present.horizontal.some(h => Math.abs(h - point.y) <= threshold);
      
      // Filter the horizontal lines
      const newHorizontal = prev.present.horizontal.filter(h => Math.abs(h - point.y) > threshold);
      
      // Filter vertical lines
      const newVertical = prev.present.vertical.filter(v => {
        const isWithinXThreshold = Math.abs(v.x - point.x) > threshold;
        const isWithinYRange = point.y >= v.upperBound - threshold && point.y <= v.lowerBound + threshold;
        return !(isWithinXThreshold === false && isWithinYRange);
      });
      
      // If we removed a horizontal line, we need to update all vertical line boundaries
      // This ensures vertical lines automatically extend to their next boundaries
      // (either another horizontal line or the edge of the image)
      let finalVertical = newVertical;
      if (removingHorizontal) {
        finalVertical = updateVerticalLineBoundaries(
          newVertical,
          newHorizontal,
          canvasDimensions.height
        );
      }
      
      const newState = {
        horizontal: newHorizontal,
        vertical: finalVertical
      };
      
      return addToHistory(prev, newState);
    });
  }, [canvasDimensions]);

  const clearLines = useCallback(() => {
    setHistory(prev => addToHistory(prev, { horizontal: [], vertical: [] }));
  }, []);

  // Save lines to storage whenever they change
  useEffect(() => {
    if (imageHash) {
      console.log('Saving lines to storage for hash:', imageHash, history.present);
      saveLinesToStorage(history.present, imageHash);
    } else {
      const currentHash = getCurrentImageHash();
      if (currentHash) {
        console.log('No imageHash in state, but found current hash in storage:', currentHash);
        console.log('Saving lines to storage for current hash:', currentHash, history.present);
        saveLinesToStorage(history.present, currentHash);
        if (!imageHashRef.current) {
          setImageHash(currentHash);
        }
      }
    }
  }, [history.present, imageHash]);

  return {
    history,
    handleUndo,
    handleRedo,
    handleLineAdd,
    handleLineDrag,
    handleLineRemove,
    clearLines,
    updateImageHash
  };
} 