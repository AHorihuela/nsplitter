import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import ImageUploader from './components/ImageUploader'
import ImageCanvas from './components/ImageCanvas'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { saveImageToStorage, getImageFromStorage } from './utils/storage'

const AppContent = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load image from storage on initial mount
  useEffect(() => {
    const loadStoredImage = async () => {
      try {
        const storedImage = await getImageFromStorage()
        if (storedImage) {
          setUploadedImage(storedImage)
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
    if (uploadedImage) {
      saveImageToStorage(uploadedImage)
    }
  }, [uploadedImage])

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
      <Header />
      <Main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {!uploadedImage ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  Upload Your Image
                </h2>
                <ImageUploader onImageUpload={setUploadedImage} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Image Editor
                </h2>
                <button
                  onClick={() => setUploadedImage(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white rounded-md border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Upload a different image
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <ImageCanvas imageFile={uploadedImage} />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Tip:</span> Hold Shift while hovering to create vertical lines
                </div>
              </div>
            </div>
          )}
        </div>
      </Main>
      <Footer />
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