import React from 'react';

interface HeaderProps {
  onUploadNewClick?: () => void;
  showUploadButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onUploadNewClick, showUploadButton }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[98vw] mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-gray-900">
              Fubo Image Slicer
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {showUploadButton && (
              <button
                onClick={onUploadNewClick}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Upload New Image
              </button>
            )}
            <span className="text-sm text-gray-500">
              Marketing Team Tool
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 