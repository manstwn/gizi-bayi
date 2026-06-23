import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BalitaList from './pages/BalitaList';
import Pemeriksaan from './pages/Pemeriksaan';
import Laporan from './pages/Laporan';
import UserManagement from './pages/UserManagement';
import ProfilePage from './pages/ProfilePage';
import LiveCalculation from './pages/LiveCalculation';
import SettingsPage from './pages/SettingsPage';
import MainLayout from './components/MainLayout';
import NaiveBayesTrain from './pages/NaiveBayesTrain';
import NaiveBayesPredict from './pages/NaiveBayesPredict';
import DummyDataPage from './pages/DummyDataPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/balita" 
          element={
            <ProtectedRoute>
              <BalitaList />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pemeriksaan" 
          element={
            <ProtectedRoute>
              <Pemeriksaan />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/laporan" 
          element={
            <ProtectedRoute>
              <Laporan />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/simulation" 
          element={
            <ProtectedRoute>
              <LiveCalculation />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/naive-bayes/train" 
          element={
            <ProtectedRoute>
              <NaiveBayesTrain />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/naive-bayes/predict" 
          element={
            <ProtectedRoute>
              <NaiveBayesPredict />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/naive-bayes/dummy" 
          element={
            <ProtectedRoute>
              <DummyDataPage />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
