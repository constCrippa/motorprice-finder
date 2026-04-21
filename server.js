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

    console.log('📤 Buscando:', message);

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: 'Sos un asistente especializado en búsqueda de precios de motos EN VENTA en Argentina. El usuario pregunta: "' + message + '"\n\nPASO 1 - VERIFICACIÓN ORTOGRÁFICA:\nAntes de buscar, verifica si hay errores ortográficos en marcas de motos.\nMarcas: Yamaha, Honda, Kawasaki, Suzuki, Zanella, Motomel, Gilera, Bajaj, KTM, Benelli, Corven, Beta\n\nSi detectas error, responde: "¿Te referís a [MARCA CORRECTA]?"\n\nPASO 2 - BÚSQUEDA EN TIEMPO REAL:\nUsa web_search para buscar precios ACTUALES:\n1. OBLIGATORIO: Buscar "MercadoLibre Argentina ' + message + '"\n2. OBLIGATORIO: Buscar "site:mercadolibre.com.ar ' + message + '"\n3. Buscar: OLX Argentina, DeMotos Argentina\n4. SOLO motos EN VENTA (no noticias)\n5. SOLO Argentina (.com.ar)\n6. Ordenar de MENOR a MAYOR precio\n\nFORMATO:\n🏍️ **[Modelo]** - [Año] - [0KM/Usada]\n💰 **Precio: $[precio] ARS**\n📍 **Ubicación:** [Ciudad]\n🔗 **Ver en:** [LINK COMPLETO de MercadoLibre/OLX]\n\nIMPORTANTE:\n- Ordena SIEMPRE de menor a mayor precio\n- Muestra hasta 8 resultados\n- SIEMPRE incluye el link completo del anuncio\n- Explica diferencias de precio'
        }
      ],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search'
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
      message: assistantMessage || 'No encontré información.'
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
  console.log(`🤖 Claude Opus 4.7`);
  console.log(`🔑 API: ${process.env.ANTHROPIC_API_KEY ? 'OK ✅' : 'FALTA ❌'}`);
});
