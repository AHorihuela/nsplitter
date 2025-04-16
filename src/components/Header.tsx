import React from 'react';
import { CanvasControls } from './CanvasControls';

interface HeaderProps {
  onUploadNewClick?: () => void;
  showUploadButton?: boolean;
  // Canvas control props
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  onExport?: () => void;
  isProcessing?: boolean;
  showExport?: boolean;
  showControls?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onUploadNewClick, 
  showUploadButton,
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  onClear = () => {},
  onExport = () => {},
  isProcessing = false,
  showExport = false,
  showControls = false
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm py-2">
      <div className="max-w-[98vw] mx-auto px-2 sm:px-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-gray-900">
              Fubo Image Slicer
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {showControls && (
              <div className="flex items-center gap-2">
                <CanvasControls
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={onUndo}
                  onRedo={onRedo}
                  onClear={onClear}
                  onExport={onExport}
                  isProcessing={isProcessing}
                  showExport={showExport}
                />
              </div>
            )}
            
            {showUploadButton && (
              <button
                onClick={onUploadNewClick}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Upload New Image
              </button>
            )}
            
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 