import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Sidebar from './components/Sidebar';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          // A verificação correta que usa IsAdmin
          if (userDoc.exists() && userDoc.data().IsAdmin) {
            // Usuário é admin, pode ficar.
            setLoading(false);
          } else {
            // Usuário logado mas não é admin, volta pro login.
            navigate('/admin/login', { replace: true });
          }
        } catch (error) {
          // Em caso de erro, não arrisque, mande para o login.
          console.error("Erro ao verificar permissão no AdminLayout:", error);
          navigate('/admin/login', { replace: true });
        }
      } else {
        // Ninguém logado, volta pro login.
        navigate('/admin/login', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Enquanto verifica, mostra uma tela de carregamento.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Verificando permissão...
      </div>
    );
  }

  // Se a verificação passou, renderiza o layout do admin com o conteúdo da página aninhada.
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
