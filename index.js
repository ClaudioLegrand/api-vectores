import express from 'express';
import pkg from 'pg';

const { Pool } = pkg;
const app = express();
app.use(express.json());

// 1. Configurar la conexión al contenedor PostgreSQL
const pool = new Pool({
  user: 'mi_usuario',
  password: 'mi_password',
  host: 'localhost',
  port: 5432,
  database: 'mi_base_de_datos'
});

// 2. Endpoint POST: Guardar artículo y generar vector con Ollama
app.post('/api/articulos', async (req, res) => {
  const { titulo, contenido } = req.body;

  if (!titulo || !contenido) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // Llamada a Ollama local
    const ollamaResponse = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: contenido })
    });
    
    const iaData = await ollamaResponse.json();
    const vectorString = `[${iaData.embedding.join(',')}]`;

    // Insertar en PostgreSQL
    const query = `INSERT INTO articulos_ia (titulo, contenido, embedding) VALUES ($1, $2, $3) RETURNING id, titulo;`;
    const dbResult = await pool.query(query, [titulo, contenido, vectorString]);

    res.status(201).json({ mensaje: 'Guardado con éxito', articulo: dbResult.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// 3. Endpoint GET: Buscar artículos por similitud semántica
app.get('/api/articulos/buscar', async (req, res) => {
  const queryBusqueda = req.query.q;
  if (!queryBusqueda) return res.status(400).json({ error: 'Falta parámetro q' });

  try {
    // Convertir la búsqueda a vector con Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: queryBusqueda })
    });
    
    const iaData = await ollamaResponse.json();
    const vectorString = `[${iaData.embedding.join(',')}]`;

    // Buscar en PostgreSQL usando Distancia del Coseno (<=>)
    const sqlQuery = `
      SELECT id, titulo, contenido, (1 - (embedding <=> $1)) AS similitud 
      FROM articulos_ia
      ORDER BY embedding <=> $1 ASC 
      LIMIT 3;
    `;
    const dbResult = await pool.query(sqlQuery, [vectorString]);

    res.json({ busqueda: queryBusqueda, resultados: dbResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor con Ollama corriendo en http://localhost:${PORT}`));