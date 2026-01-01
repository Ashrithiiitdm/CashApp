import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Signup from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import QRScanner from './pages/QRScanner.jsx'
import PayPeoplePage from './pages/PayPeople.jsx'
import MoneyTransfer from './pages/MoneyTransfer.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import RecentTransactions from './pages/RecentTransactions.jsx'

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
        <Route path="/paypeople" element={<PayPeoplePage />} />
        <Route path="/moneytransfer" element={<MoneyTransfer />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/recent-transactions" element={<RecentTransactions />} />
      </Routes>
    </div>
  )
}

export default App