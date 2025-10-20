// server.js - Versión FINAL con TypeORM, endpoints funcionales y seguridad de contraseñas

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // <-- CAMBIO 1: Importamos bcrypt para hashear contraseñas
const { AppDataSource } = require('./src/data-source');

const app = express();
const PORT = 3000;
app.use(cors({
    origin: 'http://localhost:5173', // La URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

AppDataSource.initialize()
    .then(() => {
        console.log("✅ Conexión a la base de datos establecida con TypeORM");

        const taskRepository = AppDataSource.getRepository("Task");
        const userRepository = AppDataSource.getRepository("User");

        // --- ENDPOINTS DE LA API ---

        app.get('/tasks', async (req, res) => {
            const { status } = req.query;
            if (!status) return res.status(400).json({ message: 'El parámetro "status" es requerido.' });
            try {
                const tasks = await taskRepository.find({ where: { status } });
                res.json({ tasks: tasks || [] });
            } catch (error) {
                console.error("Error en GET /tasks:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.post('/tasks', async (req, res) => {
            // CAMBIO 2: Aceptamos 'status' del body para más flexibilidad. Si no viene, usamos 'To do'.
            const { text, status } = req.body;
            if (!text || text.trim() === '') return res.status(400).json({ message: 'El texto no puede estar vacío.' });
            try {
                const newTask = taskRepository.create({ 
                    text: text.trim(), 
                    status: status || 'To do' 
                });
                const savedTask = await taskRepository.save(newTask);
                // La respuesta ya era correcta, devolviendo el objeto creado. ¡Perfecto!
                res.status(201).json(savedTask);
            } catch (error) {
                console.error("Error en POST /tasks:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.put('/tasks/:id', async (req, res) => {
            const taskId = parseInt(req.params.id);
            try {
                const task = await taskRepository.findOneBy({ id: taskId });
                if (!task) return res.status(404).json({ message: 'Tarea no encontrada.' });
                
                taskRepository.merge(task, req.body);
                const results = await taskRepository.save(task);
                res.json(results);
            } catch (error) {
                console.error("Error en PUT /tasks/:id:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.delete('/tasks/:id', async (req, res) => {
            const taskId = parseInt(req.params.id);
            try {
                const deleteResult = await taskRepository.delete(taskId);
                if (deleteResult.affected === 0) {
                    return res.status(404).json({ message: 'Tarea no encontrada.' });
                }
                res.status(200).json({ message: 'Tarea eliminada correctamente.' });
            } catch (error) {
                console.error("Error en DELETE /tasks/:id:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.post('/register', async (req, res) => {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
            try {
                // CAMBIO 3: Hasheamos la contraseña antes de guardarla
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const newUser = userRepository.create({ email, password: hashedPassword });
                await userRepository.save(newUser);
                
                res.status(201).json({ id: newUser.id, email: newUser.email });
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'El email ya está registrado.' });
                }
                console.error("Error en POST /register:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.post('/login', async (req, res) => {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
            try {
                const user = await userRepository.findOneBy({ email });
                if (!user) {
                    // Nota: Damos un mensaje genérico por seguridad
                    return res.status(401).json({ message: 'Credenciales incorrectas.' });
                }

                // CAMBIO 4: Comparamos la contraseña enviada con el hash guardado en la BD
                const isPasswordCorrect = await bcrypt.compare(password, user.password);

                if (!isPasswordCorrect) {
                    return res.status(401).json({ message: 'Credenciales incorrectas.' });
                }

                // Generamos un token simple (en un proyecto real, se usaría JWT)
                const token = `user-token-${user.id}-${Date.now()}`;
                
                res.status(200).json({ 
                    message: 'Login exitoso!', 
                    token: token, // Enviamos el token al frontend
                    user: { id: user.id, email: user.email } 
                });

            } catch (error) {
                console.error("Error en POST /login:", error);
                res.status(500).json({ message: 'Error interno del servidor' });
            }
        });

        app.listen(PORT, () => {
            console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => console.log("❌ Error al conectar a la base de datos:", error));