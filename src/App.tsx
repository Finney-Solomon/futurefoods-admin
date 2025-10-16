import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/sections/Dashboard';
import { Categories } from './components/sections/Categories';
import { Products } from './components/sections/Products';
import { Orders } from './components/sections/Orders';
import { ToastContainer, useToast } from './components/ui/Toast';
import { Blogs } from './components/sections/Blogs';
import { Recipes } from './components/sections/Recipes';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const toast = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      </>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'categories':
        return <Categories />;
      case 'products':
        return <Products />;
      case 'orders':
        return <Orders />;
      case 'blogs':
        return <Blogs />;
      case 'recipes':
        return <Recipes />;
        
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      
      <AppContent />
    </AuthProvider>
  );
}

export default App;