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

    const promptText = 'Sos un experto en busqueda de ANUNCIOS ESPECIFICOS de motos en venta en Argentina.\n\n' +
      'Usuario busca: "' + message + '"\n\n' +
      'INSTRUCCIONES CRITICAS SOBRE LINKS:\n\n' +
      'REGLA MAS IMPORTANTE: Cada link DEBE ser a un ANUNCIO INDIVIDUAL ESPECIFICO, NUNCA a una pagina de listado/busqueda.\n\n' +
      'COMO IDENTIFICAR LINKS CORRECTOS DE MERCADOLIBRE:\n' +
      '- CORRECTO: https://articulo.mercadolibre.com.ar/MLA-123456789-yamaha-fz-150-2023\n' +
      '- CORRECTO: https://moto.mercadolibre.com.ar/MLA-987654321-honda-wave-110\n' +
      '- CORRECTO: URLs que contengan "MLA-" seguido de numeros\n' +
      '- INCORRECTO: https://motos.mercadolibre.com.ar/yamaha/ (esto es listado)\n' +
      '- INCORRECTO: URLs con "/listado" o "_Desde_" (son paginas de busqueda)\n' +
      '- INCORRECTO: URLs que terminan solo con el nombre de la marca\n\n' +
      'COMO IDENTIFICAR LINKS CORRECTOS DE DEMOTOS:\n' +
      '- CORRECTO: https://www.demotos.com.ar/usados/yamaha-fz-150-2023-id12345\n' +
      '- INCORRECTO: https://www.demotos.com.ar/usados/yamaha (listado)\n\n' +
      'PROCESO DE BUSQUEDA:\n' +
      '1. Busca en MercadoLibre Argentina anuncios especificos de ' + message + '\n' +
      '2. Busca en DeMotos.com.ar anuncios especificos de ' + message + '\n' +
      '3. Busca en AutoCosmos Argentina\n' +
      '4. De cada anuncio EXTRAE la URL DIRECTA que contenga "MLA-XXXXX" o ID especifico\n' +
      '5. Si solo encontras paginas de listado, DESCARTALAS y busca el anuncio individual\n' +
      '6. VERIFICA cada URL antes de incluirla: debe tener el ID del anuncio\n\n' +
      'FORMATO:\n' +
      'Modelo - Anio - Estado\n' +
      'Precio: $XXXXX ARS\n' +
      'Ubicacion: Ciudad\n' +
      'Link: [URL DIRECTA con ID del anuncio]\n\n' +
      'REGLAS FINALES:\n' +
      '- Solo incluye resultados si tenes el link DIRECTO al anuncio individual\n' +
      '- Si un resultado no tiene link directo, NO lo incluyas\n' +
      '- Mejor mostrar menos resultados con links correctos que muchos con links a listados\n' +
      '- Ordena de MENOR a MAYOR precio\n' +
      '- Maximo 6 resultados\n' +
      '- Si hay error ortografico en la marca, sugiere la correcta';

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
