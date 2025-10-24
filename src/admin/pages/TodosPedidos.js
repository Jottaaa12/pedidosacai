import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Reutilizando a ordem de status para consistência
const statusOptions = ['Novo', 'Em Preparo', 'Saiu para Entrega', 'Finalizado', 'Cancelado'];

const TodosPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
        collection(db, 'pedidos'),
        orderBy('dataDoPedido', 'desc') // Ordena dos mais novos para os mais antigos
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allOrders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback para data: se não existir ou não for um timestamp, usa a data atual.
        const orderDate = (data.dataDoPedido && typeof data.dataDoPedido.toDate === 'function')
          ? data.dataDoPedido.toDate()
          : new Date(); 

        return {
          id: doc.id,
          ...data,
          dataDoPedido: orderDate,
        };
      });
      setPedidos(allOrders);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar todos os pedidos: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const orderRef = doc(db, 'pedidos', orderId);
    try {
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar o status: ", error);
      alert('Não foi possível atualizar o status do pedido.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido permanentemente? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'pedidos', orderId));
      } catch (error) {
        console.error("Erro ao excluir o pedido: ", error);
        alert('Não foi possível excluir o pedido.');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold">Carregando todos os pedidos...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Todos os Pedidos</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Data/Hora</th>
                <th className="py-3 px-6 text-left">Cliente</th>
                <th className="py-3 px-6 text-center">Total</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {pedidos.map(pedido => (
                <tr key={pedido.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-4 px-6 text-left whitespace-nowrap">
                    {pedido.dataDoPedido.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-4 px-6 text-left">
                    {pedido.clienteNome || 'Não informado'}
                  </td>
                  <td className="py-4 px-6 text-center font-semibold">
                    R$ {(typeof pedido.pagamento?.finalTotal === 'number' ? pedido.pagamento.finalTotal.toFixed(2) : '0.00').replace('.', ',')}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <select 
                      value={pedido.status || 'Novo'}
                      onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                      className="form-select appearance-none block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button 
                      onClick={() => handleDeleteOrder(pedido.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full text-xs"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pedidos.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                Nenhum pedido encontrado.
            </div>
        )}
      </div>
    </div>
  );
};

export default TodosPedidos;
