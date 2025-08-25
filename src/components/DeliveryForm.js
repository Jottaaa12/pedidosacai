import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { COLLEGES } from '../services/menu';

const DeliveryForm = () => {
    const { state, dispatch, showToast } = useContext(AppContext);
    const [deliveryData, setDeliveryData] = useState(state.delivery || {
        college: '', block: '', room: '', ufdparDetails: '', otherDetails: '', time: '', date: ''
    });

    const isAfterCutOff = () => new Date().getHours() >= 14 && new Date().getMinutes() >= 30;

    useEffect(() => {
        if (isAfterCutOff() && !deliveryData.date) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDeliveryData(prev => ({ ...prev, date: tomorrow.toISOString().split('T')[0] }));
        }
    }, [deliveryData.date]);

    const isValidDelivery = () => {
        if (!deliveryData.college) return false;
        switch (deliveryData.college) {
            case 'UNINASSAU': return deliveryData.block && deliveryData.room;
            case 'UFDPAR': return deliveryData.ufdparDetails;
            case 'ONIBUS BITU': return true;
            case 'OUTRA': return deliveryData.otherDetails;
            default: return false;
        }
    };

    const handleNext = () => {
        if (!isValidDelivery() || (isAfterCutOff() ? !deliveryData.date : !deliveryData.time)) {
            showToast('Complete todos os campos');
            return;
        }
        dispatch({ type: 'SET_DELIVERY', payload: deliveryData });
        dispatch({ type: 'NEXT_STEP' });
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">📍 Local e Horário</h2>
            {isAfterCutOff() && <p className="bg-yellow-100 p-2 rounded text-sm mb-4">Pedidos para hoje encerrados! Seu pedido será agendado.</p>}
            <select name="college" value={deliveryData.college} onChange={(e) => setDeliveryData({...deliveryData, college: e.target.value})} className="w-full p-3 border rounded-lg mb-4">
                <option value="">Selecione o Local</option>
                {COLLEGES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {deliveryData.college === 'UNINASSAU' && <div className="space-y-4 mb-4"><input type="text" name="block" value={deliveryData.block} onChange={(e) => setDeliveryData({...deliveryData, block: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Bloco"/><input type="text" name="room" value={deliveryData.room} onChange={(e) => setDeliveryData({...deliveryData, room: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Sala"/></div>}
            {deliveryData.college === 'UFDPAR' && <input type="text" name="ufdparDetails" value={deliveryData.ufdparDetails} onChange={(e) => setDeliveryData({...deliveryData, ufdparDetails: e.target.value})} className="w-full p-3 mb-4 border rounded-lg" placeholder="Detalhe onde receber"/>}
            {deliveryData.college === 'OUTRA' && <input type="text" name="otherDetails" value={deliveryData.otherDetails} onChange={(e) => setDeliveryData({...deliveryData, otherDetails: e.target.value})} className="w-full p-3 mb-4 border rounded-lg" placeholder="Qual faculdade e local?"/>}
            {!isAfterCutOff() ? <select name="time" value={deliveryData.time} onChange={(e) => setDeliveryData({...deliveryData, time: e.target.value})} className="w-full p-3 border rounded-lg"><option value="">Selecione o horário</option>{["18h00", "19h00", "20h00", "21h00"].map(t => <option key={t} value={t}>{t}</option>)}</select> : <input type="date" name="date" value={deliveryData.date} onChange={(e) => setDeliveryData({...deliveryData, date: e.target.value})} className="w-full p-3 border rounded-lg"/>}
            <div className="flex gap-3 mt-4"><button onClick={() => dispatch({ type: 'PREV_STEP' })} className="flex-1 py-3 border rounded-lg">Voltar</button><button onClick={handleNext} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Próximo</button></div>
        </div>
    );
};

export default DeliveryForm;