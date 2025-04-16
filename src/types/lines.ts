export interface ImageDimensions {
  width: number;
  height: number;
}

export interface VerticalLine {
  x: number;
  topBoundary: number;
  bottomBoundary: number;
}

export interface SliceLines {
  horizontalLines: number[];
  verticalLines: VerticalLine[];
} 