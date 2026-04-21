const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  try {
    const message = req.body.message;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key no configurada' });
    }

    console.log('Buscando:', message);

    const promptText = 'Busca motos 0KM (NUEVAS, nunca usadas) de "' + message + '" en Argentina.\n\n' +
      'PRIORIDAD DE SITIOS:\n' +
      '1. PRIORITARIO: cycles.com.ar o cycles.com (mostrar PRIMERO sus resultados)\n' +
      '2. MercadoLibre Argentina (solo anuncios 0KM)\n' +
      '3. DeMotos.com.ar (solo 0KM)\n' +
      '4. Concesionarias oficiales\n\n' +
      'REGLAS:\n' +
      '- SOLO motos 0KM (nuevas, sin uso)\n' +
      '- DESCARTAR cualquier moto usada\n' +
      '- Links DIRECTOS al producto (MercadoLibre: con MLA-XXXXX)\n\n' +
      'FORMATO:\n' +
      'Sitio: [nombre del sitio]\n' +
      'Modelo - 0KM\n' +
      'Precio: $XXX ARS\n' +
      'Link: [URL directa]\n\n' +
      'AL FINAL incluye:\n' +
      '=== COMPARACION DE PRECIOS ===\n' +
      'Precio mas bajo: $XXX en [sitio]\n' +
      'Precio mas alto: $XXX en [sitio]\n' +
      'Diferencia: $XXX (X%)\n' +
      'Recomendacion: [mejor opcion y por que]\n\n' +
      'Ordena de menor a mayor precio. Maximo 6 resultados.';

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-7',
      max_tokens: 2048,
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
    const errorData = error.response && error.response.data;
    console.error('Error:', errorData || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: JSON.stringify(errorData)
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, function() {
  console.log('Servidor en puerto ' + PORT);
});
