import React, { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Main from './components/Main'
import LoginPage from './components/LoginPage'
import ImageUploader from './components/ImageUploader'
import ImageCanvas, { ImageCanvasRef } from './components/ImageCanvas'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { saveImageToStorage, getImageFromStorage } from './utils/storage'

interface ControlsState {
  canUndo: boolean;
  canRedo: boolean;
  canExport: boolean;
  isProcessing: boolean;
}

const AppContent = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imageHash, setImageHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [controlsState, setControlsState] = useState<ControlsState>({
    canUndo: false,
    canRedo: false,
    canExport: false,
    isProcessing: false
  })
  
  // Refs to canvas methods
  const canvasRef = useRef<ImageCanvasRef>(null);

  // Load image from storage on initial mount
  useEffect(() => {
    const loadStoredImage = async () => {
      try {
        const storedImageData = await getImageFromStorage()
        if (storedImageData) {
          setUploadedImage(storedImageData.file)
          setImageHash(storedImageData.hash)
        }
      } catch (error) {
        console.error('Failed to load stored image:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredImage()
  }, [])

  // Save image to storage whenever it changes
  useEffect(() => {
    const saveImage = async () => {
      if (uploadedImage) {
        const hash = await saveImageToStorage(uploadedImage)
        setImageHash(hash)
        // Update the ImageCanvas with the new hash to load corresponding lines
        if (canvasRef.current && hash) {
          canvasRef.current.updateImageHash(hash)
        }
      }
    }

    saveImage()
  }, [uploadedImage])

  // Handler for when a new image is uploaded
  const handleImageUpload = async (file: File) => {
    setUploadedImage(file)
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={(success) => setIsAuthenticated(success)} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        showUploadButton={!!uploadedImage}
        onUploadNewClick={() => setUploadedImage(null)}
        showControls={!!uploadedImage}
        canUndo={controlsState.canUndo}
        canRedo={controlsState.canRedo}
        onUndo={() => canvasRef.current?.handleUndo()}
        onRedo={() => canvasRef.current?.handleRedo()}
        onClear={() => canvasRef.current?.clearLines()}
        onExport={() => canvasRef.current?.handleExport()}
        isProcessing={controlsState.isProcessing}
        showExport={controlsState.canExport}
      />
      <Main>
        <div className="w-full h-full flex flex-col">
          <div className="max-w-[95vw] mx-auto px-2 sm:px-4 py-3 w-full flex-grow">
            {!uploadedImage ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                    Upload Your Image
                  </h2>
                  <ImageUploader onImageUpload={handleImageUpload} />
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-[90vw] mx-auto h-full">
                <div className="bg-white p-3 rounded-lg shadow-sm max-h-[85vh] overflow-auto">
                  <ImageCanvas 
                    imageFile={uploadedImage} 
                    onControlStateChange={setControlsState}
                    ref={canvasRef}
                    imageHash={imageHash}
                  />
                </div>
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Tip:</span> Hold Shift while hovering to create vertical lines. Double-click on a line to remove it.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 