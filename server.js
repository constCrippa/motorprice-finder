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

PASO 1 - VERIFICACIÓN ORTOGRÁFICA:
Antes de buscar, verificá si hay errores ortográficos en marcas de motos. Marcas comunes:
- Yamaha, Honda, Kawasaki, Suzuki, Zanella, Motomel, Gilera, Bajaj, KTM, Benelli, Corven, Beta

Si detectás error ortográfico, respondé: "🤔 ¿Te referís a **[MARCA CORRECTA]**?"

PASO 2 - BÚSQUEDA EN TIEMPO REAL:
Usá web_search para buscar precios ACTUALES:
1. OBLIGATORIO: Buscar "MercadoLibre Argentina ${message}"
2. OBLIGATORIO: Buscar "site:mercadolibre.com.ar ${message}"
3. Buscar también: OLX Argentina, DeMotos Argentina
4. SOLO motos EN VENTA (ignorar noticias/reviews)
5. SOLO resultados de Argentina (.com.ar)
6. Ordenar de MENOR a MAYOR precio

FORMATO:
🏍️ **[Modelo completo]** - [Año] - [0KM/Usada] - [KM si disponible]
💰 **Precio: $[precio formateado] ARS**
📍 **Ubicación:** [Ciudad/Provincia]
🔗 **Ver en:** [MercadoLibre/OLX/etc]

---

IMPORTANTE:
- Ordená SIEMPRE de menor a mayor precio
- Mostrá hasta 8 resultados
- Si no encontrás en MercadoLibre, avisá
- Explicá diferencias de precio (0KM vs usada)`
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
