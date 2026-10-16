import express from 'express';
import pkg from 'pg';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

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

// 2. Configurar el cliente de IA (OpenAI en este caso)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Asegúrate de tener esto en tu archivo .env
});

// 3. Crear el endpoint POST
app.post('/api/articulos', async (req, res) => {
  const { titulo, contenido } = req.body;

  // Validación básica
  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
  }

  try {
    // Paso A: Generar el embedding con la IA
    const aiResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Genera vectores de 1536 dimensiones
      input: contenido,
    });
    
    // Extraemos el array matemático (ej. [0.012, -0.045, 0.111, ...])
    const embeddingArray = aiResponse.data[0].embedding;

    // Paso B: Formatear el array para pgvector
    // pgvector espera un string con formato de array clásico: "[0.1, 0.2, 0.3]"
    const vectorString = `[${embeddingArray.join(',')}]`;

    // Paso C: Insertar en la base de datos de forma segura
    const query = `
      INSERT INTO articulos_ia (titulo, contenido, embedding)
      VALUES ($1, $2, $3)
      RETURNING id, titulo;
    `;
    
    const dbResult = await pool.query(query, [titulo, contenido, vectorString]);

    // Responder al cliente
    res.status(201).json({
      mensaje: 'Artículo guardado y vectorizado con éxito.',
      articulo: dbResult.rows[0]
    });

  } catch (error) {
    console.error('Error en el proceso:', error);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});