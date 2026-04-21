const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Ruta API para el chatbot - VERSIÓN SIMPLE SIN WEB SEARCH
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Verificar que la API key esté configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ API key no configurada');
      return res.status(500).json({ 
        error: 'API key no configurada en Render. Andá a Settings > Environment y agregá ANTHROPIC_API_KEY' 
      });
    }

    console.log('✅ API key encontrada');
    console.log('📤 Enviando request a Anthropic (versión simple)...');

    // Llamar a Anthropic API - SIN WEB SEARCH
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `El usuario está buscando información sobre: "${message}"

Por ahora, respondé que estás en modo de prueba y que pronto vas a poder buscar precios reales de motos en Argentina.

Dale un mensaje amigable y decile que probaste que la conexión con la API funciona correctamente.`
        }
      ]
      // SIN tools por ahora - solo probamos que funcione
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    console.log('✅ Respuesta recibida de Anthropic');

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
      message: assistantMessage || 'Conexión exitosa con la API.'
    });

  } catch (error) {
    console.error('❌ Error completo:', error.response?.data || error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(errorData, null, 2));
      
      return res.status(error.response.status).json({
        error: errorData.error?.message || errorData.error?.type || 'Error de API de Anthropic',
        details: errorData
      });
    }
    
    res.status(500).json({
      error: 'Error al procesar el request: ' + error.message
    });
  }
});

// Servir el HTML desde la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.ANTHROPIC_API_KEY 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔑 API key configurada: ${process.env.ANTHROPIC_API_KEY ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`⚠️  MODO PRUEBA - Sin web search por ahora`);
});
