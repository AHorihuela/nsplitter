import JSZip from 'jszip';
import { SliceLines, ImageDimensions } from './types';

interface SliceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate slice regions based on horizontal and vertical lines
 */
export function calculateSliceRegions(
  sliceLines: SliceLines,
  dimensions: ImageDimensions,
  enableLogging: boolean = false
): SliceRegion[] {
  // Minimum region size (1% of the smaller dimension)
  const minRegionSize = Math.max(10, Math.min(dimensions.width, dimensions.height) * 0.01);
  
  if (enableLogging) {
    console.log('Image Slicing: Starting calculation with:', {
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      horizontalLines: sliceLines.horizontal.length,
      verticalLines: sliceLines.vertical.length
    });
  }
  
  // Get horizontal boundaries
  const horizontalBoundaries = [0, ...sliceLines.horizontal, dimensions.height].sort((a, b) => a - b);
  
  // Get vertical boundaries
  const verticalBoundaries = [0, ...sliceLines.vertical.map(v => v.x), dimensions.width].sort((a, b) => a - b);
  
  if (enableLogging) {
    console.log('Image Slicing: Boundaries calculated:', {
      horizontalBoundaries,
      numVerticalLines: sliceLines.vertical.length,
      verticalLinesWithBounds: sliceLines.vertical.map(v => ({ x: v.x, upper: v.upperBound, lower: v.lowerBound }))
    });
  }
  
  const regions: SliceRegion[] = [];
  
  // Calculate cell boundaries by iterating through horizontal segments
  for (let i = 0; i < horizontalBoundaries.length - 1; i++) {
    const yTop = horizontalBoundaries[i];
    const yBottom = horizontalBoundaries[i + 1];
    const height = yBottom - yTop;
    
    if (height < minRegionSize) {
      if (enableLogging) {
        console.log(`Image Slicing: Skipping horizontal segment (${yTop} to ${yBottom}) - too small`);
      }
      continue;
    }
    
    // Find all vertical lines that intersect with this horizontal segment
    const relevantVerticalLines = sliceLines.vertical
      .filter(vLine => {
        // Check if vertical line intersects with this horizontal segment
        const intersects = (vLine.upperBound <= yTop && vLine.lowerBound >= yBottom) || 
                (vLine.upperBound >= yTop && vLine.upperBound < yBottom) ||
                (vLine.lowerBound > yTop && vLine.lowerBound <= yBottom);
        
        return intersects;
      })
      .map(vLine => vLine.x)
      .sort((a, b) => a - b);
    
    if (enableLogging) {
      console.log(`Image Slicing: For segment y=${yTop} to ${yBottom}, found ${relevantVerticalLines.length} intersecting vertical lines`);
    }
    
    // Create a set of vertical boundaries for this horizontal segment
    const segmentVerticalBoundaries = [0, ...relevantVerticalLines, dimensions.width].sort((a, b) => a - b);
    
    // For each pair of vertical boundaries, create a region
    for (let j = 0; j < segmentVerticalBoundaries.length - 1; j++) {
      const xLeft = segmentVerticalBoundaries[j];
      const xRight = segmentVerticalBoundaries[j + 1];
      const width = xRight - xLeft;
      
      if (width < minRegionSize) {
        if (enableLogging) {
          console.log(`Image Slicing: Skipping region at (${xLeft},${yTop}) with size ${width}x${height} - too small`);
        }
        continue;
      }
      
      regions.push({
        x: xLeft,
        y: yTop,
        width,
        height
      });
    }
  }
  
  if (enableLogging) {
    console.log(`Image Slicing: Generated ${regions.length} regions:`, regions);
  }
  return regions;
}

/**
 * Extract a region from the canvas and convert it to a blob
 */
export async function extractRegionToBlob(
  canvas: HTMLCanvasElement,
  region: SliceRegion,
  fileType: string
): Promise<Blob> {
  // Create a temporary canvas for the slice
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = region.width;
  tempCanvas.height = region.height;
  
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Draw the region to the temporary canvas
  ctx.drawImage(
    canvas,
    region.x, region.y, region.width, region.height,  // Source rectangle
    0, 0, region.width, region.height                 // Destination rectangle
  );
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    tempCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      fileType
    );
  });
}

/**
 * Process the image and create a ZIP file containing all slices
 */
export async function createImageSlicesZip(
  canvas: HTMLCanvasElement,
  sliceLines: SliceLines,
  dimensions: ImageDimensions,
  fileType: string = 'image/jpeg'
): Promise<Blob> {
  // When exporting, we want to enable logging
  const regions = calculateSliceRegions(sliceLines, dimensions, true);
  const zip = new JSZip();
  
  // Process each region and add to zip
  const slicePromises = regions.map(async (region, index) => {
    const blob = await extractRegionToBlob(canvas, region, fileType);
    const extension = fileType === 'image/png' ? 'png' : 'jpg';
    zip.file(`${index + 1}.${extension}`, blob);
  });
  
  // Wait for all slices to be processed
  await Promise.all(slicePromises);
  
  // Generate the zip file
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Trigger download of the ZIP file
 */
export function downloadZip(zipBlob: Blob, filename: string = 'image-slices.zip'): void {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 