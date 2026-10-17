Motor de Búsqueda Semántica con IA

Este proyecto es una API RESTful desarrollada en Node.js que implementa un motor de búsqueda semántica avanzado. Utiliza PostgreSQL, la extensión pgvector y modelos de Inteligencia Artificial (Ollama / embeddings) para realizar búsquedas basadas en el significado del texto, superando las limitaciones de los sistemas de búsqueda tradicionales.

🚀 ¿Por qué Búsqueda Semántica vs. Búsqueda Tradicional?

En las bases de datos relacionales clásicas, las búsquedas de texto (usando LIKE o ILIKE) dependen de la coincidencia exacta de caracteres.

❌ El problema tradicional: Si un usuario busca "vehículo rápido", un artículo que diga "coche veloz" no aparecerá en los resultados porque no comparten las mismas palabras.

✅ La solución Semántica: Este sistema pasa el texto por un modelo de Inteligencia Artificial que lo convierte en un Embedding (una matriz matemática de cientos de dimensiones). Al guardar esta matriz en PostgreSQL usando pgvector, podemos calcular la "Distancia del Coseno" entre la pregunta y los artículos. El sistema entiende el contexto y sabe que "vehículo rápido" y "coche veloz" apuntan al mismo concepto matemático, devolviendo resultados ultra precisos.

🛠️ Stack Tecnológico

Backend: Node.js, Express.

Base de Datos: PostgreSQL corriendo en Docker.

Vectorización: Extensión pgvector con indexación HNSW (Hierarchical Navigable Small World).

Inteligencia Artificial: Ollama (Modelo nomic-embed-text para ejecución local y gratuita).

⚙️ Instalación y Configuración Local

Sigue estos pasos para levantar el proyecto en tu máquina local.

1. Prerrequisitos

Tener instalado Node.js.

Tener instalado Docker Desktop.

Tener instalado Ollama para los embeddings locales.

2. Clonar el repositorio e instalar dependencias

git clone https://github.com/TuUsuario/api-vectores.git
cd api-vectores
npm install


3. Levantar la Base de Datos (PostgreSQL + pgvector)

Inicia un contenedor de Docker con la imagen oficial que ya incluye la extensión vectorial:

docker run --name pgvector-db -e POSTGRES_USER=mi_usuario -e POSTGRES_PASSWORD=mi_password -e POSTGRES_DB=mi_base_de_datos -p 5432:5432 -d pgvector/pgvector:pg16


Una vez levantado, conéctate a la base de datos (docker exec -it pgvector-db psql -U mi_usuario -d mi_base_de_datos) y ejecuta el siguiente script SQL para preparar la infraestructura:

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE articulos_ia (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    embedding VECTOR(768) 
);

-- Creación de índice HNSW para búsquedas de alta velocidad en O(log n)
CREATE INDEX idx_articulos_embedding ON articulos_ia USING hnsw (embedding vector_cosine_ops);


4. Iniciar el motor de IA Local

Abre una terminal y descarga el modelo matemático de Ollama (solo se hace la primera vez):

ollama pull nomic-embed-text


5. Ejecutar la API

node index.js


El servidor estará escuchando en http://localhost:3000.

📡 Uso de los Endpoints

1. Guardar y Vectorizar un Artículo (POST)

curl -X POST http://localhost:3000/api/articulos \
-H "Content-Type: application/json" \
-d '{"titulo": "Bases de Datos", "contenido": "Las bases de datos relacionales organizan la informacion en tablas..."}'


2. Búsqueda por Similitud (GET)
Busca por concepto, no por palabra exacta:

curl "http://localhost:3000/api/articulos/buscar?q=como%20estructurar%20informacion"