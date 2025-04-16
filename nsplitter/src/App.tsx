import React from 'react'
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'

function App() {
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

export default App 