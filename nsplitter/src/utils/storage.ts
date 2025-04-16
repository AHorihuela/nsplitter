import { SliceLines, VerticalLine } from './types';

const LINES_STORAGE_KEY = 'nsplitter_lines';
const IMAGE_STORAGE_KEY = 'nsplitter_image';

export const saveLinesToStorage = (lines: SliceLines): void => {
  try {
    sessionStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.error('Failed to save lines to session storage:', error);
  }
};

export const getLinesFromStorage = (): SliceLines | null => {
  try {
    const stored = sessionStorage.getItem(LINES_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Ensure the parsed data matches our type structure
    if (typeof parsed === 'object' && 
        Array.isArray(parsed.horizontal) && 
        Array.isArray(parsed.vertical) &&
        parsed.vertical.every((v: unknown) => 
          typeof v === 'object' && 
          v !== null &&
          'x' in v &&
          'upperBound' in v &&
          'lowerBound' in v &&
          typeof (v as VerticalLine).x === 'number' && 
          typeof (v as VerticalLine).upperBound === 'number' && 
          typeof (v as VerticalLine).lowerBound === 'number'
        )) {
      return parsed as SliceLines;
    }
    return null;
  } catch (error) {
    console.error('Failed to get lines from session storage:', error);
    return null;
  }
};

export const saveImageToStorage = async (file: File): Promise<void> => {
  try {
    // Convert File to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    
    const base64Data = await base64Promise;
    sessionStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify({
      data: base64Data,
      name: file.name,
      type: file.type
    }));
  } catch (error) {
    console.error('Failed to save image to session storage:', error);
  }
};

export const getImageFromStorage = async (): Promise<File | null> => {
  try {
    const stored = sessionStorage.getItem(IMAGE_STORAGE_KEY);
    if (!stored) return null;
    
    const { data, name, type } = JSON.parse(stored);
    
    // Convert base64 back to File
    const response = await fetch(data);
    const blob = await response.blob();
    return new File([blob], name, { type });
  } catch (error) {
    console.error('Failed to get image from session storage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    sessionStorage.removeItem(LINES_STORAGE_KEY);
    sessionStorage.removeItem(IMAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}; 