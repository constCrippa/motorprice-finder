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
        error: 'API key no configurada en Render' 
      });
    }

    console.log('📤 Buscando precios de:', message);

    // Usar Claude Opus 4.7 que SÍ está disponible para tu cuenta
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Sos un asistente especializado en búsqueda de precios de motos EN VENTA en Argentina. El usuario pregunta: "${message}"

INSTRUCCIONES:
1. Buscá información sobre motos en venta en Argentina
2. Enfocate en MercadoLibre Argentina, OLX, DeMotos
3. Ordená los resultados de MENOR a MAYOR precio
4. Solo mostrá motos EN VENTA (no noticias ni reviews)

FORMATO:
🏍️ **[Modelo]** - [Año] - [Estado]
💰 **Precio: $[precio] ARS**
📍 **Ubicación:** [Ciudad]
🔗 **Ver en:** [Sitio web]

Ordená siempre de menor a mayor precio.`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    console.log('✅ Respuesta recibida');

    const data = response.data;
    let assistantMessage = '';
    
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        }
      }
    }

    res.json({
      message: assistantMessage || 'No encontré información sobre esa moto.'
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: JSON.stringify(error.response.data)
      });
    }
    
    res.status(500).json({
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🤖 Usando Claude Opus 4.7`);
  console.log(`🔑 API key: ${process.env.ANTHROPIC_API_KEY ? 'OK ✅' : 'FALTA ❌'}`);
});
