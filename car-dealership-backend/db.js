// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных в корне проекта
const dbPath = path.resolve(__dirname, '../database.db'); // Убедитесь, что путь правильный

// Создаем одно общее соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the database');
    }
});

// Экспортируем соединение
module.exports = db;