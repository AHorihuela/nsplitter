import { isValidLinePosition, handleLineAdd } from '../lineManagement';
import { SliceLines, ImageDimensions } from '../types';
import { BOUNDARY_PADDING } from '../lineManagement';

describe('isValidLinePosition', () => {
  const dimension = 400;
  const existingLines = [100, 200, 300];

  test('rejects positions too close to boundaries', () => {
    expect(isValidLinePosition(5, dimension, existingLines)).toBe(false);
    expect(isValidLinePosition(395, dimension, existingLines)).toBe(false);
  });

  test('rejects positions too close to existing lines', () => {
    expect(isValidLinePosition(102, dimension, existingLines)).toBe(false);
    expect(isValidLinePosition(198, dimension, existingLines)).toBe(false);
  });

  test('accepts valid positions', () => {
    expect(isValidLinePosition(150, dimension, existingLines)).toBe(true);
    expect(isValidLinePosition(250, dimension, existingLines)).toBe(true);
  });

  test('respects boundary padding', () => {
    expect(isValidLinePosition(BOUNDARY_PADDING + 1, dimension, existingLines)).toBe(true);
    expect(isValidLinePosition(dimension - BOUNDARY_PADDING - 1, dimension, existingLines)).toBe(true);
  });
});

describe('handleLineAdd', () => {
  const dimensions: ImageDimensions = {
    width: 400,
    height: 300
  };

  const initialSliceLines: SliceLines = {
    horizontal: [100],
    vertical: [
      { x: 100, upperBound: 0, lowerBound: 300 }
    ]
  };

  test('adds valid horizontal line', () => {
    const point = { x: 200, y: 200 };
    const result = handleLineAdd(point, initialSliceLines, dimensions, 'horizontal');

    expect(result.horizontal).toContain(200);
    expect(result.horizontal).toHaveLength(2);
    expect(result.vertical).toEqual(initialSliceLines.vertical);
  });

  test('adds valid vertical line', () => {
    const point = { x: 200, y: 150 };
    const result = handleLineAdd(point, initialSliceLines, dimensions, 'vertical');

    expect(result.vertical).toHaveLength(2);
    expect(result.vertical[1].x).toBe(200);
    expect(result.horizontal).toEqual(initialSliceLines.horizontal);
  });

  test('maintains sorted order when adding lines', () => {
    const point1 = { x: 300, y: 150 };
    const point2 = { x: 200, y: 150 };
    
    let lines = handleLineAdd(point1, initialSliceLines, dimensions, 'vertical');
    lines = handleLineAdd(point2, lines, dimensions, 'vertical');

    expect(lines.vertical.map(v => v.x)).toEqual([100, 200, 300]);
  });

  test('rejects invalid line positions', () => {
    const invalidPoint = { x: 5, y: 5 }; // Too close to boundary
    const result = handleLineAdd(invalidPoint, initialSliceLines, dimensions, 'horizontal');

    expect(result).toEqual(initialSliceLines);
  });
}); 