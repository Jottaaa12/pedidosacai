import React from 'react';
import { NavLink } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { FaClipboardList, FaBook, FaTimes, FaTachometerAlt, FaListUl } from 'react-icons/fa';

const Sidebar = ({ toggleSidebar }) => { // Recebe a função para fechar

  const handleLogout = async () => {
    await auth.signOut();
  };

  const linkClasses = "flex items-center px-4 py-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200";
  const activeLinkClasses = "bg-gray-900 text-white";

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col h-full">
       <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold text-center">Sabor da Terra</h2>
        {/* Botão para fechar no modo mobile */}
        <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
          <FaTimes className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-grow">
        <ul>
          <li className="mb-4">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              <FaTachometerAlt className="mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li className="mb-4">
            <NavLink
              to="/admin/pedidos"
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              <FaClipboardList className="mr-3" />
              Pedidos
            </NavLink>
          </li>
          <li className="mb-4">
            <NavLink
              to="/admin/todos-pedidos"
              className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              <FaListUl className="mr-3" />
              Todos os Pedidos
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