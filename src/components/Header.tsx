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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm py-3">
      <div className="max-w-[98vw] mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Fubo Image Slicer
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {showControls && (
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
            )}
            
            {showUploadButton && (
              <button
                onClick={onUploadNewClick}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  className="w-4 h-4 mr-1"
                >
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
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