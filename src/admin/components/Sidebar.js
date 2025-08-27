import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-center">Sabor da Terra</h2>
      <nav className="flex-grow">
        <ul>
          <li className="mb-4">
            <a href="/admin/dashboard" className="hover:text-gray-300">
              Pedidos
            </a>
          </li>
          {/* Adicionar mais links aqui */}
        </ul>
      </nav>
      <button 
        onClick={handleLogout}
        className="mt-auto w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
      >
        Sair
      </button>
    </div>
  );
};

export default Sidebar;
