import { renderHook, act } from '@testing-library/react-hooks';
import { useMouseInteractions } from '../useMouseInteractions';
import { SliceLines, ImageDimensions } from '../../utils/types';

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

    test('should create vertical line when shift is pressed', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));

      // Press shift key
      act(() => {
        result.current.handlers.onKeyDown({ key: 'Shift' } as KeyboardEvent);
      });

      // Click to add line
      act(() => {
        result.current.handlers.onClick({
          clientX: 300,
          clientY: 150,
        } as any);
      });

      expect(mockProps.onLineAdd).toHaveBeenCalledWith(
        { x: 300, y: 150 },
        true // isShiftPressed
      );
    });
  });

  describe('Line dragging', () => {
    test('should handle drag sequence correctly', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));

      // Start drag on existing horizontal line
      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 0,
          clientY: 100, // On first horizontal line
        } as any);
      });

      // Move the line
      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 0,
          clientY: 150,
        } as any);
      });

      // Release at new position
      act(() => {
        result.current.handlers.onMouseUp({
          clientX: 0,
          clientY: 150,
        } as any);
      });

      // Verify the sequence of events
      expect(mockProps.onDragStart).toHaveBeenCalled();
      expect(mockProps.onDrag).toHaveBeenCalled();
      expect(mockProps.onDragEnd).toHaveBeenCalled();
    });

    test('should not add line when dragging', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));

      // Start dragging
      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 0,
          clientY: 100,
        } as any);
      });

      // Move significantly
      act(() => {
        result.current.handlers.onMouseMove({
          clientX: 0,
          clientY: 200,
        } as any);
      });

      // Release
      act(() => {
        result.current.handlers.onMouseUp({
          clientX: 0,
          clientY: 200,
        } as any);
      });

      // Click should not add line during drag
      act(() => {
        result.current.handlers.onClick({
          clientX: 0,
          clientY: 200,
        } as any);
      });

      expect(mockProps.onLineAdd).not.toHaveBeenCalled();
    });

    test('should clean up drag state after mouse up', () => {
      const { result } = renderHook(() => useMouseInteractions(mockProps));

      // Start drag
      act(() => {
        result.current.handlers.onMouseDown({
          clientX: 0,
          clientY: 100,
        } as any);
      });

      // End drag
      act(() => {
        result.current.handlers.onMouseUp({
          clientX: 0,
          clientY: 150,
        } as any);
      });

      expect(result.current.isDragging).toBe(false);
    });
  });
}); 