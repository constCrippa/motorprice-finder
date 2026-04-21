const express = require(‘express’);
const axios = require(‘axios’);
const path = require(‘path’);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Funcion para validar si un link es a un anuncio individual
function esLinkValido(url) {
if (!url) return false;

// Patrones INVALIDOS (listados/categorias)
const patronesInvalidos = [
/*Desde*/i,
//listado/i,
/motos.mercadolibre.com.ar/[a-z]+/?$/i,
/mercadolibre.com.ar/c//i,
//categoria/i,
//search/i,
//buscar/i,
//resultados/i
];

for (const patron of patronesInvalidos) {
if (patron.test(url)) return false;
}

// Patrones VALIDOS (anuncios individuales)
const patronesValidos = [
/MLA-?\d+/i,                          // MercadoLibre: MLA-123456
/mercadolibre.com.ar/.*/p//i,    // MercadoLibre: /p/MLAxxx
/articulo.mercadolibre/i,             // articulo.mercadolibre
/cycles.com/i,                        // Cualquier URL de cycles
/demotos.com.ar/.+-\d+/i,          // DeMotos con ID
//anuncio//i,                        // Anuncios
//aviso//i                           // Avisos
];

for (const patron of patronesValidos) {
if (patron.test(url)) return true;
}

return false;
}

// Funcion para limpiar la respuesta y filtrar links malos
function filtrarRespuesta(texto) {
const lineas = texto.split(’\n’);
const lineasFiltradas = [];
let descartarBloque = false;
let bloqueActual = [];

for (const linea of lineas) {
// Detectar si empieza un nuevo resultado
const esNuevoResultado = /^(Sitio:|Modelo:|\d+.|##|**)/i.test(linea.trim());

```
if (esNuevoResultado && bloqueActual.length > 0) {
  // Procesar bloque anterior
  if (!descartarBloque) {
    lineasFiltradas.push(...bloqueActual);
  }
  bloqueActual = [];
  descartarBloque = false;
}

bloqueActual.push(linea);

// Verificar si la linea tiene un link
const matchUrl = linea.match(/https?:\/\/[^\s\)]+/);
if (matchUrl) {
  const url = matchUrl[0];
  if (!esLinkValido(url)) {
    descartarBloque = true;
    console.log('Link descartado (listado):', url);
  }
}
```

}

// Procesar ultimo bloque
if (bloqueActual.length > 0 && !descartarBloque) {
lineasFiltradas.push(…bloqueActual);
}

return lineasFiltradas.join(’\n’);
}

app.post(’/api/chat’, async (req, res) => {
try {
const message = req.body.message;

```
if (!process.env.ANTHROPIC_API_KEY) {
  return res.status(500).json({ error: 'API key no configurada' });
}

console.log('Buscando:', message);

const promptText = 'Busca motos 0KM (NUEVAS) de "' + message + '" en Argentina.\n\n' +
  'PRIORIDAD:\n' +
  '1. cycles.com.ar (MOSTRAR PRIMERO)\n' +
  '2. MercadoLibre Argentina\n' +
  '3. DeMotos.com.ar\n\n' +
  'CRITICO - LINKS:\n' +
  '- SOLO anuncios individuales con ID\n' +
  '- MercadoLibre valido: articulo.mercadolibre.com.ar/MLA-XXXXX\n' +
  '- Descartar links de categorias/listados\n' +
  '- Si no tenes link directo al anuncio, NO incluyas ese resultado\n\n' +
  'REGLAS:\n' +
  '- SOLO 0KM (descarta usadas)\n' +
  '- Ordena menor a mayor precio\n' +
  '- Maximo 6 resultados\n\n' +
  'FORMATO:\n' +
  'Sitio: [nombre]\n' +
  'Modelo - 0KM\n' +
  'Precio: $XXX ARS\n' +
  'Link: [URL directa del anuncio]\n\n' +
  'AL FINAL:\n' +
  '=== COMPARACION ===\n' +
  'Mas barato: $XXX en [sitio]\n' +
  'Mas caro: $XXX en [sitio]\n' +
  'Diferencia: $XXX\n' +
  'Recomendacion: [mejor opcion]';

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

// FILTRAR LINKS DE LISTADOS ANTES DE ENVIAR
const mensajeFiltrado = filtrarRespuesta(assistantMessage);

console.log('Respuesta enviada al usuario');

res.json({ 
  message: mensajeFiltrado || 'No encontre anuncios especificos. Intenta con una busqueda mas especifica.' 
});
```

} catch (error) {
const errorData = error.response && error.response.data;
console.error(‘Error:’, errorData || error.message);

```
if (error.response) {
  return res.status(error.response.status).json({
    error: JSON.stringify(errorData)
  });
}
res.status(500).json({ error: error.message });
```

}
});

app.get(’/’, (req, res) => {
res.sendFile(path.join(__dirname, ‘index.html’));
});

app.listen(PORT, function() {
console.log(’Servidor en puerto ’ + PORT);
});