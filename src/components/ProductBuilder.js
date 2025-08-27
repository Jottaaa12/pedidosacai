import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const ProductBuilder = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const { currentAcai } = state;
  const [menuOptions, setMenuOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const menuRef = doc(db, 'cardapio', 'opcoes');
    
    const unsubscribe = onSnapshot(menuRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Processa os dados para garantir que estão no formato de objeto com status
        const processedData = {};
        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
                // Se for um array de strings (formato antigo), converte para objetos
                if (data[key].length > 0 && typeof data[key][0] === 'string') {
                    processedData[key] = data[key].map(item => ({ name: item, status: 'ativado' }));
                } else {
                    // Se já for array de objetos, garante que tem status ou adiciona 'ativado'
                    processedData[key] = data[key].map(item => 
                        (typeof item === 'object' && item !== null && item.name) 
                            ? { ...item, status: item.status || 'ativado' } 
                            : { name: item, status: 'ativado' } // Caso algum item seja string solta
                    );
                }
            } else {
                processedData[key] = data[key];
            }
        });
        setMenuOptions(processedData);
      } else {
        console.log("No menu data found in Firestore!");
        // O documento é criado no painel de admin, então aqui só precisamos aguardar.
        setMenuOptions({ sizes: [], creams: [], toppings: [], fruits: [], syrups: [] });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu with snapshot:", error);
      setLoading(false);
    });

    // Cleanup: parar de ouvir quando o componente for desmontado
    return () => unsubscribe();
  }, []);

  const updateCurrentAcai = (updatedAcai) => {
    dispatch({ type: 'UPDATE_CURRENT_ACAI', payload: updatedAcai });
  };

  const handleItemToggle = (category, item) => {
    // Impede seleção de itens indisponíveis
    if (item.status === 'indisponivel') {
        showToast(`${item.name} está indisponível.`);
        return;
    }

    const maxLimits = { creams: 2, fruits: 2 };
    const currentList = currentAcai[category];

    // Verifica se o item já está na lista (para remover)
    if (currentList.some(selectedItem => selectedItem.name === item.name)) {
      updateCurrentAcai({ ...currentAcai, [category]: currentList.filter(selectedItem => selectedItem.name !== item.name) });
    } else {
      // Verifica limites para adicionar
      const limit = maxLimits[category];
      if (limit && currentList.length >= limit) {
        showToast(`Máximo ${limit} ${category === 'creams' ? 'cremes' : 'frutas'}`);
        return;
      }
      updateCurrentAcai({ ...currentAcai, [category]: [...currentList, item] });
    }
  };

  const addToCart = () => {
    if (!currentAcai.size) { showToast('Selecione um tamanho'); return; }
    let finalAcai = { ...currentAcai };
    if (currentAcai.size.type === 'custom') {
      const customPrice = parseFloat(currentAcai.customPrice);
      if (isNaN(customPrice) || customPrice < 26 || customPrice > 50) { showToast('Valor entre R$ 26 e R$ 50'); return; }
      finalAcai.size = { label: `Valor de R$ ${customPrice.toFixed(2)}`, price: customPrice };
    }
    // Garante que os acompanhamentos no carrinho são objetos com name e status
    finalAcai.toppings = finalAcai.toppings.map(topping => 
        (typeof topping === 'object' && topping !== null && topping.name) ? topping : { name: topping, status: 'ativado' }
    );
    finalAcai.additionalToppingCost = Math.max(0, finalAcai.toppings.length - 4) * 1.00;
    dispatch({ type: 'ADD_TO_CART', payload: finalAcai });
    dispatch({ type: 'SHOW_CART_MODAL' });
    dispatch({ type: 'RESET_CURRENT_ACAI' });
  };
  
  const surpriseMe = () => {
    // Filtra apenas os acompanhamentos ativados para a surpresa
    const availableToppings = menuOptions.toppings.filter(item => item.status === 'ativado');
    const selected = [...availableToppings].sort(() => 0.5 - Math.random()).slice(0, 4);
    updateCurrentAcai({ ...currentAcai, toppings: selected });
    showToast('Combo surpresa selecionado! 🎲');
  };

  if (loading || !menuOptions) {
    return <div className="p-6 text-center">Carregando opções do cardápio...</div>;
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 2: // Size
        return (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">📦 Escolha o tamanho</h2>
            <div className="space-y-3 mb-6">
              {menuOptions.sizes.map((size, index) => (
                <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer ${currentAcai.size?.label === size.label ? 'border-primary bg-purple-50' : ''}`}>
                  <input type="radio" name="size" checked={currentAcai.size?.label === size.label} onChange={() => updateCurrentAcai({ ...currentAcai, size })} className="mr-3"/>{size.label}
                </label>
              ))}
            </div>
            {currentAcai.size?.type === 'custom' && (
              <input type="number" min="26" max="50" value={currentAcai.customPrice} onChange={(e) => updateCurrentAcai({ ...currentAcai, customPrice: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Qual valor (R$ 26 a R$ 50)?"/>
            )}
          </>
        );
      case 3: // Creams
        return (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">🍦 Cremes (até 2)</h2>
            <div className="space-y-3 mb-6">
              {menuOptions.creams.filter(item => item.status !== 'desativado').map((cream) => (
                <label 
                    key={cream.name} 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer 
                        ${currentAcai.creams.some(selectedCream => selectedCream.name === cream.name) ? 'border-primary bg-purple-50' : ''} 
                        ${cream.status === 'indisponivel' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={currentAcai.creams.some(selectedCream => selectedCream.name === cream.name)} 
                    onChange={() => handleItemToggle('creams', cream)} 
                    className="mr-3"
                    disabled={cream.status === 'indisponivel'}
                  />
                  {cream.name} {cream.status === 'indisponivel' && '(Indisponível)'}
                </label>
              ))}
            </div>
          </>
        );
      case 4: // Toppings
          const extraToppings = Math.max(0, currentAcai.toppings.length - 4);
          return (
            <>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-primary">🥣 Acompanhamentos</h2>
                <button onClick={surpriseMe} className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full">✨ Surpreenda-me!</button>
              </div>
              <p className="text-center text-sm mb-4">{extraToppings > 0 ? `Adicionais: ${extraToppings} (R$ ${extraToppings.toFixed(2)})` : `Você tem ${4 - currentAcai.toppings.length} grátis.`}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {menuOptions.toppings.filter(item => item.status !== 'desativado').map((topping) => (
                  <label 
                    key={topping.name} 
                    className={`flex items-center p-3 border rounded-lg 
                        ${currentAcai.toppings.some(selectedTopping => selectedTopping.name === topping.name) ? 'border-primary bg-purple-50' : ''} 
                        ${topping.status === 'indisponivel' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input 
                        type="checkbox" 
                        checked={currentAcai.toppings.some(selectedTopping => selectedTopping.name === topping.name)} 
                        onChange={() => handleItemToggle('toppings', topping)} 
                        className="mr-3"
                        disabled={topping.status === 'indisponivel'}
                    />
                    {topping.name} {topping.status === 'indisponivel' && '(Indisponível)'}
                  </label>
                ))}
              </div>
            </>
          );
      case 5: // Fruits
        return (
            <>
              <h2 className="text-xl font-semibold text-primary mb-4">🍓 Frutas (até 2)</h2>
              <div className="space-y-3 mb-4">
                  {menuOptions.fruits.filter(item => item.status !== 'desativado').map((fruit) => (
                      <label 
                        key={fruit.name} 
                        className={`flex items-center p-3 border rounded-lg 
                            ${currentAcai.fruits.some(selectedFruit => selectedFruit.name === fruit.name) ? 'border-primary bg-purple-50' : ''} 
                            ${fruit.status === 'indisponivel' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                          <input 
                            type="checkbox" 
                            checked={currentAcai.fruits.some(selectedFruit => selectedFruit.name === fruit.name)} 
                            onChange={() => handleItemToggle('fruits', fruit)} 
                            className="mr-3"
                            disabled={fruit.status === 'indisponivel'}
                          />
                          {fruit.name} {fruit.status === 'indisponivel' && '(Indisponível)'}
                      </label>
                  ))}
              </div>
            </>
        );
      case 6: // Final Touches
        return (
            <>
              <h2 className="text-xl font-semibold text-primary mb-4">✨ Toques Finais</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Cobertura</label>
                {menuOptions.syrups.filter(item => item.status !== 'desativado').map((syrup) => (
                    <label 
                        key={syrup.name} 
                        className={`flex items-center p-3 border rounded-lg mb-2 
                            ${currentAcai.syrup?.name === syrup.name ? 'border-primary bg-purple-50' : ''} 
                            ${syrup.status === 'indisponivel' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input 
                            type="radio" 
                            name="syrup" 
                            checked={currentAcai.syrup?.name === syrup.name} 
                            onChange={() => updateCurrentAcai({ ...currentAcai, syrup })} 
                            className="mr-3"
                            disabled={syrup.status === 'indisponivel'}
                        />
                        {syrup.name} {syrup.status === 'indisponivel' && '(Indisponível)'}
                    </label>
                ))}
              </div>
              <textarea value={currentAcai.notes} onChange={(e) => updateCurrentAcai({ ...currentAcai, notes: e.target.value })} className="w-full p-3 border rounded-lg" rows="3" placeholder="Observações (opcional)"/>
            </>
        );
      default: return null;
    }
  };

  return (
    <div className="p-6">
      {renderStep()}
      <div className="flex gap-3 mt-6">
        <button onClick={() => dispatch({ type: 'PREV_STEP' })} className="flex-1 py-3 border rounded-lg">Voltar</button>
        {state.currentStep < 6 ? (
          <button onClick={() => dispatch({ type: 'NEXT_STEP' })} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Próximo</button>
        ) : (
          <button onClick={addToCart} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Adicionar ao Pedido</button>
        )}
      </div>
    </div>
  );
};

export default ProductBuilder;