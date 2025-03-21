const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Получаем путь к базе данных из .env
const dbPath = path.resolve(process.env.DB_PATH);
const db = new sqlite3.Database(dbPath);

// Функция для создания таблиц, если они не существуют
const createTables = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
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
                )
            `, (err) => {
                if (err) {
                    reject(`Error creating cars table: ${err.message}`);
                } else {
                    console.log('Cars table created or already exists');
                }
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    firstName TEXT NOT NULL,
                    lastName TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    address TEXT NOT NULL,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL,
                    zipCode TEXT NOT NULL,
                    country TEXT NOT NULL,
                    avatar TEXT NOT NULL
                )
            `, (err) => {
                if (err) {
                    reject(`Error creating customers table: ${err.message}`);
                } else {
                    console.log('Customers table created or already exists');
                }
            });

            resolve();
        });
    });
};

// Функция для заполнения таблицы cars
const seedCars = () => {
    const cars = [];
    for (let i = 1; i <= 100; i++) {
        cars.push([
            `Car ${i}`,
            Math.floor(Math.random() * 100000) + 10000,
            `Description for Car ${i}`,
            `car${i}.jpg`,
            2010 + Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 100000),
            ['Petrol', 'Diesel', 'Electric'][Math.floor(Math.random() * 3)],
            ['Automatic', 'Manual'][Math.floor(Math.random() * 2)],
            ['Red', 'Blue', 'Black', 'White'][Math.floor(Math.random() * 4)],
            ['Available', 'Sold'][Math.floor(Math.random() * 2)],
        ]);
    }

    const query = `
        INSERT INTO cars (name, price, description, image, year, mileage, fuelType, transmission, color, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM cars", (err) => {
                if (err) {
                    reject(`Error deleting cars: ${err.message}`);
                } else {
                    console.log('Cars table cleared');
                }
            });

            db.run("BEGIN TRANSACTION");

            cars.forEach((car, index) => {
                db.run(query, car, (err) => {
                    if (err) {
                        reject(`Error inserting car ${index + 1}: ${err.message}`);
                    }
                });
            });

            db.run("COMMIT", (err) => {
                if (err) {
                    reject(`Error committing transaction: ${err.message}`);
                } else {
                    console.log('Cars seeded successfully');
                    resolve();
                }
            });
        });
    });
};

// Функция для заполнения таблицы customers
const seedCustomers = () => {
    const customers = [];
    for (let i = 1; i <= 100; i++) {
        customers.push([
            `First${i}`,
            `Last${i}`,
            `email${i}@example.com`,
            `+123456789${i}`,
            `Address ${i}`,
            `City ${i}`,
            `State ${i}`,
            `Zip${i}`,
            `Country ${i}`,
            `avatar${i}.jpg`,
        ]);
    }

    const query = `
        INSERT INTO customers (firstName, lastName, email, phone, address, city, state, zipCode, country, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM customers", (err) => {
                if (err) {
                    reject(`Error deleting customers: ${err.message}`);
                } else {
                    console.log('Customers table cleared');
                }
            });

            db.run("BEGIN TRANSACTION");

            customers.forEach((customer, index) => {
                db.run(query, customer, (err) => {
                    if (err) {
                        reject(`Error inserting customer ${index + 1}: ${err.message}`);
                    }
                });
            });

            db.run("COMMIT", (err) => {
                if (err) {
                    reject(`Error committing transaction: ${err.message}`);
                } else {
                    console.log('Customers seeded successfully');
                    resolve();
                }
            });
        });
    });
};

// Основная функция для запуска сидера
const runSeeder = async () => {
    try {
        await createTables();
        await seedCars();
        await seedCustomers();
        console.log('Database seeded successfully!');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        db.close();
    }
};

// Запуск сидера
runSeeder();