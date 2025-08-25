import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';

const MyOrders = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user?.uid) { setLoading(false); return; }
    const q = query(collection(db, 'pedidos'), where('clienteId', '==', state.user.uid), orderBy('dataDoPedido', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [state.user]);

  const repeatOrder = (order) => {
    dispatch({ type: 'REPEAT_ORDER', payload: order.carrinho });
    dispatch({ type: 'SET_STEP', payload: 7 });
    dispatch({ type: 'SHOW_FORM' });
    showToast('Pedido carregado!');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary">🍧 Meus Pedidos</h2>
        <button onClick={() => dispatch({ type: 'SHOW_FORM' })} className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full">Voltar</button>
      </div>
      {loading ? <p>Carregando...</p> : !orders.length ? <p>Nenhum pedido encontrado.</p> : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border p-4 rounded-lg">
              <p><strong>Status:</strong> {order.status}</p>
              <button onClick={() => repeatOrder(order)} className="w-full mt-2 py-2 text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Repetir Pedido</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;