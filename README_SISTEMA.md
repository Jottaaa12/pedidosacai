# 🍧 Sistema de Pedidos de Açaí - Sabor da Terra

Sistema completo de pedidos de açaí desenvolvido em React.js com Firebase, Tailwind CSS e integração com WhatsApp e Pix.

## 🚀 Funcionalidades

### 🔐 Autenticação
- Login via SMS com Firebase Auth
- Pedido rápido sem login
- Painel administrativo para gerenciamento
- Histórico de pedidos para usuários logados

### 🥣 Construção do Açaí
- Seleção de tamanhos (300g a 500g ou valor customizado)
- Escolha de até 2 cremes
- Seleção de acompanhamentos (4 grátis, R$ 1,00 por extra)
- Escolha de até 2 frutas
- Opções de cobertura
- Campo para observações especiais

### 📍 Entrega Inteligente
- Lógica de horários automática (antes/depois das 14:30)
- Locais pré-configurados (UNINASSAU, UFDPAR, Ônibus Bitu, Outras)
- Campos condicionais baseados na seleção
- Agendamento para dias futuros

### 💳 Pagamento
- Pix com QR Code dinâmico gerado automaticamente
- Dinheiro com campo de troco
- Cartão de crédito (+3,40%)
- Cartão de débito (+1,40%)

### 📱 Integração WhatsApp
- Geração automática de resumo formatado
- Envio direto para WhatsApp
- Salvamento no Firestore

### 👨‍💼 Painel Administrativo
- Visualização de pedidos em tempo real
- Atualização de status dos pedidos
- Acesso exclusivo para administrador

## 🛠️ Tecnologias Utilizadas

- **React.js 18** - Interface do usuário
- **Firebase v10** - Autenticação e banco de dados
- **Tailwind CSS** - Estilização
- **QRCode.js** - Geração de QR Codes Pix
- **Firestore** - Banco de dados NoSQL

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd "pedidos açai"
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o Firebase**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   - Ative Authentication (Phone) e Firestore
   - Configure as regras do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pedidos/{document} {
      allow read, write: if request.auth != null;
      allow create: if true;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **Atualize a configuração do Firebase**
   - Substitua as credenciais em `src/App.js` no objeto `firebaseConfig`

5. **Inicie a aplicação**
```bash
npm start
```

## 🔧 Configuração

### Dados do Cardápio
Todos os dados do cardápio (tamanhos, cremes, acompanhamentos, etc.) estão definidos como constantes no início do arquivo `src/App.js` e podem ser facilmente modificados.

### Números de Telefone
- **WhatsApp**: Definido na constante `WHATSAPP_NUMBER`
- **Administrador**: Definido na constante `ADMIN_PHONE`

### Dados do PIX
Os dados para geração do QR Code PIX estão na função `generateBrCode()`:
- Chave: +5588981905006
- Nome: JOAO PEDRO CARVALHO TORRE  
- Cidade: BARROQUINHA

## 📱 Como Usar

### Para Clientes
1. **Acesse a aplicação**
2. **Faça login** com seu telefone ou use o pedido rápido
3. **Monte seu açaí** seguindo as etapas
4. **Escolha local e horário** de entrega
5. **Selecione o pagamento**
6. **Confirme e envie** via WhatsApp

### Para Administradores
1. **Faça login** com o número +5588981905006
2. **Acesse o painel** de gerenciamento
3. **Visualize pedidos** em tempo real
4. **Atualize status** dos pedidos

## 🎯 Fluxo de Pedido

```
Login/Pedido Rápido → Tamanho → Cremes → Acompanhamentos → 
Frutas → Cobertura → Entrega → Pagamento → Resumo → WhatsApp
```

## 🔒 Regras de Negócio

- **Cremes**: Máximo 2 por copo
- **Acompanhamentos**: 4 grátis, R$ 1,00 por adicional
- **Frutas**: Máximo 2 por copo
- **Horário**: Pedidos para o mesmo dia até 14:30
- **Valores customizados**: Entre R$ 26,00 e R$ 50,00

## 🎨 Design

Interface moderna e responsiva com:
- Cores primárias: #4A00E0 e #8E2DE2
- Font: Poppins
- Design mobile-first
- Animações suaves
- UX otimizada

## 📄 Estrutura do Projeto

```
src/
├── App.js          # Aplicação principal (componente único)
├── index.js        # Ponto de entrada
└── index.css       # Estilos base + Tailwind

public/
├── index.html      # HTML principal
└── ...

Arquivos de config:
├── package.json           # Dependências
├── tailwind.config.js     # Config Tailwind
├── postcss.config.js      # Config PostCSS
└── README.md             # Documentação
```

## 🚀 Deploy

### Netlify/Vercel
```bash
npm run build
# Upload da pasta build/
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🤝 Suporte

Sistema desenvolvido por [@jottaaa0](https://instagram.com/jottaaa0)

Para dúvidas ou suporte, entre em contato via Instagram.

## 📝 Licença

Este projeto foi desenvolvido especificamente para a Açaiteria Sabor da Terra.