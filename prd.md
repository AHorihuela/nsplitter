# **Fubo Image Slicer – Product Requirements Document**

## **1. Overview**

### **1.1. Project Title**

Fubo Image Slicer

### **1.2. Summary**

This project aims to streamline the workflow for Fubo’s marketing team by providing an internal web-based tool to cut/slice uploaded PNG or JPEG images into smaller sub-images. The tool must be simple, fast, and purely client-side, with basic password protection.

### **1.3. Goals**

- **Reduce manual effort**: Automate repetitive slicing and exporting of images for newsletters.  
- **Improve speed and ease of use**: Provide an intuitive UI to define and adjust slicing boundaries quickly.  
- **Minimize overhead**: Everything should run client-side with minimal server requirements.

---

## **2. Problem Statement**

Fubo’s marketing team currently slices images manually (e.g., using Photoshop or other tools) to generate pieces for email newsletters. This manual process is time-consuming and error-prone. A dedicated web tool that allows for intuitive image uploading, slicing (both horizontally and vertically), and exporting is needed to reduce effort and errors.

---

## **3. Key Features & Requirements**

### **3.1. Image Upload**

- **File Formats**: PNG and JPEG only.  
- **Upload Methods**:  
  - Drag and drop directly into the browser.  
  - Click button to open a local file dialog.

### **3.2. Slicing Interactions**

1. **Hover & Click for Horizontal Split**  
   - Hovering over the image displays a horizontal guideline that moves with the cursor.  
   - Clicking places a horizontal slice line.  

2. **Shift + Hover & Click for Vertical Split**  
   - When the user holds Shift, the guideline orients vertically.  
   - Clicking places a vertical slice line.  

3. **Removing Lines (Double-Click)**  
   - Double-clicking an existing guideline removes it.  
   - When removed, sub-images adjust so the lines still span from one boundary to the next.

4. **Dragging Lines**  
   - Any existing horizontal or vertical line can be clicked and dragged to a new position.  
   - Adjacent lines or boundaries update accordingly so that the sub-images always have closed boundaries.

### **3.3. Image Preview & Hover States**

- **Hover State**: While hovering, a semi-translucent line (horizontal or vertical) indicates where the new slice boundary would be.  
- **No “Ghost Grid”**: The final sub-image boundaries do not need a special overlay while adjusting. Only the hover line is shown.

### **3.4. Output Generation**

1. **Naming and Numbering**  
   - Final sub-images are numbered from top-to-bottom, left-to-right (row-major order).  
   - For example, the top-left piece is “1.jpg” (or “1.png”), the top-right piece is “2.jpg,” etc.  

2. **Export to ZIP**  
   - A “Process” button is displayed at all times. Clicking it:  
     1. Slices the image on the client.  
     2. Bundles sub-images into a ZIP file.  
     3. Initiates download in the browser.  
   - No server-side involvement in image generation; use a JavaScript library (e.g., JSZip) for packaging.

### **3.5. Browser Caching of Split State**

- **Session Persistence**: If the user refreshes the page or navigates away and back:  
  - The existing splits for the currently uploaded image persist in the browser’s local storage/session storage.  
  - Once the user closes the browser entirely or resets the page, the data may be lost.  
- **No Permanent Server Storage**: The image itself and slicing data are not stored on the server.

### **3.6. Basic Password Protection**

- A simple password gate:  
  - On first visit (or if not stored locally), user is prompted for a password.  
  - The password can be stored in an environment variable on the server or a config file.  
  - If correct, store a flag (e.g., in localStorage) so the user isn’t re-prompted.

---

## **4. User Flow**

1. **Navigate to Tool**  
   - User opens the URL.  
   - Prompted for password if not already stored.  

2. **Upload Image**  
   - User either drags a PNG/JPEG file or clicks to choose a file.  
   - The selected image is rendered in the browser.

3. **Set Slice Lines**  
   - Hover the cursor for a horizontal line; click to add.  
   - Hold Shift + hover for a vertical line; click to add.  
   - Double-click any line to remove.  
   - Drag any line to reposition.

4. **Process & Download**  
   - User clicks **Process** at any time.  
   - The tool slices the original image accordingly, packages slices into a ZIP, and triggers the download.

5. **Exit**  
   - If the user refreshes, their slicing lines for this session remain.  
   - If the user closes the browser or tab, the session is discarded (unless localStorage still has the data).

---

## **5. Technical Specifications**

### **5.1. Front-End Architecture**

- **Framework Choice**  
  - A lightweight framework (React, Vue, or a simple plain JS/HTML/CSS) is acceptable.  
  - Must support modern browsers (Chrome, Firefox, Safari, Edge). No IE support required.  

- **Client-Side Image Processing**  
  - Use HTML5 `<canvas>` or similar to handle the slicing:  
    - Render the uploaded image to a canvas.  
    - For each sub-image boundary, create a canvas extraction (`context.drawImage(...)`) and convert to base64 or Blob.  
  - Use a library such as JSZip to zip the sub-images in memory and generate a downloadable file.

### **5.2. Image Loading & Representation**

- **In-Memory Storage**  
  - Upon upload, store the file and draw it to a hidden or visible `<canvas>`.  
  - Keep track of slice lines (horizontal and vertical) in an array (e.g., `horizontalLines = [y1, y2, ...]`, `verticalLines = [x1, x2, ...]`).  
  - Sort these arrays so they are always in ascending order.

### **5.3. Slice Management Logic**

1. **Adding Lines**  
   - On “click” (horizontal) or “Shift+click” (vertical), push the line coordinate to the respective array.  
   - Keep lines sorted.

2. **Removing Lines**  
   - On double-click, remove the relevant coordinate from the array.  
   - Recompute sub-image boundaries based on the updated arrays.

3. **Dragging Lines**  
   - On “mousedown” over a line, track the line’s index.  
   - On “mousemove,” update that line’s coordinate.  
   - On “mouseup,” finalize the position and re-sort if necessary.

4. **Boundaries**  
   - The top boundary is `y=0` and the bottom boundary is `y=imageHeight`.  
   - The left boundary is `x=0` and the right boundary is `x=imageWidth`.  
   - Horizontal slice coordinates always span the entire width; vertical slice coordinates always span the entire height.

### **5.4. Numbering Scheme**

- **Row-Major Order**  
  - Sort all horizontal lines plus top/bottom boundaries into segments.  
  - Sort all vertical lines plus left/right boundaries into segments.  
  - For each horizontal “row” segment (top to bottom), create sub-images from left to right.  
  - Label them sequentially: 1, 2, 3, etc.

### **5.5. ZIP File Generation**

- **Implementation**  
  - Use a client-side library (like JSZip).  
  - Convert each sub-image canvas to a Blob.  
  - Add it to the zip under a simple filename (`1.jpg`, `2.jpg`, etc.).  
  - Generate a download link.

- **Folder Structure**  
  - Single flat folder (no subfolders) containing the sub-images.  

### **5.6. Password Protection Mechanism**

- **Server/Config**  
  - Store the password in an environment variable or JSON config.  
  - The front end checks this password on initial page load.

- **Front-End**  
  - If localStorage/cookie doesn’t have a token indicating the user has already logged in:  
    - Prompt for password.  
    - If correct, store a “loggedIn” flag in localStorage.

> **Note**: Since no private user data is processed, this lightweight method is sufficient.

---

## **6. Non-Functional Requirements**

1. **Performance**  
   - Must handle images typical of email newsletters (e.g., ~1-5 MB) smoothly.  
   - Operations (zip generation, slicing) should complete within a few seconds on standard machines.

2. **Security**  
   - Basic password gate to deter unauthorized external use.  
   - No advanced encryption or security scanning is required.

3. **Browser Compatibility**  
   - Modern versions of Chrome, Firefox, Safari, and Edge are supported.  
   - No support for Internet Explorer or legacy browsers.

4. **Scalability**  
   - Primarily used by Fubo’s marketing team.  
   - No expectation of extremely high concurrent usage.

---

## **7. Future Enhancements**

1. **Snapping**  
   - Allow lines to snap to user-defined increments or detect “break points” in the image.

2. **Output Optimization**  
   - Compress/optimize slices for web usage.  
   - Offer multiple output formats (e.g., WebP) or resolutions.

3. **Overlay & Annotations**  
   - Add text or graphical annotations before slicing.

4. **Integration with Other Systems**  
   - Auto-upload slices to an email automation platform or CMS.

---

## **8. Acceptance Criteria**

1. **Basic Upload**  
   - User can successfully upload PNG/JPEG images.  
   - Large images (~5 MB) still load without errors.

2. **Slicing**  
   - Horizontal & vertical lines can be added, removed, or dragged.  
   - Removing all lines reverts to a single slice.  
   - The hover line appears correctly on horizontal or Shift+vertical states.

3. **ZIP Generation**  
   - Clicking **Process** triggers a download of a ZIP file.  
   - The ZIP contains sub-images named “1.jpg”, “2.jpg”, etc., in row-major order.  
   - Resulting sub-images visually match the segments shown by the slice lines.

4. **Session Persistence**  
   - If the user refreshes or navigates away and back within the same browser session, the lines remain.  
   - Closing the browser or tab can reset the state.

5. **Password Prompt**  
   - On initial load without stored credentials, user must enter a valid password to access.  
   - On subsequent visits, user is not prompted again (unless they clear storage or their session times out).

---

## **9. Implementation Plan**

1. **UI Development**  
   - Build a minimal UI with an upload zone, image display area, and control panel (Process button, password prompt).

2. **Slicing Logic**  
   - Implement logic to track horizontal/vertical lines.  
   - Implement drag-and-drop and double-click removal behaviors.

3. **ZIP Packaging**  
   - Integrate a client-side ZIP library (JSZip or equivalent).  
   - Dynamically generate sub-images and add them to the ZIP.

4. **Password Gate**  
   - Store the password in environment variables (on the deployment environment).  
   - Implement a simple login flow with localStorage to remember the session.

5. **Testing & QA**  
   - Ensure all acceptance criteria are met.  
   - Test on modern browsers (Chrome, Firefox, Safari, Edge).

6. **Deployment**  
   - Host on a simple static site or minimal Node server.  
   - Configure environment variable for password.

---

## **10. Timeline**

- **Week 1**: Basic front-end structure, password gate.  
- **Week 2**: Image upload, display, slicing logic (horizontal/vertical lines, removal).  
- **Week 3**: Drag-and-drop line adjustments, session persistence (localStorage).  
- **Week 4**: ZIP packaging integration, QA/testing, bug fixes.  
- **Week 5**: Cleanup, final testing, and release.

---

## **11. Appendix**

- **Tooling**:  
  - Preferred JavaScript frameworks/libraries: React/Vue or Vanilla JS  
  - Packaging: Node.js-based build (Webpack/Vite) or equivalent  
  - ZIP library: JSZip or similar

- **References**:  
  - JavaScript Canvas documentation: [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)  
  - JSZip documentation (or chosen library’s docs)
