/* 
 * Este script é para ser executado uma única vez para popular o Firestore com os dados iniciais do cardápio. 
 * Certifique-se de ter as dependências do Firebase instaladas e a configuração do seu projeto Firebase correta. 
 * 
 * Como executar (exemplo): 
 * 1. Instale o Node.js se ainda não tiver. 
 * 2. Instale as dependências do projeto: npm install 
 * 3. Execute este script a partir da raiz do projeto: node scripts/initFirestore.js 
 */

import { db } from '../src/services/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { SIZES, CREAMS, TOPPINGS, FRUITS, SYRUPS } from '../src/services/menu.js';

const initFirestore = async () => {
    console.log("Iniciando a migração do cardápio para o Firestore...");

    const menuData = {
        sizes: SIZES,
        creams: CREAMS,
        toppings: TOPPINGS,
        fruits: FRUITS,
        syrups: SYRUPS,
    };

    try {
        const menuRef = doc(db, 'cardapio', 'opcoes');
        await setDoc(menuRef, menuData);
        console.log("\n-----------------------------------------------------------------");
        console.log("✅ Sucesso! O documento 'cardapio/opcoes' foi criado/atualizado.");
        console.log("-----------------------------------------------------------------");
    } catch (error) {
        console.error("\n❌ Erro ao escrever dados no Firestore:", error);
        console.log("\nPor favor, verifique suas credenciais e regras de segurança do Firebase.");
    }
};

initFirestore();
