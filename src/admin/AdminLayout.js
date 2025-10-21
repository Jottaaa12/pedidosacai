import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().isAdmin) {
            navigate('/admin/dashboard', { replace: true });
          } else {
            setAuthLoading(false);
          }
        } catch (err) {
          console.error("Erro ao verificar permissão no useEffect:", err);
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log("Iniciando tentativa de login..."); // LOG 1

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Login (Auth) com sucesso."); // LOG 2
      console.log("UID do usuário logado:", user.uid); // LOG 3 (O MAIS IMPORTANTE)

      // Verificar permissão no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log("Documento encontrado no Firestore."); // LOG 4
        console.log("Dados do documento:", userDoc.data()); // LOG 5
        
        const isAdmin = userDoc.data().isAdmin;
        console.log("Valor do campo 'isAdmin':", isAdmin); // LOG 6

        if (isAdmin === true) {
          console.log("Permissão OK. Redirecionando..."); // LOG 7
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.log("Erro: O campo 'isAdmin' não é 'true'."); // LOG 8
          setError('Você não tem permissão para acessar esta área.');
          await auth.signOut();
          setLoading(false);
        }
      } else {
        console.log("Erro: Documento NÃO encontrado no Firestore."); // LOG 9
        console.log("Caminho procurado:", userDocRef.path);
        setError('Você não tem permissão para acessar esta área. (Doc não encontrado)');
        await auth.signOut();
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro no login (Auth) ou na verificação:", err);
      setError('Email ou senha inválidos.');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-indigo-400">Admin Sabor da Terra</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
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