
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
    }, [handleDataMigration]);

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
        if (!window.confirm(`Tem certeza que deseja remover "${item.name}" permanentemente?`) || !menu) return;
        try {
            await updateDoc(menuRef, { [category]: arrayRemove(item) });
        } catch (error) {
            console.error(`Error removing item from ${category}:`, error);
        }
    };

    const handleStatusChange = async (category, itemNameToUpdate, newStatus) => {
        if (!menu) return;
        const updatedCategory = menu[category].map(item => 
            item.name === itemNameToUpdate ? { ...item, status: newStatus } : item
        );
        try {
            await updateDoc(menuRef, { [category]: updatedCategory });
        } catch (error) {
            console.error(`Error updating status in ${category}:`, error);
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
        <div className="mb-8 p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="flex mb-4">
                <input
                    type="text"
                    value={newItem[category]}
                    onChange={(e) => setNewItem({ ...newItem, [category]: e.target.value })}
                    className="flex-grow p-2 border rounded-l-md"
                    placeholder={`Adicionar ${title.slice(0, -1).toLowerCase()}`}
                />
                <button onClick={() => handleAddItem(category)} className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"><FaPlus /></button>
            </div>
            <ul className="space-y-2">
                {menu[category] && menu[category].map((item, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <span>{item.name}</span>
                        <div className="flex items-center">
                            <select 
                                value={item.status}
                                onChange={(e) => handleStatusChange(category, item.name, e.target.value)}
                                className="p-1 border rounded-md text-sm mr-3"
                            >
                                <option value="ativado">Ativado</option>
                                <option value="indisponivel">Indisponível</option>
                                <option value="desativado">Desativado</option>
                            </select>
                            <button onClick={() => handleRemoveItem(category, item)} className="text-gray-600 hover:text-red-500"><FaTrash /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
    
    // A seção de tamanhos por enquanto não terá o gerenciamento de status
    const renderSizesSection = () => (
        <div className="mb-8 p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Tamanhos</h3>
            <p className="text-sm text-gray-500 mb-4">A edição de tamanhos e preços não está disponível nesta versão.</p>
            <ul className="space-y-2">
                {menu.sizes && menu.sizes.map((size, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <span>{size.label}</span>
                        <span>R$ {size.price ? size.price.toFixed(2) : 'N/A'}</span>
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
