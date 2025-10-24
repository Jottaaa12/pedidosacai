import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Layout simplificado que apenas renderiza a estrutura visual.
// A proteção da rota agora é feita exclusivamente pelo componente PrivateRoute.
const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;