import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Transfer from '../pages/Transfer';
import Payment from '../pages/Payment';
import TopUp from '../pages/TopUp';
import TransactionHistory from '../pages/TransactionHistory';
import Profile from '../pages/Profile';
import UserManagement from '../pages/admin/UserManagement';
import MerchantManagement from '../pages/admin/MerchantManagement';
import KycManagement from '../pages/admin/KycManagement';
import StatsDashboard from '../pages/admin/StatsDashboard';
import TransactionLookup from '../pages/admin/TransactionLookup';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/top-up" element={<TopUp />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/stats" element={<AdminRoute><StatsDashboard /></AdminRoute>} />
        <Route path="/admin/transaction-lookup" element={<AdminRoute><TransactionLookup /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/merchants" element={<AdminRoute><MerchantManagement /></AdminRoute>} />
        <Route path="/admin/kyc" element={<AdminRoute><KycManagement /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
