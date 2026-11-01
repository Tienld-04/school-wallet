import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/common/Loading/Loading';
// Login giữ import tĩnh: là trang vào đầu tiên, tránh nháy spinner khi mở app.
import Login from '../pages/Auth/Login';

// Các trang còn lại lazy-load để tách khỏi bundle chính (recharts/html5-qrcode chỉ tải khi cần).
const Register = lazy(() => import('../pages/Auth/Register'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const MainLayout = lazy(() => import('../layouts/MainLayout'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Transfer = lazy(() => import('../pages/Transfer'));
const Payment = lazy(() => import('../pages/Payment'));
const TopUp = lazy(() => import('../pages/TopUp'));
const TopUpResult = lazy(() => import('../pages/TopUpResult'));
const TransactionHistory = lazy(() => import('../pages/TransactionHistory'));
const Profile = lazy(() => import('../pages/Profile'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const MerchantManagement = lazy(() => import('../pages/admin/MerchantManagement'));
const KycManagement = lazy(() => import('../pages/admin/KycManagement'));
const StatsDashboard = lazy(() => import('../pages/admin/StatsDashboard'));
const RevenueDashboard = lazy(() => import('../pages/admin/RevenueDashboard'));
const MerchantRevenueDashboard = lazy(() => import('../pages/MerchantRevenueDashboard'));
const TransactionLookup = lazy(() => import('../pages/TransactionLookup'));
const MyMerchants = lazy(() => import('../pages/MyMerchants'));

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

const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading size="lg" />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/top-up" element={<TopUp />} />
        <Route path="/top-up/result" element={<TopUpResult />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/transaction-lookup" element={<TransactionLookup />} />
        <Route path="/merchant-revenue" element={<MerchantRevenueDashboard />} />
        <Route path="/my-merchants" element={<MyMerchants />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/stats" element={<AdminRoute><StatsDashboard /></AdminRoute>} />
        <Route path="/admin/revenue" element={<AdminRoute><RevenueDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/merchants" element={<AdminRoute><MerchantManagement /></AdminRoute>} />
        <Route path="/admin/kyc" element={<AdminRoute><KycManagement /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
