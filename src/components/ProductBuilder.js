import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SIZES, CREAMS, TOPPINGS, FRUITS, SYRUPS } from '../services/menu';

const ProductBuilder = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const { currentAcai } = state;

  const updateCurrentAcai = (updatedAcai) => {
    dispatch({ type: 'UPDATE_CURRENT_ACAI', payload: updatedAcai });
  };

  const handleItemToggle = (category, item) => {
    const maxLimits = { creams: 2, fruits: 2 };
    const currentList = currentAcai[category];

    if (currentList.includes(item)) {
      updateCurrentAcai({ ...currentAcai, [category]: currentList.filter(i => i !== item) });
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
    finalAcai.additionalToppingCost = Math.max(0, currentAcai.toppings.length - 4) * 1.00;
    dispatch({ type: 'ADD_TO_CART', payload: finalAcai });
    dispatch({ type: 'SHOW_CART_MODAL' });
    dispatch({ type: 'RESET_CURRENT_ACAI' });
  };
  
  const surpriseMe = () => {
    const selected = [...TOPPINGS].sort(() => 0.5 - Math.random()).slice(0, 4);
    updateCurrentAcai({ ...currentAcai, toppings: selected });
    showToast('Combo surpresa selecionado! 🎲');
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 2: // Size
        return (
          <>
            <h2 className="text-xl font-semibold text-primary mb-4">📦 Escolha o tamanho</h2>
            <div className="space-y-3 mb-6">
              {SIZES.map((size, index) => (
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
              {CREAMS.map((cream) => (
                <label key={cream} className={`flex items-center p-3 border rounded-lg cursor-pointer ${currentAcai.creams.includes(cream) ? 'border-primary bg-purple-50' : ''}`}>
                  <input type="checkbox" checked={currentAcai.creams.includes(cream)} onChange={() => handleItemToggle('creams', cream)} className="mr-3"/>{cream}
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
                {TOPPINGS.map((topping) => (
                  <label key={topping} className={`flex items-center p-3 border rounded-lg ${currentAcai.toppings.includes(topping) ? 'border-primary bg-purple-50' : ''}`}>
                    <input type="checkbox" checked={currentAcai.toppings.includes(topping)} onChange={() => handleItemToggle('toppings', topping)} className="mr-3"/>{topping}
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
                  {FRUITS.map((fruit) => (
                      <label key={fruit} className={`flex items-center p-3 border rounded-lg ${currentAcai.fruits.includes(fruit) ? 'border-primary bg-purple-50' : ''}`}>
                          <input type="checkbox" checked={currentAcai.fruits.includes(fruit)} onChange={() => handleItemToggle('fruits', fruit)} className="mr-3"/>{fruit}
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
                {SYRUPS.map((syrup) => (
                    <label key={syrup} className={`flex items-center p-3 border rounded-lg mb-2 ${currentAcai.syrup === syrup ? 'border-primary bg-purple-50' : ''}`}>
                        <input type="radio" name="syrup" checked={currentAcai.syrup === syrup} onChange={() => updateCurrentAcai({ ...currentAcai, syrup })} className="mr-3"/>{syrup}
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