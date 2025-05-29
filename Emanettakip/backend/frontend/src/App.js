import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages - henüz oluşturulmadı, placeholder'lar
import Dashboard from './pages/Dashboard';
import CustomerDetails from './pages/CustomerDetails';
import AdminPanel from './pages/AdminPanel';

// Components
import BackupManager from './components/BackupManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customer/:id" element={<CustomerDetails />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/backup" element={<BackupManager />} />
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa Bulunamadı</h1>
                <p className="text-gray-600">Aradığınız sayfa mevcut değil.</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 