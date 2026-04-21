const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Ruta API para el chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Verificar que la API key esté configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ 
        error: 'API key no configurada en Render. Andá a Environment y agregá ANTHROPIC_API_KEY' 
      });
    }

    // Llamar a Anthropic API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Sos un asistente especializado en búsqueda de precios de motos EN VENTA en Argentina. El usuario pregunta: "${message}"

PASO 1 - VERIFICACIÓN ORTOGRÁFICA:
Antes de buscar, verificá si hay errores ortográficos en marcas de motos. Marcas comunes en Argentina:
- Yamaha (errores comunes: yamaja, iamaha, llamaha, yamha)
- Honda (errores: jonda, onda, hoda)
- Kawasaki (errores: kawasaky, kawasakki, kawazaki)
- Suzuki (errores: susuki, suzuky, susuki)
- Zanella (errores: zanela, zanella, sanella)
- Motomel (errores: motomal, motomell, motomel)
- Gilera (errores: guilera, gilerra, gilera)
- Bajaj (errores: bajas, bajaj, bahaj)
- KTM (errores: ktm, ktmm)
- Benelli (errores: beneli, benelly, venelli)
- Corven (errores: corben, corven, korven)
- Beta (errores: veta, betha)

Si detectás un error ortográfico, respondé SOLO con:
"🤔 ¿Te referís a **[MARCA CORRECTA]**? 
Por favor confirmá o corregime y vuelvo a buscar."

NO BUSQUES hasta que el usuario confirme.

Si la ortografía está correcta, continuá con las instrucciones de búsqueda:

INSTRUCCIONES CRÍTICAS:
1. Usá la herramienta web_search MÚLTIPLES VECES para buscar en diferentes fuentes:
   - OBLIGATORIO: Buscar en "MercadoLibre Argentina ${message}"
   - OBLIGATORIO: Buscar en "site:mercadolibre.com.ar ${message}"
   - Buscar también en: OLX Argentina, DeMotos Argentina, SoloMotos Argentina
2. SOLO incluir resultados de MOTOS EN VENTA (ignorar noticias, reviews, artículos)
3. SOLO resultados de Argentina (sitios .com.ar o que especifiquen Argentina)
4. Extraer precios en pesos argentinos (ARS) - buscar formatos como "$XXX.XXX", "ARS XXX.XXX", etc.
5. Ordenar TODOS los resultados de MENOR a MAYOR precio
6. Incluir SIEMPRE resultados de MercadoLibre Argentina si están disponibles

FORMATO DE RESPUESTA:
Para cada moto encontrada:

🏍️ **[Modelo completo]** ${message.includes('usada') || message.includes('usado') ? '- [Año] - [KM si disponible]' : '- [0KM o Usada] - [Año si disponible]'}
💰 **Precio: $[precio formateado] ARS**
📍 **Ubicación:** [Ciudad/Provincia si disponible]
🔗 **Ver en:** [MercadoLibre / OLX / etc]

---

IMPORTANTE:
- Ordená SIEMPRE de menor a mayor precio
- Si hay más de 8 resultados, mostrá los 8 más baratos
- Si no encontrás en MercadoLibre, avisá al usuario
- Indicar claramente si es 0KM o usada
- Si hay mucha diferencia de precios, explicá brevemente por qué (ej: "La diferencia se debe a que algunas son 0KM y otras usadas")`
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

    const data = response.data;

    // Extraer el texto de la respuesta
    let assistantMessage = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        }
      }
    }

    res.json({
      message: assistantMessage || 'No pude encontrar información sobre esa moto.'
    });

  } catch (error) {
    console.error('Error en API:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.error?.message || 'Error al comunicarse con la API de Anthropic'
      });
    }
    
    res.status(500).json({
      error: error.message || 'Error interno del servidor'
    });
  }
});

// Servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
