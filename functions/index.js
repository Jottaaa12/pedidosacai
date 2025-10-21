const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

const db = admin.firestore();

exports.salvarPedido = functions.https.onRequest((req, res) => {
  // Envolve a lógica da função com o middleware do CORS
  cors(req, res, async () => {
    // Permite apenas requisições POST
    if (req.method !== "POST") {
      return res.status(405).json(
          {success: false, error: "Method Not Allowed"},
      );
    }

    try {
      const orderData = req.body;

      // Adiciona o timestamp do servidor no backend
      const orderWithTimestamp = {
        ...orderData,
        dataDoPedido: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Salva o pedido na coleção 'pedidos'
      const docRef = await db.collection("pedidos").add(orderWithTimestamp);

      // Retorna uma resposta de sucesso com o ID do documento
      return res.status(200).json({success: true, id: docRef.id});
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      // Retorna uma resposta de erro
      return res.status(500).json(
          {success: false, error: "Internal Server Error"},
      );
    }
  });
});
