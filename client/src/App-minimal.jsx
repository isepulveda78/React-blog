import React, { useState, useEffect, createContext, useContext } from 'react'
import { Router, Route, Switch } from 'wouter'

console.log('🔴 MINIMAL APP LOADING - Testing React error #130 fix')

// Minimal working components
const Navigation = () => <nav><h3>Navigation Works</h3></nav>
const Footer = () => <footer><p>Footer Works</p></footer>
const Home = () => <div><h1>Home Works</h1></div>
const TestRoute = () => (
  <div style={{ backgroundColor: '#e6f3ff', padding: '20px', border: '3px solid red' }}>
    <h1>🎯 MINIMAL ROUTE SUCCESS!</h1>
    <p>If you see this, the routing system works and React error is fixed.</p>
  </div>
)

// Auth Context
const AuthContext = createContext(null)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ name: 'Test User', isAdmin: true })
  const [isLoading, setIsLoading] = useState(false)

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

const App = () => {
  console.log('🔴 MINIMAL APP RENDERING')
  
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navigation />
          <main className="flex-grow-1">
            <Switch>
              <Route path="/admin/posts">
                <TestRoute />
              </Route>
              <Route path="/">
                <Home />
              </Route>
            </Switch>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App