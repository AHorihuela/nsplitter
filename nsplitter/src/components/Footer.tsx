import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Fubo Image Slicer • Marketing Team Tool
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 