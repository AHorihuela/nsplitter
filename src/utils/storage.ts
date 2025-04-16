import { SliceLines } from './types';

const IMAGE_LINES_STORAGE_KEY = 'nsplitter_image_lines';
const CURRENT_IMAGE_KEY = 'nsplitter_current_image';
const IMAGE_STORAGE_KEY = 'nsplitter_image';

// Generate a unique hash for an image based on its name, size, and last modified date
const generateImageHash = async (file: File): Promise<string> => {
  try {
    // Use a combination of filename, size, and last modified to create a fairly unique identifier
    const hashInput = `${file.name}-${file.size}-${file.lastModified}`;
    
    // If crypto API is available, use it for a more unique hash
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(hashInput);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback to simple string-based hash
    return hashInput;
  } catch (error) {
    console.error('Failed to generate image hash:', error);
    // Fallback to a less reliable but still usable identifier
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
};

// Save the current image hash to storage
export const saveCurrentImageHash = (hash: string): void => {
  try {
    localStorage.setItem(CURRENT_IMAGE_KEY, hash);
  } catch (error) {
    console.error('Failed to save current image hash:', error);
  }
};

// Get the current image hash from storage
export const getCurrentImageHash = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_IMAGE_KEY);
  } catch (error) {
    console.error('Failed to get current image hash:', error);
    return null;
  }
};

// Save lines associated with a specific image
export const saveLinesToStorage = (lines: SliceLines, imageHash: string): void => {
  try {
    // Get existing image-lines mappings or initialize a new one
    const storedData = localStorage.getItem(IMAGE_LINES_STORAGE_KEY);
    const imageLines = storedData ? JSON.parse(storedData) : {};
    
    // Update or add the lines for this specific image
    imageLines[imageHash] = lines;
    
    // Save the updated mappings
    localStorage.setItem(IMAGE_LINES_STORAGE_KEY, JSON.stringify(imageLines));
    console.log(`Saved lines for image ${imageHash}:`, lines);
  } catch (error) {
    console.error('Failed to save lines to local storage:', error);
  }
};

// Get lines associated with a specific image
export const getLinesFromStorage = (imageHash: string): SliceLines | null => {
  try {
    const storedData = localStorage.getItem(IMAGE_LINES_STORAGE_KEY);
    if (!storedData) {
      console.log('No stored line data found in localStorage');
      return null;
    }
    
    const imageLines = JSON.parse(storedData);
    console.log('All stored image lines:', imageLines);
    
    const lines = imageLines[imageHash];
    
    if (!lines) {
      console.log(`No lines found for image hash: ${imageHash}`);
      return null;
    }
    
    console.log(`Retrieved lines for image ${imageHash}:`, lines);
    
    // Validate the structure of the retrieved lines
    if (typeof lines === 'object' && 
        Array.isArray(lines.horizontal) && 
        Array.isArray(lines.vertical) &&
        lines.vertical.every((v: any) => 
          typeof v === 'object' && 
          typeof v.x === 'number' && 
          typeof v.upperBound === 'number' && 
          typeof v.lowerBound === 'number'
        )) {
      return lines as SliceLines;
    }
    console.log(`Invalid line structure for image ${imageHash}`);
    return null;
  } catch (error) {
    console.error('Failed to get lines from local storage:', error);
    return null;
  }
};

export const saveImageToStorage = async (file: File): Promise<string> => {
  try {
    // Generate a hash for the image
    const imageHash = await generateImageHash(file);
    
    // Convert File to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    
    const base64Data = await base64Promise;
    
    // Save the current image info
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify({
      data: base64Data,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      hash: imageHash
    }));
    
    // Update the current image hash
    saveCurrentImageHash(imageHash);
    
    return imageHash;
  } catch (error) {
    console.error('Failed to save image to local storage:', error);
    return '';
  }
};

export const getImageFromStorage = async (): Promise<{file: File, hash: string} | null> => {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (!stored) return null;
    
    const { data, name, type, size, lastModified, hash } = JSON.parse(stored);
    
    // Convert base64 back to File
    const response = await fetch(data);
    const blob = await response.blob();
    const file = new File([blob], name, { type });
    
    // Save as current image hash
    saveCurrentImageHash(hash);
    
    return { file, hash };
  } catch (error) {
    console.error('Failed to get image from local storage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(IMAGE_LINES_STORAGE_KEY);
    localStorage.removeItem(CURRENT_IMAGE_KEY);
    localStorage.removeItem(IMAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}; 