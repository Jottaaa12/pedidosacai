import React from 'react';
import { NavLink } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { FaClipboardList, FaBook } from 'react-icons/fa';

const Sidebar = () => {

  const handleLogout = async () => {
    await auth.signOut();
    // A navegação será tratada pelo listener de autenticação no App.js
  };

  const linkClasses = "flex items-center px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white";
  const activeLinkClasses = "bg-gray-900 text-white";

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-10 text-center">Sabor da Terra</h2>
      <nav className="flex-grow">
        <ul>
          <li className="mb-4">
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              <FaClipboardList className="mr-3" />
              Pedidos
            </NavLink>
          </li>
          <li className="mb-4">
            <NavLink 
              to="/admin/cardapio" 
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              <FaBook className="mr-3" />
              Cardápio
            </NavLink>
          </li>
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

