import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { FaUsers } from 'react-icons/fa';

const Dashboard = () => {
  const [dailyStats, setDailyStats] = useState({ totalOrders: 0, totalRevenue: 0, mostOrdered: '-' });
  const [dailyCustomers, setDailyCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const getStartOfDay = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    };

    const startOfDay = getStartOfDay();

    const q = query(
      collection(db, 'pedidos'),
      where('dataDoPedido', '>=', startOfDay),
      orderBy('dataDoPedido', 'desc') // Ordena para pegar o último pedido facilmente
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todaysOrders = querySnapshot.docs.map(doc => doc.data());
      
      // Cálculos de estatísticas
      const totalOrders = todaysOrders.length;
      const totalRevenue = todaysOrders
        .filter(order => order.status !== 'Cancelado')
        .reduce((sum, order) => sum + (order.pagamento?.finalTotal || 0), 0);

      // 3. Item Mais Pedido
      const itemCounts = {};
      todaysOrders
        .filter(order => order.status !== 'Cancelado')
        .forEach(order => {
          order.carrinho?.forEach(item => {
            // O 'item' aqui é um açaí completo. O nome principal é o tamanho.
            const itemName = item.size?.label || item.size?.name || 'Item desconhecido';
            itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
          });
        });
      
      const mostOrdered = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b, '-');

      setDailyStats({ totalOrders, totalRevenue, mostOrdered });

      // Lógica para Clientes do Dia
      const customers = {};
      todaysOrders.forEach(order => {
        const phone = order.clienteTelefone; // Assumindo que o telefone está salvo aqui
        if (phone && !customers[phone]) { // Adiciona apenas o primeiro pedido (o mais recente)
          customers[phone] = {
            name: order.clienteNome,
            phone: phone,
            lastOrderTime: order.dataDoPedido?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'N/A'
          };
        }
      });

      setDailyCustomers(Object.values(customers));
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar dados para o dashboard: ", error);
      setLoading(false);
    });

    // Listener para Usuários Online (RTDB)
    const onlineUsersRef = ref(rtdb, 'onlineUsers');
    const unsubscribeRTDB = onValue(onlineUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        // Alternativa mais robusta para contar os filhos
        const data = snapshot.val();
        setOnlineUsers(Object.keys(data).length);
      } else {
        setOnlineUsers(0);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      {/* Seção de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card Usuários Online (NOVO) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Usuários Online</h2>
          <p className="text-3xl font-bold text-cyan-500 flex items-center">
            <FaUsers className="mr-3" />
            {loading ? '...' : onlineUsers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Total de Pedidos do Dia</h2>
          <p className="text-3xl font-bold text-blue-500">{loading ? '...' : dailyStats.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Valor Total Vendido (Dia)</h2>
          <p className="text-3xl font-bold text-green-500">{loading ? '...' : `R$ ${dailyStats.totalRevenue.toFixed(2)}`}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Item Mais Pedido (Dia)</h2>
          <p className="text-3xl font-bold text-purple-500">{loading ? '...' : dailyStats.mostOrdered}</p>
        </div>
      </div>

      {/* Seção de Clientes do Dia */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Clientes do Dia</h2>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-gray-500">Carregando clientes...</p>
          ) : dailyCustomers.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b font-medium text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Nome</th>
                  <th scope="col" className="px-4 py-3">Telefone</th>
                  <th scope="col" className="px-4 py-3">Último Pedido</th>
                </tr>
              </thead>
              <tbody>
                {dailyCustomers.map((customer, index) => (
                  <tr key={index} className="border-b transition duration-300 ease-in-out hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{customer.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{customer.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{customer.lastOrderTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Nenhum cliente fez pedido hoje ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
