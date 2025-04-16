import { ImageDimensions, VerticalLine, SliceLines } from './types';

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

export interface Point {
  x: number;
  y: number;
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