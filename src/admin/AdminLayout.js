import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { FaBars } from 'react-icons/fa';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar para telas grandes */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header com botão de menu para telas pequenas */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow lg:hidden">
          <button
            onClick={toggleSidebar}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label="Abrir sidebar"
          >
            <FaBars className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
             <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar para telas pequenas (Mobile) */}
      {isSidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-black opacity-50 z-20" onClick={toggleSidebar}></div>
          <div className="fixed inset-y-0 left-0 z-30">
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;