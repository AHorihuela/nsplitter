export interface VerticalLine {
  x: number;
  upperBound: number;
  lowerBound: number;
}

export interface SliceLines {
  horizontal: number[];  // Array of y-coordinates
  vertical: VerticalLine[];   // Array of vertical lines with boundaries
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type LineType = 'horizontal' | 'vertical'; 