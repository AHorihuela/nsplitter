import { renderHook, act } from '@testing-library/react-hooks';
import { useMouseInteractions } from '../useMouseInteractions';
import { SliceLines, ImageDimensions } from '../../utils/types';

// Mock the implementation of preventDefault
const mockPreventDefault = jest.fn();

// Mock MouseEvent for testing
class MockMouseEvent {
  clientX: number;
  clientY: number;
  preventDefault: jest.Mock;

  constructor(x: number, y: number) {
    this.clientX = x;
    this.clientY = y;
    this.preventDefault = mockPreventDefault;
  }
}

describe('useMouseInteractions', () => {
  // Mock canvas element
  const mockCanvas = document.createElement('canvas');
  mockCanvas.width = 800;
  mockCanvas.height = 600;
  const mockGetBoundingClientRect = jest.fn(() => ({
    width: 800,
    height: 600,
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect));
  mockCanvas.getBoundingClientRect = mockGetBoundingClientRect;

  const mockCanvasRef = {
    current: mockCanvas,
  };

  const mockDimensions: ImageDimensions = {
    width: 800,
    height: 600,
  };

  const mockLines: SliceLines = {
    horizontal: [100, 200],
    vertical: [
      { x: 100, upperBound: 0, lowerBound: 600 },
      { x: 200, upperBound: 0, lowerBound: 600 },
    ],
  };

  const mockProps = {
    canvasRef: mockCanvasRef,
    canvasDimensions: mockDimensions,
    lines: mockLines,
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onDrag: jest.fn(),
    onLineAdd: jest.fn(),
    onLineRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Shift key handling', () => {
    test('should track shift key state', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));

      // Initially shift is not pressed
      expect(result.current.isShiftPressed).toBe(false);

      // Press shift key
      act(() => {
        result.current.handlers.onKeyDown({ key: 'Shift' } as KeyboardEvent);
      });
      expect(result.current.isShiftPressed).toBe(true);

      // Release shift key
      act(() => {
        result.current.handlers.onKeyUp({ key: 'Shift' } as KeyboardEvent);
      });
      expect(result.current.isShiftPressed).toBe(false);
    });
  });

  describe('Basic hook behavior', () => {
    test('should return expected properties and handlers', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));
      
      // Check returned properties
      expect(result.current.isShiftPressed).toBeDefined();
      expect(result.current.isDragging).toBeDefined();
      expect(result.current.hoveredLine).toBeDefined();
      expect(result.current.hoverLine).toBeDefined();
      
      // Check handlers
      expect(result.current.handlers.onMouseMove).toBeDefined();
      expect(result.current.handlers.onMouseDown).toBeDefined();
      expect(result.current.handlers.onMouseUp).toBeDefined();
      expect(result.current.handlers.onMouseLeave).toBeDefined();
      expect(result.current.handlers.onClick).toBeDefined();
      expect(result.current.handlers.onDoubleClick).toBeDefined();
      expect(result.current.handlers.onKeyDown).toBeDefined();
      expect(result.current.handlers.onKeyUp).toBeDefined();
    });
    
    test('should handle mouse leave', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));
      
      // Initially hoveredLine and hoverLine should be null
      expect(result.current.hoveredLine).toBeNull();
      expect(result.current.hoverLine).toBeNull();
      
      // Call mouseLeave handler
      act(() => {
        result.current.handlers.onMouseLeave();
      });
      
      // Should still be null after mouseLeave
      expect(result.current.hoveredLine).toBeNull();
      expect(result.current.hoverLine).toBeNull();
    });
  });
}); 