// server.js

// 1. Importar las librerías necesarias
const express = require('express');
const cors = require('cors');

// 2. Inicializar la aplicación de Express
const app = express();
const PORT = 3000; // El puerto en el que correrá nuestro servidor

// 3. Middlewares
// CORS: Permite que nuestro frontend (que corre en un origen diferente) haga peticiones a este backend.
app.use(cors());
// express.json(): Permite al servidor entender y procesar datos en formato JSON que vengan en las peticiones.
app.use(express.json());

// 4. Base de datos simulada en memoria
// En una aplicación real, esto estaría en una base de datos como MongoDB, PostgreSQL, etc.
// Cada tarea es un objeto con id, texto y estado ('pending' o 'inProgress').
let tasks = [
    { id: 1, text: 'Configurar el entorno de Node.js', status: 'inProgress' },
    { id: 2, text: 'Crear el primer endpoint GET', status: 'pending' },
    { id: 3, text: 'Conectar el frontend', status: 'pending' },
];
let nextTaskId = 4; // Para asignar IDs únicos a las nuevas tareas

// 5. Definición de las Rutas (Endpoints) de nuestra API

/**
 * [GET] /tasks - Obtener tareas con paginación.
 * Permite filtrar por estado (status) y paginar los resultados.
 * Query params:
 * - status: 'pending' o 'inProgress' (requerido)
 * - page: número de página (ej: 1, 2, 3...)
 * - limit: cuántos items por página
 */
app.get('/tasks', (req, res) => {
    const { status, page = 1, limit = 5 } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'El parámetro "status" es requerido.' });
    }

    // Filtrar las tareas por el estado solicitado
    const filteredTasks = tasks.filter(task => task.status === status);

    // Calcular la paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(filteredTasks.length / limit);

    // Enviar la respuesta
    res.json({
        tasks: paginatedTasks,
        currentPage: parseInt(page),
        totalPages: totalPages
    });
});

/**
 * [POST] /tasks - Crear una nueva tarea.
 * La nueva tarea siempre se crea con estado 'pending'.
 */
app.post('/tasks', (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'El texto de la tarea no puede estar vacío.' });
    }

    const newTask = {
        id: nextTaskId++,
        text: text,
        status: 'pending'
    };

    tasks.push(newTask);
    console.log('Tarea creada:', newTask);
    res.status(201).json(newTask); // 201 = Creado exitosamente
});

/**
 * [PUT] /tasks/:id - Editar una tarea (principalmente para cambiar su estado).
 */
app.put('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { status, text } = req.body; // Aceptamos cambiar estado o texto

    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Tarea no encontrada.' }); // 404 = No encontrado
    }

    // Actualizar los campos que se hayan enviado
    if (status) {
        tasks[taskIndex].status = status;
    }
    if (text) {
        tasks[taskIndex].text = text;
    }

    console.log('Tarea actualizada:', tasks[taskIndex]);
    res.json(tasks[taskIndex]);
});

/**
 * [DELETE] /tasks/:id - Eliminar una tarea.
 */
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const initialLength = tasks.length;
    tasks = tasks.filter(t => t.id !== taskId);

    if (tasks.length === initialLength) {
        return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    console.log('Tarea eliminada, ID:', taskId);
    res.status(204).send(); // 204 = Sin contenido (éxito pero no se devuelve nada)
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});