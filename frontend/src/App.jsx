import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore'; 
import { Toaster } from 'react-hot-toast'; // ✅ Imported here

// --- Pages ---
import Home from './pages/Home.jsx';
import Signup from './pages/SignUp.jsx';
import Login from './pages/Login.jsx';
import QRScanner from './pages/QRScanner.jsx';
import PayPeoplePage from './pages/PayPeople.jsx';
import MoneyTransfer from './pages/MoneyTransfer.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import RecentTransactions from './pages/RecentTransactions.jsx';
import SearchStores from './pages/SearchStores.jsx';
import StoreDetails from './pages/StoreDetails.jsx';
import CheckBalance from './pages/CheckBalance.jsx';
import VendorDashboard from './pages/vendor/VendorDashboard.jsx';
import AddStore from './pages/vendor/AddStore.jsx';
import EditStoreItems from './pages/vendor/EditStoreItems.jsx';
import MyStores from './pages/vendor/MyStores.jsx';

// --- Components ---
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ViewStore from './pages/vendor/ViewStore.jsx';

// --- Helper Component: Dashboard Resolver ---
const DashboardResolver = () => {
  const { user } = useAuthStore();
  if (user?.role === 'vendor') {
    return <VendorDashboard />;
  }
  return <Home />;
};

function App() {
  return (
    <div>
      {/* ✅ FIX: Render the Toaster component here so toasts can appear */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }} 
      />

      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* --- Root Route: Auto-detects user type --- */}
        <Route path="/" element={
            <ProtectedRoute>
                <DashboardResolver />
            </ProtectedRoute>
        } />
        
        <Route path="/home" element={
            <ProtectedRoute>
                <DashboardResolver />
            </ProtectedRoute>
        } />

        {/* ==================================================
            SHARED ROUTES (Accessible by BOTH User & Vendor)
           ================================================== */}
        <Route path="/check-balance" element={<ProtectedRoute><CheckBalance /></ProtectedRoute>} />
        <Route path="/recent-transactions" element={<ProtectedRoute><RecentTransactions /></ProtectedRoute>} />
        <Route path="/moneytransfer" element={<ProtectedRoute><MoneyTransfer /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />


        {/* ==================================================
            USER ONLY ROUTES (allowedRoles=['user'])
           ================================================== */}
        <Route path="/qrscanner" element={
            <ProtectedRoute allowedRoles={['user']}>
                <QRScanner />
            </ProtectedRoute>
        } />

        <Route path="/paypeople" element={
            <ProtectedRoute allowedRoles={['user']}>
                <PayPeoplePage />
            </ProtectedRoute>
        } />

        <Route path="/search-stores" element={
            <ProtectedRoute allowedRoles={['user']}>
                <SearchStores />
            </ProtectedRoute>
        } />

        <Route path="/store-details" element={
            <ProtectedRoute allowedRoles={['user']}>
                <StoreDetails />
            </ProtectedRoute>
        } />


        {/* ==================================================
            VENDOR ONLY ROUTES (allowedRoles=['vendor'])
           ================================================== */}
        <Route path="/vendor-dashboard" element={
            <ProtectedRoute allowedRoles={['vendor']}>
                <VendorDashboard />
            </ProtectedRoute>
        } />

        <Route path="/vendor/my-stores" element={
            <ProtectedRoute allowedRoles={['vendor']}>
                <MyStores />
            </ProtectedRoute>
        } />

        <Route path="/vendor/add-store" element={
            <ProtectedRoute allowedRoles={['vendor']}>
                <AddStore />
            </ProtectedRoute>
        } />

        <Route path="/vendor/edit-items" element={
            <ProtectedRoute allowedRoles={['vendor']}>
                <EditStoreItems />
            </ProtectedRoute>
        } />

        <Route path="/vendor/view-store" element={
            <ProtectedRoute allowedRoles={['vendor']}>
                <ViewStore />
            </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </div>
  )
}

export default App;