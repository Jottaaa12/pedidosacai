import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Importe o 'db' e as funções do firestore
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
// Importe getDoc e doc
import { doc, getDoc } from 'firebase/firestore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading do botão de login
  const [authLoading, setAuthLoading] = useState(true); // Loading inicial da página
  const navigate = useNavigate();

  useEffect(() => {
    // Torna a função do listener assíncrona para usar await
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado, AGORA PRECISAMOS VERIFICAR SE É ADMIN
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().IsAdmin) {
            // É ADMIN: Redirecionar para o dashboard
            navigate('/admin/dashboard', { replace: true });
          } else {
            // NÃO É ADMIN (ou doc não existe):
            // Apenas pare de carregar e mostre a página de login.
            // Se ele estiver logado como cliente, ele verá o login de admin.
            setAuthLoading(false);
          }
        } catch (err) {
          console.error("Erro ao verificar permissão de admin:", err);
          setError("Erro ao verificar permissão.");
          setAuthLoading(false); // Pare de carregar em caso de erro
        }
      } else {
        // Ninguém logado, parar de carregar e mostrar formulário de login
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
    // O navigate é estável e não precisa estar nas dependências
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Tentar fazer o login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // DEBUG: Exibir o UID do usuário que fez login
      console.log('UID do usuário autenticado:', user.uid);

      // 2. APÓS o login, verificar se é admin
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      // DEBUG: Exibir os dados completos do documento
      console.log('Dados do documento do Firestore:', userDoc.data());

      if (userDoc.exists() && userDoc.data().IsAdmin) {
        // É admin, o useEffect vai tratar o redirecionamento, 
        // mas podemos forçar aqui para ser mais rápido.
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Logou, mas não é admin
        setError('Você não tem permissão para acessar esta área.');
        await auth.signOut(); // Deslogar o usuário não-admin imediatamente
        setLoading(false);
      }
    } catch (err) {
      // Erro no signInWithEmailAndPassword (email/senha errados)
      setLoading(false);
      setError('Email ou senha inválidos.');
      console.error(err);
    }
  };

  // Mostra "Carregando..." enquanto verifica o estado de autenticação inicial
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Carregando...
      </div>
    );
  }

  // Renderiza o formulário de login
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-400">Admin Sabor da Terra</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default AdminLogin;