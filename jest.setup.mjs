import { jest } from '@jest/globals';

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
  };
};

// Mock blob URL creation
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn(); 