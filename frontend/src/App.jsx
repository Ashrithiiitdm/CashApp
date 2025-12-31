import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Signup from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import QRScanner from './pages/QRScanner.jsx'

function App() {
  return (
    <div>
      {/* Route Definitions */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/qrscanner" element={<QRScanner />} />
      </Routes>
    </div>
  )
}

export default App