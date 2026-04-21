const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API key no configurada' 
      });
    }

    console.log('Buscando:', message);

    const promptText = 'Sos un experto en busqueda de precios de motos EN VENTA en Argentina.\n\n' +
      'Usuario busca: "' + message + '"\n\n' +
      'INSTRUCCIONES DE BUSQUEDA:\n' +
      '1. Usa web_search para buscar: "site:mercadolibre.com.ar ' + message + ' en venta"\n' +
      '2. Busca ANUNCIOS ESPECIFICOS de motos en venta, NO paginas de busqueda generales\n' +
      '3. Busca tambien en OLX: "site:olx.com.ar ' + message + '"\n' +
      '4. EXTRAE el link DIRECTO de cada anuncio individual\n' +
      '5. VERIFICA que cada link sea de un anuncio especifico, no una pagina de resultados\n\n' +
      'FORMATO DE CADA RESULTADO:\n' +
      'Modelo - Anio - Estado - KM\n' +
      'Precio: $XXXXX ARS\n' +
      'Ubicacion: Ciudad\n' +
      'Link: [URL COMPLETA Y EXACTA del anuncio]\n\n' +
      'IMPORTANTE:\n' +
      '- Ordena de MENOR a MAYOR precio\n' +
      '- Muestra hasta 6 resultados\n' +
      '- Cada link debe ser DIRECTO al anuncio (ej: mercadolibre.com.ar/MLA-123456...)\n' +
      '- NO incluyas links de busqueda (sin "/_Desde_" ni parametros de busqueda)\n' +
      '- Si encuentras error en nombre de marca, sugiere la correcta\n' +
      '- Verifica ortografia: Yamaha, Honda, Kawasaki, Suzuki, Zanella, etc';

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
