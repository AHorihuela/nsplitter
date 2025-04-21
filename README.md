# Fubo Image Slicer

<div align="center">
  <img src="/public/bg.png" alt="Fubo Image Slicer" width="600" />

  <p>
    <strong>A powerful, browser-based tool for slicing images into smaller segments for marketing materials.</strong>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage">Usage</a> •
    <a href="#building-for-production">Deployment</a> •
    <a href="#technologies-used">Technologies</a>
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/Platform-Web-blue" alt="Platform: Web" />
    <img src="https://img.shields.io/badge/Built%20with-React-blue" alt="Built with: React" />
    <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License: Proprietary" />
  </p>
</div>

## Overview

Fubo Image Slicer streamlines the workflow for Fubo's marketing team by providing an intuitive web interface to upload, slice, and export images for email newsletters and other marketing materials. The application runs entirely in the browser, with no server-side processing required for the image manipulation.

## Features

- **🖼️ Effortless Image Upload**
  - Drag-and-drop functionality
  - File picker for PNG and JPEG formats
  - Support for images up to 5MB

- **✂️ Intuitive Slicing Interface**
  - Hover and click to add horizontal slice lines
  - Shift+hover and click to add vertical slice lines
  - Double-click to remove any slice line
  - Click and drag to reposition lines
  - Real-time visual preview of slices

- **🔢 Smart Slice Numbering**
  - Automatic numbering in row-major order (top-to-bottom, left-to-right)
  - Visual indicators showing the export order

- **📦 One-Click Export**
  - Generates all slices as separate images
  - Packages slices into a convenient ZIP file
  - Automatic download to your device

- **💾 Session Persistence**
  - Slice configurations are saved in browser storage
  - Preserves your work if you refresh the page

- **🔒 Basic Security**
  - Password protection to control access
  - Client-side validation for internal use

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

### Step 1: Access the Application
Enter the password specified in your `.env` file to access the tool.

### Step 2: Upload an Image
Drag and drop a PNG or JPEG file onto the upload area, or click to browse your files.

### Step 3: Create Slices
- **Horizontal Slices**: Move your cursor over the image and click to place a horizontal line
- **Vertical Slices**: Hold the Shift key, move your cursor, and click to place a vertical line
- **Remove Slices**: Double-click any line to remove it
- **Adjust Slices**: Click and drag any line to reposition it

### Step 4: Export Your Slices
Click the "Export Slices" button to generate and download a ZIP file containing all your image slices, numbered in order.

## Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

### Deployment Options

- **Static Hosting**: Deploy the `dist` directory to any static hosting service (Netlify, Vercel, GitHub Pages)
- **Docker**: Use the included Dockerfile for containerized deployment
- **Cloud Services**: Deploy to AWS S3, Google Cloud Storage, or similar services

## Technologies Used

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Image Processing**: HTML5 Canvas for client-side manipulation
- **Packaging**: JSZip for in-browser ZIP file creation
- **Styling**: TailwindCSS for responsive design
- **State Management**: React hooks and Context API
- **Storage**: Browser LocalStorage for session persistence

## Limitations

- Works best with images up to 5MB in size
- Designed for modern browsers (Chrome, Firefox, Safari, Edge)
- All processing happens client-side, so performance depends on the user's device

## License

This project is proprietary software developed exclusively for Fubo's internal use.

---

<div align="center">
  <small>Developed with ❤️ by the Fubo Engineering Team</small>
</div>
