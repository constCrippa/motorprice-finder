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

    const promptText = 'Sos un experto en busqueda de precios de motos EN VENTA en Argentina.\n\n' +
      'Usuario busca: "' + message + '"\n\n' +
      'INSTRUCCIONES:\n' +
      '1. Busca en MercadoLibre Argentina: "site:mercadolibre.com.ar ' + message + ' en venta"\n' +
      '2. Busca en DeMotos: "site:demotos.com.ar ' + message + '"\n' +
      '3. Busca en Facebook Marketplace Argentina\n' +
      '4. Busca en AutoCosmos Argentina\n' +
      '5. Extrae el link DIRECTO de cada anuncio individual\n\n' +
      'FORMATO:\n' +
      'Modelo - Anio - Estado\n' +
      'Precio: $XXXXX ARS\n' +
      'Ubicacion: Ciudad\n' +
      'Link: [URL completa del anuncio]\n\n' +
      'REGLAS:\n' +
      '- Ordena de MENOR a MAYOR precio\n' +
      '- Maximo 6 resultados\n' +
      '- Solo anuncios especificos, no paginas de busqueda\n' +
      '- Si hay error ortografico en la marca, sugiere la correcta\n' +
      '- Marcas validas: Yamaha, Honda, Kawasaki, Suzuki, Zanella, Motomel, Gilera, Bajaj, KTM';

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
