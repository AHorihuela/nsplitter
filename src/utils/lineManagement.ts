import { ImageDimensions, VerticalLine, SliceLines } from '../types/lines';

export function findContainingBoundaries(y: number, height: number, horizontalLines: number[]): { top: number, bottom: number } {
  const sortedLines = [...horizontalLines].sort((a, b) => a - b);
  let top = 0;
  let bottom = height;

  for (const line of sortedLines) {
    if (line < y) {
      top = line;
    } else if (line > y) {
      bottom = line;
      break;
    }
  }

  return { top, bottom };
}

export function updateVerticalLineBoundaries(
  verticalLines: VerticalLine[],
  horizontalLines: number[],
  dimensions: ImageDimensions
): VerticalLine[] {
  return verticalLines.map(line => {
    const { top, bottom } = findContainingBoundaries(line.x, dimensions.height, horizontalLines);
    return {
      ...line,
      topBoundary: top,
      bottomBoundary: bottom
    };
  });
}

export function updateSliceLinesOnHorizontalDrag(
  sliceLines: SliceLines,
  dragIndex: number,
  newY: number,
  dimensions: ImageDimensions
): SliceLines {
  const updatedHorizontalLines = [...sliceLines.horizontalLines];
  updatedHorizontalLines[dragIndex] = newY;

  return {
    horizontalLines: updatedHorizontalLines,
    verticalLines: updateVerticalLineBoundaries(
      sliceLines.verticalLines,
      updatedHorizontalLines,
      dimensions
    )
  };
}

export function updateSliceLinesOnVerticalDrag(
  sliceLines: SliceLines,
  dragIndex: number,
  newX: number,
  dimensions: ImageDimensions
): SliceLines {
  const updatedVerticalLines = [...sliceLines.verticalLines];
  const { top, bottom } = findContainingBoundaries(
    newX,
    dimensions.height,
    sliceLines.horizontalLines
  );

  updatedVerticalLines[dragIndex] = {
    x: newX,
    topBoundary: top,
    bottomBoundary: bottom
  };

  return {
    horizontalLines: sliceLines.horizontalLines,
    verticalLines: updatedVerticalLines
  };
} 