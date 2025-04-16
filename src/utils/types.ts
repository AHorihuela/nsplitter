export interface Point {
  x: number;
  y: number;
}

export interface VerticalLine {
  x: number;
  upperBound: number;
  lowerBound: number;
}

export interface SliceLines {
  horizontal: number[];
  vertical: VerticalLine[];
}

export interface ImageDimensions {
  width: number;
  height: number;
} 