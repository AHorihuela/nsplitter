require('@testing-library/jest-dom');

// Mock JSZip
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => {
    return {
      file: jest.fn(),
      generateAsync: jest.fn().mockResolvedValue(
        new Blob(['mock zip content'], { type: 'application/zip' })
      )
    };
  });
});

// Mock canvas functionality
HTMLCanvasElement.prototype.getContext = function() {
  return {
    drawImage: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawFocusIfNeeded: jest.fn(),
    createPattern: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    addHitRegion: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    beginPath: jest.fn(),
    bezierCurveTo: jest.fn(),
    clearHitRegions: jest.fn(),
    clearRect: jest.fn(),
    clip: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    lineTo: jest.fn(),
    moveTo: jest.fn(),
    stroke: jest.fn(),
    strokeRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setLineDash: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    textAlign: '',
    textBaseline: '',
    font: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0
  };
};

// Mock HTMLCanvasElement toBlob method
HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
  const blob = new Blob(['mock blob data'], { type: type || 'image/jpeg' });
  callback(blob);
};

// Mock blob URL creation
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

// Extend expect matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
}); 