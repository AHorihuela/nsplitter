import { SliceLines, VerticalLine, ImageDimensions } from './types';

export const findContainingBoundaries = (
  y: number,
  height: number,
  horizontalLines: number[] = []
) => {
  const allBoundaries = [0, ...horizontalLines, height].sort((a, b) => a - b);
  let upperBound = 0;
  let lowerBound = height;

  for (let i = 0; i < allBoundaries.length - 1; i++) {
    if (y >= allBoundaries[i] && y < allBoundaries[i + 1]) {
      upperBound = allBoundaries[i];
      lowerBound = allBoundaries[i + 1];
      break;
    }
  }

  return { upperBound, lowerBound };
};

export const updateVerticalLineBoundaries = (
  verticalLines: VerticalLine[],
  horizontalLines: number[],
  dimensions: ImageDimensions
): VerticalLine[] => {
  return verticalLines.map(line => {
    // Find the containing boundaries for this vertical line's current position
    const { upperBound, lowerBound } = findContainingBoundaries(
      line.x,
      dimensions.height,
      horizontalLines
    );

    // Only update the bounds if they've changed
    if (line.upperBound !== upperBound || line.lowerBound !== lowerBound) {
      return {
        ...line,
        upperBound,
        lowerBound
      };
    }

    return line;
  });
};

export const updateSliceLinesOnHorizontalDrag = (
  sliceLines: SliceLines,
  dragIndex: number,
  newY: number,
  dimensions: ImageDimensions
): SliceLines => {
  // Update horizontal lines
  const newHorizontal = [...sliceLines.horizontal];
  newHorizontal[dragIndex] = Math.max(0, Math.min(newY, dimensions.height));
  const sortedHorizontal = newHorizontal.sort((a, b) => a - b);

  // Update vertical lines with new boundaries
  const newVertical = updateVerticalLineBoundaries(
    sliceLines.vertical,
    sortedHorizontal,
    dimensions
  );

  return {
    horizontal: sortedHorizontal,
    vertical: newVertical
  };
};

export const updateSliceLinesOnVerticalDrag = (
  sliceLines: SliceLines,
  dragIndex: number,
  newX: number,
  dimensions: ImageDimensions
): SliceLines => {
  const newVertical = [...sliceLines.vertical];
  const line = newVertical[dragIndex];
  
  // Find the containing boundaries for the vertical line
  const { upperBound, lowerBound } = findContainingBoundaries(
    line.x,
    dimensions.height,
    sliceLines.horizontal
  );

  newVertical[dragIndex] = {
    ...line,
    x: Math.max(0, Math.min(newX, dimensions.width)),
    upperBound,
    lowerBound
  };

  return {
    ...sliceLines,
    vertical: newVertical.sort((a, b) => a.x - b.x)
  };
}; 