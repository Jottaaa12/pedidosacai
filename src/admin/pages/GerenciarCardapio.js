
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const GerenciarCardapio = () => {
    const [menu, setMenu] = useState({
        creams: [],
        fruits: [],
        toppings: [],
        syrups: [],
        sizes: [],
    });
    const [newItem, setNewItem] = useState({
        creams: '',
        fruits: '',
        toppings: '',
        syrups: '',
    });
    const [loading, setLoading] = useState(true);

    const menuRef = doc(db, 'cardapio', 'opcoes');

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const docSnap = await getDoc(menuRef);
                if (docSnap.exists()) {
                    setMenu(docSnap.data());
                } else {
                    console.log("No such document!");
                    // Here you could initialize the document with default values if it doesn't exist
                }
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);

    const handleAddItem = async (category) => {
        if (!newItem[category]) return;
        try {
            await updateDoc(menuRef, {
                [category]: arrayUnion(newItem[category])
            });
            setMenu(prevMenu => ({
                ...prevMenu,
                [category]: [...prevMenu[category], newItem[category]]
            }));
            setNewItem(prev => ({ ...prev, [category]: '' }));
        } catch (error) {
            console.error(`Error adding item to ${category}:`, error);
        }
    };

    const handleRemoveItem = async (category, item) => {
        if (!window.confirm(`Tem certeza que deseja remover "${item}"?`)) return;
        try {
            await updateDoc(menuRef, {
                [category]: arrayRemove(item)
            });
            setMenu(prevMenu => ({
                ...prevMenu,
                [category]: prevMenu[category].filter(i => i !== item)
            }));
        } catch (error) {
            console.error(`Error removing item from ${category}:`, error);
        }
    };

    const handleEditItem = async (category, oldItem) => {
        const newItemValue = prompt(`Editar item:`, oldItem);
        if (newItemValue && newItemValue !== oldItem) {
            try {
                const currentItems = menu[category];
                const itemIndex = currentItems.indexOf(oldItem);
                if (itemIndex > -1) {
                    const updatedItems = [...currentItems];
                    updatedItems[itemIndex] = newItemValue;
                    await updateDoc(menuRef, {
                        [category]: updatedItems
                    });
                    setMenu(prevMenu => ({
                        ...prevMenu,
                        [category]: updatedItems
                    }));
                }
            } catch (error) {
                console.error(`Error editing item in ${category}:`, error);
            }
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
                <button onClick={() => handleAddItem(category)} className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600">
                    <FaPlus />
                </button>
            </div>
            <ul className="space-y-2">
                {menu[category] && menu[category].map((item, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                        <span>{item}</span>
                        <div>
                            <button onClick={() => handleEditItem(category, item)} className="text-gray-600 hover:text-blue-500 mr-2"><FaEdit /></button>
                            <button onClick={() => handleRemoveItem(category, item)} className="text-gray-600 hover:text-red-500"><FaTrash /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
    
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


    if (loading) {
        return <div className="p-8">Carregando cardápio...</div>;
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
