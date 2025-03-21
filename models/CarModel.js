const db = require('../db'); // Импортируем общее соединение

// Функция для создания таблицы cars, если её нет
function ensureCarsTableExists() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS cars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL,
                year INTEGER NOT NULL,
                mileage INTEGER NOT NULL,
                fuelType TEXT NOT NULL,
                transmission TEXT NOT NULL,
                color TEXT NOT NULL,
                status TEXT NOT NULL
            );
        `;
        db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating cars table:', err.message);
                reject(err);
            } else {
                console.log('Cars table created or already exists');
                resolve();
            }
        });
    });
}

// Получение всех машин
function getAllCars() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM cars", [], (err, rows) => {
            if (err) {
                console.error('Error fetching cars:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Получение машины по ID
function getCarById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM cars WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching car:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Добавление новой машины
function addCar(car) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO cars (name, price, description, image, year, mileage, fuelType, transmission, color, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                car.name,
                car.price,
                car.description,
                car.image,
                car.year,
                car.mileage,
                car.fuelType,
                car.transmission,
                car.color,
                car.status
            ],
            function (err) {
                if (err) {
                    console.error('Error adding car:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление машины по ID
function updateCar(id, car) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE cars 
            SET name = ?, price = ?, description = ?, image = ?, year = ?, mileage = ?, fuelType = ?, transmission = ?, color = ?, status = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                car.name,
                car.price,
                car.description,
                car.image,
                car.year,
                car.mileage,
                car.fuelType,
                car.transmission,
                car.color,
                car.status,
                id // ID в конце
            ],
            function (err) {
                if (err) {
                    console.error('Error updating car:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // Возвращает true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление машины по ID
function deleteCar(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM cars WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting car:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // Возвращает true, если запись была удалена
            }
        });
    });
}

// Экспорт функций
module.exports = { ensureCarsTableExists, getAllCars, addCar, getCarById, updateCar, deleteCar };