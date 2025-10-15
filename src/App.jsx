import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { Toaster } from './components/ui/toaster'
import './App.css'

function App() {
  const { currentUser } = useAuth()

  return (
    <>
      {currentUser ? <Dashboard /> : <Login />}
      <Toaster />
    </>
  )
}

export default App

