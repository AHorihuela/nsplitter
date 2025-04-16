import React from 'react'
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from './utils/AuthContext'

const AppContent = () => {
  const { isAuthenticated, setIsAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage onLogin={(success) => setIsAuthenticated(success)} />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Main>
        <div className="flex-grow">
          {/* Content will go here */}
          <p className="text-center text-gray-600">Upload an image to get started</p>
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