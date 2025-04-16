import { ImageDimensions, VerticalLine, SliceLines, Point, LineType } from './types';

// Constants for line management
export const DRAG_THRESHOLD = 5;
export const LINE_HOVER_THRESHOLD = 10;
export const BOUNDARY_PADDING = 20; // Minimum distance from image edges

export function findContainingBoundaries(y: number, height: number, horizontalLines: number[]): { upperBound: number, lowerBound: number } {
  const sortedLines = [...horizontalLines].sort((a, b) => a - b);
  let upperBound = 0;
  let lowerBound = height;

  for (const line of sortedLines) {
    if (line < y) {
      upperBound = line;
    } else {
      lowerBound = line;
      break;
    }
  }

  return { upperBound, lowerBound };
}

export function updateVerticalLineBoundaries(
  verticalLines: VerticalLine[],
  horizontalLines: number[],
  height: number
): VerticalLine[] {
  return verticalLines.map(line => {
    const { upperBound, lowerBound } = findContainingBoundaries(line.x, height, horizontalLines);
    return { ...line, upperBound, lowerBound };
  });
}

export function updateSliceLinesOnHorizontalDrag(
  lines: SliceLines,
  draggedIndex: number,
  newY: number,
  dimensions: ImageDimensions
): SliceLines {
  // Create a new array with the dragged line at its new position
  const newHorizontal = [...lines.horizontal];
  newHorizontal[draggedIndex] = newY;

  // Sort horizontal lines to maintain order
  const sortedHorizontal = [...newHorizontal].sort((a, b) => a - b);

  // Update vertical line boundaries based on new horizontal line positions
  const updatedVertical = updateVerticalLineBoundaries(
    lines.vertical,
    sortedHorizontal,
    dimensions.height
  );

  return {
    horizontal: sortedHorizontal,
    vertical: updatedVertical
  };
}

export function updateSliceLinesOnVerticalDrag(
  lines: SliceLines,
  draggedIndex: number,
  newX: number
): SliceLines {
  // Create a new array with the dragged line at its new position
  const newVertical = [...lines.vertical];
  newVertical[draggedIndex] = {
    ...newVertical[draggedIndex],
    x: newX
  };

  // Sort vertical lines by x coordinate
  const sortedVertical = [...newVertical].sort((a, b) => a.x - b.x);

  return {
    horizontal: lines.horizontal,
    vertical: sortedVertical
  };
}

export function findNearestLine(
  point: Point,
  lines: SliceLines,
  threshold: number
): { type: 'horizontal' | 'vertical' | null; index: number | null } {
  let nearestDistance = Infinity;
  let nearestType: 'horizontal' | 'vertical' | null = null;
  let nearestIndex: number | null = null;

  // Check horizontal lines
  lines.horizontal.forEach((y, index) => {
    const distance = Math.abs(point.y - y);
    if (distance < nearestDistance && distance <= threshold) {
      nearestDistance = distance;
      nearestType = 'horizontal';
      nearestIndex = index;
    }
  });

  // Check vertical lines
  lines.vertical.forEach((line, index) => {
    const distance = Math.abs(point.x - line.x);
    if (distance < nearestDistance && distance <= threshold) {
      nearestDistance = distance;
      nearestType = 'vertical';
      nearestIndex = index;
    }
  });

  return { type: nearestType, index: nearestIndex };
}

export function isValidLinePosition(
  position: number,
  dimension: number,
  existingLines: number[],
  minSpacing: number = 20
): boolean {
  // Check boundary padding
  if (position < BOUNDARY_PADDING || position > dimension - BOUNDARY_PADDING) {
    console.warn('Line position too close to boundary:', {
      position,
      dimension,
      BOUNDARY_PADDING
    });
    return false;
  }

  // Check minimum spacing between lines
  const tooClose = existingLines.some(line => 
    Math.abs(line - position) < minSpacing
  );

  if (tooClose) {
    console.warn('Line position too close to existing line:', {
      position,
      existingLines,
      minSpacing
    });
    return false;
  }

  return true;
}

export function handleLineAdd(
  point: Point,
  sliceLines: SliceLines,
  dimensions: ImageDimensions,
  type: LineType
): SliceLines {
  const position = type === 'horizontal' ? point.y : point.x;
  const dimension = type === 'horizontal' ? dimensions.height : dimensions.width;
  const existingLines = type === 'horizontal' ? sliceLines.horizontal : sliceLines.vertical.map(v => v.x);

  if (!isValidLinePosition(position, dimension, existingLines)) {
    return sliceLines;
  }

  if (type === 'horizontal') {
    return {
      ...sliceLines,
      horizontal: [...sliceLines.horizontal, position].sort((a, b) => a - b)
    };
  } else {
    // Create a proper VerticalLine object
    const newVerticalLine: VerticalLine = {
      x: position,
      upperBound: 0,
      lowerBound: dimensions.height
    };
    
    return {
      ...sliceLines,
      vertical: [...sliceLines.vertical, newVerticalLine]
        .sort((a, b) => a.x - b.x)
    };
  }
} 