import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import OrderCard from '../components/OrderCard';
import OrderDetailsModal from '../components/OrderDetailsModal';

const columnConfig = {
  'Novo': { title: 'Novos Pedidos', color: 'bg-blue-500' },
  'Em Preparo': { title: 'Em Preparo', color: 'bg-yellow-500' },
  'Saiu para Entrega': { title: 'Saiu para Entrega', color: 'bg-green-500' },
  'Finalizado': { title: 'Finalizados', color: 'bg-gray-400' },
  'Cancelado': { title: 'Cancelados', color: 'bg-red-500' },
};

const columnOrder = ['Novo', 'Em Preparo', 'Saiu para Entrega', 'Finalizado', 'Cancelado'];

const AdminDashboard = () => {
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // CORREÇÃO: Ordenando por 'dataDoPedido' em vez de 'timestamp'
    const q = query(collection(db, 'pedidos'), orderBy('dataDoPedido', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Inicializa as colunas com base na configuração
      const newColumns = {};
      columnOrder.forEach(status => {
        newColumns[status] = {
          ...columnConfig[status],
          orders: [],
        };
      });

      // Distribui os pedidos nas colunas corretas
      allOrders.forEach(order => {
        if (newColumns[order.status]) {
          newColumns[order.status].orders.push(order);
        }
      });

      setColumns(newColumns);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar pedidos: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];

    // Atualização otimista da UI
    const startOrders = Array.from(startColumn.orders);
    const [movedOrder] = startOrders.splice(source.index, 1);

    const newColumns = { ...columns };

    if (startColumn === endColumn) {
      // Movendo dentro da mesma coluna
      startOrders.splice(destination.index, 0, movedOrder);
      newColumns[source.droppableId] = { ...startColumn, orders: startOrders };
    } else {
      // Movendo para uma coluna diferente
      const endOrders = Array.from(endColumn.orders);
      endOrders.splice(destination.index, 0, movedOrder);
      newColumns[source.droppableId] = { ...startColumn, orders: startOrders };
      newColumns[destination.droppableId] = { ...endColumn, orders: endOrders };
      
      // Atualiza o status no Firestore
      const orderRef = doc(db, 'pedidos', draggableId);
      await updateDoc(orderRef, { status: destination.droppableId });
    }

    setColumns(newColumns);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este pedido?')) {
      await deleteDoc(doc(db, 'pedidos', orderId));
      setSelectedOrder(null); // Fecha o modal
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl font-semibold">Carregando pedidos...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Painel de Pedidos</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {columnOrder.map(columnId => {
            const column = columns[columnId];
            if (!column) return null;

            return (
              <div key={columnId} className="bg-gray-100 rounded-lg flex flex-col">
                <div className={`p-3 rounded-t-lg flex justify-between items-center ${column.color}`}>
                  <h2 className="font-bold text-white">{column.title}</h2>
                  <span className="text-sm font-semibold text-white bg-white/30 rounded-full px-2 py-0.5">
                    {column.orders.length}
                  </span>
                </div>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 pt-4 flex-grow transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''}`}
                    >
                      {column.orders.length > 0 ? (
                        column.orders.map((order, index) => (
                          <OrderCard 
                            key={order.id} 
                            order={order} 
                            index={index} 
                            onOpenDetails={setSelectedOrder}
                          />
                        ))
                      ) : (
                        <div className="text-center text-sm text-gray-500 p-4">
                          Nenhum pedido aqui.
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </div>
  );
};

export default AdminDashboard;