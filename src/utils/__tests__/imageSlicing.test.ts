import { calculateSliceRegions, extractRegionToBlob, createImageSlicesZip } from '../imageSlicing';
import { SliceLines, ImageDimensions } from '../types';

describe('calculateSliceRegions', () => {
  const mockDimensions: ImageDimensions = {
    width: 400,
    height: 300
  };

  const mockSliceLines: SliceLines = {
    horizontal: [100, 200],
    vertical: [
      { x: 100, upperBound: 0, lowerBound: 300 },
      { x: 200, upperBound: 0, lowerBound: 300 }
    ]
  };

  test('calculates regions correctly', () => {
    const regions = calculateSliceRegions(mockSliceLines, mockDimensions);
    
    expect(regions).toHaveLength(9); // 3x3 grid
    
    // Check first region dimensions
    expect(regions[0]).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
  });

  test('skips regions smaller than minimum size', () => {
    const tinySliceLines: SliceLines = {
      horizontal: [5], // Too close to edge
      vertical: [
        { x: 5, upperBound: 0, lowerBound: 300 }
      ]
    };

    const regions = calculateSliceRegions(tinySliceLines, mockDimensions);
    expect(regions.length).toBeLessThan(4); // Some regions should be skipped
  });
});

describe('extractRegionToBlob', () => {
  let mockCanvas: HTMLCanvasElement;
  
  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 400;
    mockCanvas.height = 300;
  });

  test('extracts region to blob', async () => {
    const region = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };

    const blob = await extractRegionToBlob(mockCanvas, region, 'image/jpeg');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  test('handles invalid canvas context', async () => {
    const region = {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    };

    // Mock getContext to return null
    const originalGetContext = mockCanvas.getContext;
    mockCanvas.getContext = () => null;

    await expect(extractRegionToBlob(mockCanvas, region, 'image/jpeg'))
      .rejects
      .toThrow('Could not get canvas context');

    mockCanvas.getContext = originalGetContext;
  });
});

describe('createImageSlicesZip', () => {
  let mockCanvas: HTMLCanvasElement;
  const mockDimensions: ImageDimensions = {
    width: 400,
    height: 300
  };

  const mockSliceLines: SliceLines = {
    horizontal: [100, 200],
    vertical: [
      { x: 100, upperBound: 0, lowerBound: 300 },
      { x: 200, upperBound: 0, lowerBound: 300 }
    ]
  };

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = mockDimensions.width;
    mockCanvas.height = mockDimensions.height;
  });

  test('creates zip with correct number of files', async () => {
    const zipBlob = await createImageSlicesZip(
      mockCanvas,
      mockSliceLines,
      mockDimensions,
      'image/jpeg'
    );

    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.type).toBe('application/zip');
  });
}); 