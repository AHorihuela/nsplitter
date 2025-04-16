import React from 'react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[98vw] mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-gray-900">
              Fubo Image Slicer
            </h1>
          </div>
          <div className="flex items-center">
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