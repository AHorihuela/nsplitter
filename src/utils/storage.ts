import { SliceLines } from './types';

const LINES_STORAGE_KEY = 'nsplitter_lines';
const IMAGE_STORAGE_KEY = 'nsplitter_image';

export const saveLinesToStorage = (lines: SliceLines): void => {
  try {
    localStorage.setItem(LINES_STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.error('Failed to save lines to local storage:', error);
  }
};

export const getLinesFromStorage = (): SliceLines | null => {
  try {
    const stored = localStorage.getItem(LINES_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Ensure the parsed data matches our type structure
    if (typeof parsed === 'object' && 
        Array.isArray(parsed.horizontal) && 
        Array.isArray(parsed.vertical) &&
        parsed.vertical.every((v: any) => 
          typeof v === 'object' && 
          typeof v.x === 'number' && 
          typeof v.upperBound === 'number' && 
          typeof v.lowerBound === 'number'
        )) {
      return parsed as SliceLines;
    }
    return null;
  } catch (error) {
    console.error('Failed to get lines from local storage:', error);
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
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify({
      data: base64Data,
      name: file.name,
      type: file.type
    }));
  } catch (error) {
    console.error('Failed to save image to local storage:', error);
  }
};

export const getImageFromStorage = async (): Promise<File | null> => {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (!stored) return null;
    
    const { data, name, type } = JSON.parse(stored);
    
    // Convert base64 back to File
    const response = await fetch(data);
    const blob = await response.blob();
    return new File([blob], name, { type });
  } catch (error) {
    console.error('Failed to get image from local storage:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(LINES_STORAGE_KEY);
    localStorage.removeItem(IMAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}; 