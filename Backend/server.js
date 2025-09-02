// server.js - Versión final con conexión a MySQL

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

// !! IMPORTANTE: CONFIGURA TU CONEXIÓN A LA BASE DE DATOS !!
const dbConfig = {
    host: 'localhost',
    user: 'root',
    // Por defecto, la contraseña de MySQL en XAMPP está vacía.
    // Si estableciste una, ponla aquí. Si no, déjalo como ''.
    password: '',
    database: 'kanban_db'
};

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(express.json());

// --- ENDPOINTS DE LA API ---

// [GET] /tasks
app.get('/tasks', async (req, res) => {
    const { status, page = 1, limit = 5 } = req.query;
    if (!status) return res.status(400).json({ message: 'El parámetro "status" es requerido.' });

    try {
        const offset = (page - 1) * limit;
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM tasks WHERE status = ?', [status]);
        const totalTasks = countResult[0].total;
        const totalPages = Math.ceil(totalTasks / limit);
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?', [status, parseInt(limit), parseInt(offset)]);

        res.json({ tasks, currentPage: parseInt(page), totalPages });
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// [POST] /tasks
app.post('/tasks', async (req, res) => {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ message: 'El texto no puede estar vacío.' });

    try {
        const [result] = await pool.query("INSERT INTO tasks (text, status) VALUES (?, 'pending')", [text]);
        const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
        res.status(201).json(newTask[0]);
    } catch (error) {
        console.error('Error al crear la tarea:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// [PUT] /tasks/:id
app.put('/tasks/:id', async (req, res) => {
    const taskId = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'El campo "status" es requerido.' });

    try {
        const [result] = await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Tarea no encontrada.' });
        const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.json(updatedTask[0]);
    } catch (error) {
        console.error('Error al actualizar la tarea:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// 6. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT} y conectado a MySQL.`);
});