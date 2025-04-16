import React, { useEffect, useRef } from 'react';

interface ImageCanvasProps {
  imageFile: File | null;
  onLoad?: (dimensions: { width: number; height: number }) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageFile, onLoad }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageFile || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Calculate dimensions to fit the viewport while maintaining aspect ratio
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.6;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth * height) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (maxHeight * width) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Clear canvas and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Notify parent component of dimensions
      onLoad?.({ width, height });

      // Clean up object URL
      URL.revokeObjectURL(img.src);
    };

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile, onLoad]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full border border-gray-200 rounded-lg shadow-sm"
    />
  );
};

export default ImageCanvas; 