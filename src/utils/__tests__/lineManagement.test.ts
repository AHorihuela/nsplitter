import { findContainingBoundaries, updateVerticalLineBoundaries, updateSliceLinesOnHorizontalDrag, updateSliceLinesOnVerticalDrag, findNearestLine } from '../lineManagement';
import { SliceLines, ImageDimensions, Line, LineType, VerticalLine, Point } from '../types';

describe('findContainingBoundaries', () => {
  const height = 100;

  test('finds boundaries with no horizontal lines', () => {
    const result = findContainingBoundaries(50, height);
    expect(result).toEqual({ upperBound: 0, lowerBound: 100 });
  });

  test('finds boundaries with horizontal lines', () => {
    const horizontalLines = [25, 75];
    const result = findContainingBoundaries(50, height, horizontalLines);
    expect(result).toEqual({ upperBound: 25, lowerBound: 75 });
  });

  test('handles point exactly on a line', () => {
    const horizontalLines = [25, 75];
    const result = findContainingBoundaries(25, height, horizontalLines);
    expect(result).toEqual({ upperBound: 0, lowerBound: 25 });
  });
});

describe('updateVerticalLineBoundaries', () => {
  const dimensions: ImageDimensions = { width: 100, height: 100 };
  const horizontalLines = [25, 75];

  test('updates vertical line boundaries correctly', () => {
    const verticalLines = [
      { x: 30, upperBound: 0, lowerBound: 100 },
      { x: 60, upperBound: 0, lowerBound: 100 }
    ];

    const result = updateVerticalLineBoundaries(verticalLines, horizontalLines, dimensions);
    
    expect(result).toEqual([
      { x: 30, upperBound: 25, lowerBound: 75 },
      { x: 60, upperBound: 25, lowerBound: 75 }
    ]);
  });

  test('maintains existing boundaries if they are correct', () => {
    const verticalLines = [
      { x: 30, upperBound: 25, lowerBound: 75 },
      { x: 60, upperBound: 25, lowerBound: 75 }
    ];

    const result = updateVerticalLineBoundaries(verticalLines, horizontalLines, dimensions);
    
    expect(result).toEqual(verticalLines);
  });
});

describe('updateSliceLinesOnHorizontalDrag', () => {
  const dimensions: ImageDimensions = { width: 100, height: 100 };
  const initialState: SliceLines = {
    horizontal: [25, 75],
    vertical: [
      { x: 30, upperBound: 0, lowerBound: 25 },
      { x: 60, upperBound: 25, lowerBound: 75 }
    ]
  };

  test('updates horizontal line position and vertical boundaries', () => {
    const result = updateSliceLinesOnHorizontalDrag(initialState, 0, 50, dimensions);
    
    expect(result.horizontal).toEqual([50, 75]);
    expect(result.vertical[0].upperBound).toBe(0);
    expect(result.vertical[0].lowerBound).toBe(50);
  });

  test('maintains order of horizontal lines', () => {
    const result = updateSliceLinesOnHorizontalDrag(initialState, 0, 80, dimensions);
    
    expect(result.horizontal).toEqual([75, 80]);
  });
});

describe('updateSliceLinesOnVerticalDrag', () => {
  const dimensions: ImageDimensions = { width: 100, height: 100 };
  const initialState: SliceLines = {
    horizontal: [25, 75],
    vertical: [
      { x: 30, upperBound: 0, lowerBound: 25 },
      { x: 60, upperBound: 25, lowerBound: 75 }
    ]
  };

  test('updates vertical line position while maintaining boundaries', () => {
    const result = updateSliceLinesOnVerticalDrag(initialState, 0, 45, dimensions);
    
    expect(result.vertical[0].x).toBe(45);
    expect(result.vertical[0].upperBound).toBe(0);
    expect(result.vertical[0].lowerBound).toBe(25);
  });

  test('maintains order of vertical lines', () => {
    const result = updateSliceLinesOnVerticalDrag(initialState, 1, 20, dimensions);
    
    expect(result.vertical[0].x).toBe(20);
    expect(result.vertical[1].x).toBe(30);
  });
});

describe('findNearestLine', () => {
  const mockSliceLines: SliceLines = {
    horizontal: [100, 200, 300],
    vertical: [
      { x: 100, upperBound: 0, lowerBound: 400 },
      { x: 200, upperBound: 0, lowerBound: 400 },
      { x: 300, upperBound: 0, lowerBound: 400 }
    ]
  };

  it('should find nearest horizontal line within threshold', () => {
    const point: Point = { x: 150, y: 198 };
    const result = findNearestLine(point, mockSliceLines, 'horizontal', 5);
    expect(result).toBe(200);
  });

  it('should find nearest vertical line within threshold', () => {
    const point: Point = { x: 198, y: 150 };
    const result = findNearestLine(point, mockSliceLines, 'vertical', 5);
    expect(result).toBe(200);
  });

  it('should return null when no line is within threshold', () => {
    const point: Point = { x: 150, y: 180 };
    const result = findNearestLine(point, mockSliceLines, 'horizontal', 5);
    expect(result).toBeNull();
  });
}); 