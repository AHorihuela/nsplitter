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
  dimensions: ImageDimensions
): SliceRegion[] {
  const horizontalBoundaries = [0, ...sliceLines.horizontal, dimensions.height].sort((a, b) => a - b);
  const verticalBoundaries = [0, ...sliceLines.vertical.map(v => v.x), dimensions.width].sort((a, b) => a - b);
  
  const regions: SliceRegion[] = [];
  
  // Generate regions in row-major order (top to bottom, left to right)
  for (let i = 0; i < horizontalBoundaries.length - 1; i++) {
    for (let j = 0; j < verticalBoundaries.length - 1; j++) {
      regions.push({
        x: verticalBoundaries[j],
        y: horizontalBoundaries[i],
        width: verticalBoundaries[j + 1] - verticalBoundaries[j],
        height: horizontalBoundaries[i + 1] - horizontalBoundaries[i]
      });
    }
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
  const regions = calculateSliceRegions(sliceLines, dimensions);
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