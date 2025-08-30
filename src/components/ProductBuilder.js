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
        const processedData = {};
        Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
                if (key === 'sizes') {
                    processedData[key] = data[key].map(item => ({
                        ...item,
                        status: item.status || 'ativado'
                    }));
                } else {
                    processedData[key] = data[key].map(item => {
                        if (typeof item === 'string') {
                            return { name: item, status: 'ativado' };
                        }
                        if (typeof item === 'object' && item !== null && item.name) {
                            return { ...item, status: item.status || 'ativado' };
                        }
                        return item;
                    });
                }
            } else {
                processedData[key] = data[key];
            }
        });
        setMenuOptions(processedData);
      } else {
        console.log("No menu data found in Firestore!");
        setMenuOptions({ sizes: [], creams: [], toppings: [], fruits: [], syrups: [] });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu with snapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateCurrentAcai = (updatedAcai) => {
    dispatch({ type: 'UPDATE_CURRENT_ACAI', payload: updatedAcai });
  };

  const handleItemToggle = (category, item) => {
    if (item.status === 'indisponivel') {
        showToast(`${item.name} está indisponível.`);
        return;
    }

    const maxLimits = { creams: 2, fruits: 2 };
    const currentList = currentAcai[category];

    if (currentList.some(selectedItem => selectedItem.name === item.name)) {
      updateCurrentAcai({ ...currentAcai, [category]: currentList.filter(selectedItem => selectedItem.name !== item.name) });
    } else {
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
    finalAcai.toppings = finalAcai.toppings.map(topping => 
        (typeof topping === 'object' && topping !== null && topping.name) ? topping : { name: topping, status: 'ativado' }
    );
    finalAcai.additionalToppingCost = Math.max(0, finalAcai.toppings.length - 3) * 2.00;
    dispatch({ type: 'ADD_TO_CART', payload: finalAcai });
    dispatch({ type: 'SHOW_CART_MODAL' });
    dispatch({ type: 'RESET_CURRENT_ACAI' });
  };
  
  const surpriseMe = () => {
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
              {menuOptions.sizes.filter(item => item.status !== 'desativado').map((size, index) => (
                <label 
                    key={index} 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer 
                        ${(currentAcai.size?.label || currentAcai.size?.name) === (size.label || size.name) ? 'border-primary bg-purple-50' : ''}
                        ${size.status === 'indisponivel' ? 'opacity-50 cursor-not-allowed' : ''}`
                    }
                >
                  <input 
                    type="radio" 
                    name="size" 
                    checked={(currentAcai.size?.label || currentAcai.size?.name) === (size.label || size.name)} 
                    onChange={() => updateCurrentAcai({ ...currentAcai, size })} 
                    className="mr-3"
                    disabled={size.status === 'indisponivel'}
                  />
                  {/* CORREÇÃO APLICADA ABAIXO */}
                  {size.label || size.name} {size.price ? ` - R$ ${size.price.toFixed(2)}` : ''} {size.status === 'indisponivel' && '(Indisponível)'}
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
        const FREE_TOPPINGS_LIMIT = 3;
        const ADDITIONAL_TOPPING_COST = 2.00;
        const selectedToppingsCount = currentAcai.toppings.length;
        const extraToppings = Math.max(0, selectedToppingsCount - FREE_TOPPINGS_LIMIT);

        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-primary">🥣 Acompanhamentos</h2>
              <button onClick={surpriseMe} className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full">✨ Surpreenda-me!</button>
            </div>
            
            <p className="text-center text-sm text-gray-600 mb-4">Escolha seus 3 acompanhamentos grátis.</p>

            {/* Visual Slots for Free Toppings */}
            <div className="flex justify-center space-x-2 mb-4">
              {Array.from({ length: FREE_TOPPINGS_LIMIT }).map((_, index) => {
                const topping = currentAcai.toppings[index];
                return (
                  <div 
                    key={index}
                    className={`h-10 w-24 flex items-center justify-center text-xs text-center p-1 rounded-lg transition-all duration-300 
                      ${topping ? 'bg-primary text-white font-semibold' : 'bg-gray-200 border-2 border-dashed'}`
                    }
                  >
                    {topping ? topping.name : `Opção ${index + 1}`}
                  </div>
                );
              })}
            </div>

            {extraToppings > 0 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-md my-4 text-center">
                <p className="font-bold">Atenção: Acompanhamentos Adicionais</p>
                <p>Você selecionou {extraToppings} acompanhamento(s) extra(s).</p>
                <p>Custo adicional: <strong>R$ {extraToppings * ADDITIONAL_TOPPING_COST},00</strong></p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {menuOptions.toppings.filter(item => item.status !== 'desativado').map((topping) => (
                <label 
                  key={topping.name} 
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors 
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
        <button onClick={() => dispatch({ type: 'PREV_STEP' })} className="flex-1 py-3 border rounded-lg transition-colors hover:bg-gray-100 hover:border-gray-400">Voltar</button>
        {state.currentStep < 6 ? (
          <button onClick={() => dispatch({ type: 'NEXT_STEP' })} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110">Próximo</button>
        ) : (
          <button onClick={addToCart} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110">Adicionar ao Pedido</button>
        )}
      </div>
    </div>
  );
};

export default ProductBuilder;