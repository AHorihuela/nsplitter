# Fubo Image Slicer

A web application that enables Fubo's marketing team to easily slice images for newsletters and other marketing materials.

## Overview

Fubo Image Slicer is a client-side web application that helps streamline the workflow of creating sliced images for email newsletters. It provides an intuitive interface for uploading images, adding horizontal and vertical slice lines, and exporting the resulting sub-images as a ZIP file.

## Features

- **Image Upload**: Drag-and-drop or file picker for PNG and JPEG images
- **Intuitive Slicing**: 
  - Hover and click to add horizontal slice lines
  - Shift+hover and click to add vertical slice lines
  - Double-click to remove lines
  - Drag to reposition lines
- **Visual Numbering**: Each slice is numbered in real-time showing the export order
- **Export Functionality**: Export all slices as a ZIP file with numbered images
- **Session Persistence**: Slice lines are saved to browser storage for the current session
- **Basic Security**: Simple password protection to control access

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/ahorihuela/nsplitter.git
cd nsplitter
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Create a `.env` file in the root directory and add:
```
VITE_APP_PASSWORD=yourpassword
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Login**: Enter the password specified in your `.env` file
2. **Upload an Image**: Drag and drop or click to select a PNG or JPEG file
3. **Add Slice Lines**:
   - Move your cursor over the image to see a horizontal guide line
   - Click to add a horizontal slice line
   - Hold Shift and move your cursor to see a vertical guide line
   - Click while holding Shift to add a vertical slice line
4. **Adjust Lines**:
   - Drag any line to reposition it
   - Double-click a line to remove it
5. **Export**: Click the "Export Slices" button to download a ZIP file containing all slices
   - Slices are numbered in row-major order (top-to-bottom, left-to-right)

## Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Technologies Used

- React with TypeScript
- Vite for fast development and optimized builds
- HTML5 Canvas for image manipulation
- JSZip for client-side ZIP file creation
- TailwindCSS for styling
- LocalStorage for session persistence

## Limitations

- Works best with images up to 5MB in size
- Designed for modern browsers (Chrome, Firefox, Safari, Edge)
- All processing happens client-side, so performance depends on the user's device

## License

This project is proprietary software for Fubo's internal use.
