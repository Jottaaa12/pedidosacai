import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FaTrash, FaPlus } from 'react-icons/fa';

// Converte um array de strings para o novo formato de objeto com status
const convertToObjects = arr => arr.map(item => ({ name: item, status: 'ativado' }));

// Dados iniciais para o cardápio, já no novo formato
const initialMenuData = {
    creams: convertToObjects(["Creme de maracujá", "Creme de morango", "Creme de ninho", "Creme de cupuaçu"]),
    fruits: convertToObjects(["Morango", "Kiwi", "Uva"]),
    toppings: convertToObjects([
        "Leite em pó", "Castanha Caramelizada", "Granola", "Castanha",
        "Gotas de Chocolate", "Paçoquita", "Amendoim", "Chocoball",
        "Canudinho Biju", "Cereja", "Sucrilhos", "M&M", "Ovomaltine",
        "Cookies Branco", "Cookies Preto", "Farinha de tapioca"
    ]),
    syrups: convertToObjects(["Sem cobertura", "Morango", "Chocolate", "Maracujá"]),
    sizes: [
        { label: "300g – R$ 15,00", price: 15.00, status: 'ativado' },
        { label: "360g – R$ 18,00", price: 18.00, status: 'ativado' },
        { label: "400g – R$ 20,00", price: 20.00, status: 'ativado' },
        { label: "440g – R$ 22,00", price: 22.00, status: 'ativado' },
        { label: "500g – R$ 25,00", price: 25.00, status: 'ativado' },
        { label: "Outro valor", type: "custom", status: 'ativado' }
    ]
};

const GerenciarCardapio = () => {
    const [menu, setMenu] = useState(null);
    const [newItem, setNewItem] = useState({ creams: '', fruits: '', toppings: '', syrups: '' });
    const [loading, setLoading] = useState(true);

    const menuRef = doc(db, 'cardapio', 'opcoes');

    const handleDataMigration = useCallback(async (data) => {
        let needsUpdate = false;
        const migratedData = { ...data };

        Object.keys(initialMenuData).forEach(key => {
            if (data[key] && data[key].length > 0 && typeof data[key][0] === 'string') {
                needsUpdate = true;
                migratedData[key] = convertToObjects(data[key]);
            }
        });

        if (needsUpdate) {
            console.log("Migrando dados para o novo formato com status...");
            await updateDoc(menuRef, migratedData);
            console.log("Migração concluída!");
        }
    }, [menuRef]);

    useEffect(() => {
        const unsubscribe = onSnapshot(menuRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // A migração é verificada a cada load para garantir a consistência dos dados
                await handleDataMigration(data);
                setMenu(data);
            } else {
                console.log("Documento não encontrado, criando um novo...");
                await setDoc(menuRef, initialMenuData);
                setMenu(initialMenuData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to menu changes:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [handleDataMigration, menuRef]);

    const handleAddItem = async (category) => {
        if (!newItem[category] || !menu) return;
        const itemToAdd = { name: newItem[category], status: 'ativado' };
        try {
            await updateDoc(menuRef, { [category]: arrayUnion(itemToAdd) });
            setNewItem(prev => ({ ...prev, [category]: '' }));
        } catch (error) {
            console.error(`Error adding item to ${category}:`, error);
        }
    };

    const handleRemoveItem = async (category, item) => {
        if (!window.confirm(`Tem certeza que deseja remover "${item.name || item.label}" permanentemente?`) || !menu) return;
        try {
            await updateDoc(menuRef, { [category]: arrayRemove(item) });
        } catch (error) {
            console.error(`Error removing item from ${category}:`, error);
        }
    };

    // CÓDIGO CORRIGIDO: Função de atualização de status mais eficiente
    const handleStatusChange = async (category, itemIdentifier, newStatus) => {
        if (!menu) return;
        
        // Usamos uma cópia para não modificar o estado diretamente
        const categoryClone = [...menu[category]];
        
        // Encontra o índice do item a ser atualizado (funciona para 'name' ou 'label')
        const itemIndex = categoryClone.findIndex(item => (item.name || item.label) === itemIdentifier);

        // Se o item for encontrado, atualiza seu status
        if (itemIndex > -1) {
            categoryClone[itemIndex] = { ...categoryClone[itemIndex], status: newStatus };
            try {
                // Envia a categoria inteira atualizada para o Firestore
                await updateDoc(menuRef, { [category]: categoryClone });
            } catch (error) {
                console.error(`Error updating status in ${category}:`, error);
            }
        }
    };
    
    const getStatusLabel = (status) => {
        switch (status) {
            case 'ativado': return 'Ativado';
            case 'indisponivel': return 'Indisponível';
            case 'desativado': return 'Desativado';
            default: return '';
        }
    };

    const renderCategorySection = (title, category) => (
        <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="flex mb-4">
                <input
                    type="text"
                    value={newItem[category]}
                    onChange={(e) => setNewItem({ ...newItem, [category]: e.target.value })}
                    className="flex-grow p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`Adicionar ${title.slice(0, -1).toLowerCase()}`}
                />
                <button onClick={() => handleAddItem(category)} className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition-colors"><FaPlus /></button>
            </div>
            <ul className="space-y-2">
                {menu[category] && menu[category].map((item, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <span>{item.name || item.label}</span>
                        <div className="flex items-center">
                            <select 
                                value={item.status}
                                onChange={(e) => handleStatusChange(category, item.name || item.label, e.target.value)}
                                className="p-1 border rounded-md text-sm mr-3 bg-white"
                            >
                                <option value="ativado">Ativado</option>
                                <option value="indisponivel">Indisponível</option>
                                <option value="desativado">Desativado</option>
                            </select>
                            <button onClick={() => handleRemoveItem(category, item)} className="text-gray-600 hover:text-red-500 transition-colors"><FaTrash /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
    
    // A seção de tamanhos agora também permite a edição de status
    const renderSizesSection = () => (
        <div className="mb-8 p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-4">Tamanhos</h3>
             <ul className="space-y-2">
                {menu.sizes && menu.sizes.map((size, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <div>
                           <span>{size.label}</span>
                           {size.price && <span className="text-gray-600 ml-2">R$ {size.price.toFixed(2)}</span>}
                        </div>
                        <div className="flex items-center">
                            <select 
                                value={size.status}
                                onChange={(e) => handleStatusChange('sizes', size.label, e.target.value)}
                                className="p-1 border rounded-md text-sm"
                            >
                                <option value="ativado">Ativado</option>
                                <option value="indisponivel">Indisponível</option>
                                <option value="desativado">Desativado</option>
                            </select>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

    if (loading || !menu) {
        return <div className="p-8 text-center">Carregando cardápio...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6">Gerenciar Cardápio</h2>
            {renderCategorySection("Cremes", "creams")}
            {renderCategorySection("Frutas", "fruits")}
            {renderCategorySection("Acompanhamentos", "toppings")}
            {renderCategorySection("Coberturas", "syrups")}
            {renderSizesSection()}
        </div>
    );
};

export default GerenciarCardapio;