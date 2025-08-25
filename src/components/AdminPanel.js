import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AppContext } from '../context/AppContext';
import { db, auth } from '../services/firebase';

const AdminPanel = () => {
  const { showToast } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('dataDoPedido', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'pedidos', orderId), { status: newStatus });
      showToast('Status atualizado!');
    } catch (error) {
      showToast('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary">📋 Gerenciamento</h2>
        <button onClick={() => signOut(auth)} className="text-sm border border-red-500 text-red-500 px-3 py-1 rounded-full">Sair</button>
      </div>
      {loading ? <p>Carregando...</p> : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{order.clienteNome}</h3>
              <p className="text-sm">Total: R$ {(order.pagamento?.finalTotal || 0).toFixed(2)}</p>
              <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="w-full p-2 border rounded mt-2 text-sm">
                {["Recebido", "Em preparo", "Saiu para entrega", "Finalizado", "Cancelado"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;