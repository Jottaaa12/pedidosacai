import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import OrderCard from '../components/OrderCard';
import OrderDetailsModal from '../components/OrderDetailsModal';

const AdminDashboard = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('today'); // 'today', 'week', 'all'

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar pedidos: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const getFiltered = () => {
      if (!allOrders) return [];
      switch (filter) {
        case 'today':
          return allOrders.filter(order => order.timestamp && order.timestamp.toDate() >= today);
        case 'week':
          return allOrders.filter(order => order.timestamp && order.timestamp.toDate() >= weekAgo);
        case 'all':
        default:
          return allOrders;
      }
    };
    setFilteredOrders(getFiltered());
  }, [allOrders, filter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const orderRef = doc(db, 'pedidos', orderId);
    await updateDoc(orderRef, { status: newStatus });
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
        const orderRef = doc(db, 'pedidos', orderId);
        await updateDoc(orderRef, { status: 'Cancelado' });
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este pedido?')) {
        await deleteDoc(doc(db, 'pedidos', orderId));
        setSelectedOrder(null); // Fecha o modal
    }
  };

  const openDetailsModal = (order) => setSelectedOrder(order);
  const closeDetailsModal = () => setSelectedOrder(null);

  const renderOrderSection = (title, status) => {
    const orders = filteredOrders.filter(order => order.status === status);
    if (orders.length === 0) return null;

    return (
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-700 border-b-2 border-gray-200 pb-2">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              onOpenDetails={openDetailsModal}
              onUpdateStatus={handleUpdateStatus}
              onCancelOrder={handleCancelOrder}
            />
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return <div className="text-center mt-8 text-xl">Carregando pedidos...</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Painel de Pedidos</h1>
        <div>
          <select onChange={(e) => setFilter(e.target.value)} value={filter} className="p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <option value="today">Hoje</option>
            <option value="week">Últimos 7 dias</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      <div className="space-y-10">
        {renderOrderSection('Novos Pedidos', 'Novo')}
        {renderOrderSection('Em Preparo', 'Em Preparo')}
        {renderOrderSection('Saiu para Entrega', 'Saiu para Entrega')}
        {renderOrderSection('Finalizados', 'Finalizado')}
        {renderOrderSection('Cancelados', 'Cancelado')}
      </div>

      <OrderDetailsModal 
        order={selectedOrder}
        onClose={closeDetailsModal}
        onDeleteOrder={handleDeleteOrder}
      />
    </>
  );
};

export default AdminDashboard;
