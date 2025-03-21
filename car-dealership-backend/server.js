const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const jwtSecret = process.env.JWT_SECRET || 'Q1qqqqqq';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db4free.net',
    user: process.env.DB_USER || 'laimfresh1',
    password: process.env.DB_PASSWORD || 'Q1qqqqqq',
    database: process.env.DB_NAME || 'autosalon1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Тестирование подключения к базе данных
pool.getConnection()
    .then(() => {
        console.log('Connected to MySQL database');
    })
    .catch((err) => {
        console.error('Error connecting to MySQL:', err.message);
    });

// Создание таблиц при запуске сервера
async function initializeDatabase() {
    try {
        // Таблица для пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Таблица для автомобилей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
        `);

        // Таблица для клиентов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
        `);

        console.log('Database tables initialized');

        // Создание стандартного админа
        const adminEmail = 'admin@mail.ru';
        const adminPassword = 'Q1qqqqqq';
        const adminUsername = 'Admin';

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await pool.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [adminUsername, adminEmail, hashedPassword, 'admin']
            );
            console.log('Default admin created successfully');
        } else {
            console.log('Default admin already exists');
        }
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
}

// Функция для заполнения таблицы cars
async function seedCars() {
    try {
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

        // Очистка таблицы cars
        await pool.query('DELETE FROM cars');
        console.log('Cars table cleared');

        // Вставка данных
        const query = `
            INSERT INTO cars (name, price, description, image, year, mileage, fuelType, transmission, color, status)
            VALUES ?
        `;
        await pool.query(query, [cars]);
        console.log('Cars seeded successfully');
    } catch (error) {
        console.error('Error seeding cars:', error.message);
        throw error;
    }
}

// Функция для заполнения таблицы customers
async function seedCustomers() {
    try {
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

        // Очистка таблицы customers
        await pool.query('DELETE FROM customers');
        console.log('Customers table cleared');

        // Вставка данных
        const query = `
            INSERT INTO customers (firstName, lastName, email, phone, address, city, state, zipCode, country, avatar)
            VALUES ?
        `;
        await pool.query(query, [customers]);
        console.log('Customers seeded successfully');
    } catch (error) {
        console.error('Error seeding customers:', error.message);
        throw error;
    }
}

// Функция для запуска сидера
async function runSeeder() {
    try {
        // Проверяем и заполняем таблицу cars
        const [carRows] = await pool.query('SELECT COUNT(*) AS count FROM cars');
        if (carRows[0].count === 0) {
            await seedCars();
        } else {
            console.log('Cars table already contains data. Skipping seeding.');
        }

        // Проверяем и заполняем таблицу customers
        const [customerRows] = await pool.query('SELECT COUNT(*) AS count FROM customers');
        if (customerRows[0].count === 0) {
            await seedCustomers();
        } else {
            console.log('Customers table already contains data. Skipping seeding.');
        }

        console.log('Seeder completed.');
    } catch (error) {
        console.error('Error during seeding:', error.message);
    }
}

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('Error verifying token:', err.message);
            return res.status(403).json({ error: 'Invalid token' }); // Добавьте return
        }
        req.user = user;
        next();
    });

    // Проверяем токен
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error verifying token:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user; // Сохраняем данные пользователя в объекте запроса
        next();
    });
}

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'user']
        );
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        res.status(400).json({ error: 'Registration failed', details: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Проверяем, существует ли пользователь с таким email
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        // Проверяем, совпадает ли пароль
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

       // Генерация JWT токена
       const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
               jwtSecret, // Используем переменную jwtSecret
        { expiresIn: '1h' }
    );
res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        // Обрабатываем ошибки
        console.error('Error during login:', error.message); // Логируем ошибку на сервере
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});
// Проверка токена
app.get('/api/user', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
// Маршруты API для автомобилей
app.get('/api/cars', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cars');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cars', details: error.message });
    }
});
app.get('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json(rows[0]); // Возвращаем первый элемент массива
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch car', details: error.message });
    }
});
app.post('/api/cars', async (req, res) => {
    const { name, price, description, image, year, mileage, fuelType, transmission, color, status } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO cars (name, price, description, image, year, mileage, fuelType, transmission, color, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, price, description, image, year, mileage, fuelType, transmission, color, status]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add car', details: error.message });
    }
});

app.put('/api/cars/:id', async (req, res) => {
    const { id } = req.params;
    const updatedCar = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE cars SET name = ?, price = ?, description = ?, image = ?, year = ?, mileage = ?, fuelType = ?, transmission = ?, color = ?, status = ? WHERE id = ?',
            [
                updatedCar.name,
                updatedCar.price,
                updatedCar.description,
                updatedCar.image,
                updatedCar.year,
                updatedCar.mileage,
                updatedCar.fuelType,
                updatedCar.transmission,
                updatedCar.color,
                updatedCar.status,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        res.json({ message: 'Car updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update car', details: error.message });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM cars WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }

        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete car', details: error.message });
    }
});

// Маршруты API для клиентов
app.get('/api/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
    }
});
app.get('/api/customers/:id', async (req, res) => {
    const { id } = req.params; // Получаем ID из параметров запроса
    try {
        // Выполняем SQL-запрос для получения клиента по ID
        const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);

        // Если клиент не найден, возвращаем ошибку 404
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Возвращаем данные клиента
        res.json(rows[0]); // Возвращаем первый элемент массива
    } catch (error) {
        // Логируем ошибку и возвращаем статус 500
        console.error('Error fetching customer:', error.message);
        res.status(500).json({ error: 'Failed to fetch customer', details: error.message });
    }
});
app.post('/api/customers', async (req, res) => {
    const newCustomer = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO customers (firstName, lastName, email, phone, address, city, state, zipCode, country, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                newCustomer.firstName,
                newCustomer.lastName,
                newCustomer.email,
                newCustomer.phone,
                newCustomer.address,
                newCustomer.city,
                newCustomer.state,
                newCustomer.zipCode,
                newCustomer.country,
                newCustomer.avatar,
            ]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add customer', details: error.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    const { id } = req.params;
    const updatedCustomer = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE customers SET firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zipCode = ?, country = ?, avatar = ? WHERE id = ?',
            [
                updatedCustomer.firstName,
                updatedCustomer.lastName,
                updatedCustomer.email,
                updatedCustomer.phone,
                updatedCustomer.address,
                updatedCustomer.city,
                updatedCustomer.state,
                updatedCustomer.zipCode,
                updatedCustomer.country,
                updatedCustomer.avatar,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update customer', details: error.message });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer', details: error.message });
    }
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Инициализация базы данных и запуск сервера
(async () => {
    try {
        await initializeDatabase(); // Инициализируем базу данных и создаем админа
        await runSeeder();          // Запускаем сидер
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
    }
})();