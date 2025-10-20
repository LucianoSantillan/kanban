// Backend/src/data-source.js
require('dotenv').config(); // <-- Carga las variables de entorno
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT), // Aseguramos que el puerto sea un número
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true, // ¡Solo para desarrollo!
    logging: false,
    entities: [__dirname + '/entities/*.js'],
});

module.exports = { AppDataSource };