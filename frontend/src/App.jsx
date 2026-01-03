import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Signup from './pages/SignUp.jsx'
import Login from './pages/Login.jsx'
import QRScanner from './pages/QRScanner.jsx'
import PayPeoplePage from './pages/PayPeople.jsx'
import MoneyTransfer from './pages/MoneyTransfer.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import RecentTransactions from './pages/RecentTransactions.jsx'
import SearchStores from './pages/SearchStores.jsx'
import StoreDetails from './pages/StoreDetails.jsx'
import CheckBalance from './pages/CheckBalance.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <div>
      {/* Route Definitions */}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/qrscanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
        <Route path="/paypeople" element={<ProtectedRoute><PayPeoplePage /></ProtectedRoute>} />
        <Route path="/moneytransfer" element={<ProtectedRoute><MoneyTransfer /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/recent-transactions" element={<ProtectedRoute><RecentTransactions /></ProtectedRoute>} />
        <Route path="/search-stores" element={<ProtectedRoute><SearchStores /></ProtectedRoute>} />
        <Route path="/store-details" element={<ProtectedRoute><StoreDetails /></ProtectedRoute>} />
        <Route path="/check-balance" element={<ProtectedRoute><CheckBalance /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App