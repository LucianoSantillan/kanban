// server.js - Versión FINAL con conexión a MySQL

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Contraseña vacía para XAMPP por defecto
    database: 'kanban_db'
};

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(express.json());

// --- ENDPOINTS DE LA API ---

// [GET] /tasks
app.get('/tasks', async (req, res) => {
    const { status, page = 1, limit = 100 } = req.query; // Aumentamos el límite
    if (!status) return res.status(400).json({ message: 'El parámetro "status" es requerido.' });
    try {
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE status = ?', [status]);
        res.json({ tasks, totalPages: 1, currentPage: 1 }); // Simplificado por ahora
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
        const [result] = await pool.query("INSERT INTO tasks (text, status) VALUES (?, 'To do')", [text]);
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
    const { status, text } = req.body;
    if (!status && !text) return res.status(400).json({ message: 'Se requiere "status" o "text" para actualizar.' });
    try {
        let query = 'UPDATE tasks SET';
        const params = [];
        if (text) {
            query += ' text = ?';
            params.push(text);
        }
        if (status) {
            query += text ? ',' : '';
            query += ' status = ?';
            params.push(status);
        }
        query += ' WHERE id = ?';
        params.push(taskId);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Tarea no encontrada.' });
        const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        res.json(updatedTask[0]);
    } catch (error) {
        console.error('Error al actualizar la tarea:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// [POST] /register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    try {
        const [result] = await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
        res.status(201).json({ id: result.insertId, email });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// [POST] /login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || users[0].password !== password) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
        res.status(200).json({ message: 'Login exitoso!', user: { id: users[0].id, email: users[0].email } });
    } catch (error) {
        console.error('Error de login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT} y conectado a MySQL.`);
});