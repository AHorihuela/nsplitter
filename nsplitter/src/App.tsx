import React, { useState } from 'react'
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import ImageUploader from './components/ImageUploader'
import ImageCanvas from './components/ImageCanvas'
import { AuthProvider, useAuth } from './utils/AuthContext'

const AppContent = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth()
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)

  if (!isAuthenticated) {
    return <LoginPage onLogin={(success) => setIsAuthenticated(success)} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Main>
        <div className="flex-grow space-y-8">
          {!uploadedImage ? (
            <div className="max-w-2xl mx-auto">
              <ImageUploader onImageUpload={setUploadedImage} />
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <ImageCanvas imageFile={uploadedImage} />
              <button
                onClick={() => setUploadedImage(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Upload a different image
              </button>
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