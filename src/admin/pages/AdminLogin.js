import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // Mantém o estado de carregamento inicial
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Escuta mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Se o usuário estiver logado E estiver na página de login, redireciona
        if (location.pathname === '/admin/login') {
          navigate('/admin/dashboard', { replace: true }); // Usar replace para evitar histórico confuso
        } else {
          // Se já estiver em outra página admin, apenas para de carregar
          setAuthLoading(false);
        }
      } else {
        // Se não houver usuário, para de carregar (permanece na página de login)
        setAuthLoading(false);
      }
    });

    // Limpa o listener ao desmontar o componente
    return () => unsubscribe();
  // Adiciona location.pathname como dependência para reavaliar se a rota mudar
  }, [navigate, location.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Inicia o loading do botão
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirecionamento será tratado pelo useEffect/onAuthStateChanged
      // Não precisa parar o loading aqui, pois a página vai mudar
    } catch (err) {
      setLoading(false); // Para o loading do botão em caso de erro
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
                required // Adicionado required para validação básica
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
                required // Adicionado required para validação básica
              />
            </div>
            <button
              type="submit"
              disabled={loading} // Desabilita durante o processo de login
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