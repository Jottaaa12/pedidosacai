import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
// MELHORIA: Adicionado 'where' para filtrar a busca de pedidos
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
    // MELHORIA: A consulta agora busca apenas pedidos que NÃO estão finalizados ou cancelados.
    // Isso torna o painel muito mais rápido e eficiente à medida que o número de pedidos aumenta.
    const q = query(
        collection(db, 'pedidos'), 
        where('status', 'not-in', ['Finalizado', 'Cancelado']),
        orderBy('status'), // Ordenar por status pode ajudar na organização
        orderBy('dataDoPedido', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activeOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const newColumns = columnOrder.reduce((acc, status) => {
        acc[status] = { ...columnConfig[status], orders: [] };
        return acc;
      }, {});

      activeOrders.forEach(order => {
        const status = order.status && columnConfig[order.status] ? order.status : 'Novo';
        if (newColumns[status]) {
            newColumns[status].orders.push(order);
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

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Guarda o estado original para o caso de erro
    const originalColumns = { ...columns };

    // Atualização otimista da UI
    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];
    const startOrders = Array.from(startColumn.orders);
    const [movedOrder] = startOrders.splice(source.index, 1);
    
    const newColumnsState = { ...columns };

    if (startColumn === endColumn) {
        startOrders.splice(destination.index, 0, movedOrder);
        newColumnsState[source.droppableId] = { ...startColumn, orders: startOrders };
    } else {
        const endOrders = Array.from(endColumn.orders);
        endOrders.splice(destination.index, 0, movedOrder);
        newColumnsState[source.droppableId] = { ...startColumn, orders: startOrders };
        newColumnsState[destination.droppableId] = { ...endColumn, orders: endOrders };
    }
    setColumns(newColumnsState); // Aplica a mudança na tela imediatamente

    // Tenta atualizar no Firestore
    try {
        const orderRef = doc(db, 'pedidos', draggableId);
        await updateDoc(orderRef, { status: destination.droppableId });
    } catch (error) {
        console.error("Erro ao atualizar o status do pedido:", error);
        // CORREÇÃO: Se a atualização no banco de dados falhar,
        // a tela é revertida para o estado original, evitando inconsistências.
        alert("Não foi possível atualizar o pedido. Tente novamente.");
        setColumns(originalColumns);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja EXCLUIR PERMANENTEMENTE este pedido?')) {
      try {
        await deleteDoc(doc(db, 'pedidos', orderId));
        setSelectedOrder(null);
      } catch (error) {
        console.error("Erro ao excluir o pedido:", error);
        alert("Erro ao excluir o pedido.");
      }
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
              <div key={columnId} className="bg-gray-100 rounded-lg flex flex-col max-h-[85vh]">
                <div className={`p-3 rounded-t-lg flex justify-between items-center ${column.color} sticky top-0 z-10`}>
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
                      className={`p-3 pt-4 flex-grow transition-colors overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}
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