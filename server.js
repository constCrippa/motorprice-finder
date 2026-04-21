const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API key no configurada' 
      });
    }

    console.log('Buscando:', message);

    const promptText = 'Sos un asistente de busqueda de precios de motos en Argentina. Usuario pregunta: "' + message + '". Busca en MercadoLibre Argentina y OLX. Ordena de menor a mayor precio. Incluye links completos.';

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages: [{ role: 'user', content: promptText }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    const data = response.data;
    let assistantMessage = '';
    
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        }
      }
    }

    res.json({ message: assistantMessage || 'No encontre informacion.' });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      return res.status(error.response.status).json({
        error: JSON.stringify(error.response.data)
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Servidor en puerto ' + PORT);
});
