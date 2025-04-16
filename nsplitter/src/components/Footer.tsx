import { ReactNode } from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 p-4 mt-8">
      <div className="container mx-auto text-center text-gray-600">
        © {new Date().getFullYear()} Fubo Image Slicer
      </div>
    </footer>
  );
};

export default Footer; 