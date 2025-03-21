const db = require('../db'); // Импортируем общее соединение

// Функция для создания таблицы customers, если её нет
function ensureCustomersTableExists() {
    return new Promise((resolve, reject) => {
        const createTableQuery = `
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
            );
        `;
        db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating customers table:', err.message);
                reject(err);
            } else {
                console.log('Customers table created or already exists');
                resolve();
            }
        });
    });
}

// Получение клиента по ID
function getCustomerById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM customers WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching customer:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Получение всех клиентов
function getAllCustomers() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM customers", [], (err, rows) => {
            if (err) {
                console.error('Error fetching customers:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Добавление нового клиента
function addCustomer(customer) {
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO customers (firstName, lastName, email, phone, address, city, state, zipCode, country, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        db.run(
            insertQuery,
            [
                customer.firstName,
                customer.lastName,
                customer.email,
                customer.phone,
                customer.address,
                customer.city,
                customer.state,
                customer.zipCode,
                customer.country,
                customer.avatar
            ],
            function (err) {
                if (err) {
                    console.error('Error adding customer:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID); // Возвращает ID только что добавленной записи
                }
            }
        );
    });
}

// Обновление клиента по ID
function updateCustomer(id, customer) {
    return new Promise((resolve, reject) => {
        const updateQuery = `
            UPDATE customers 
            SET firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zipCode = ?, country = ?, avatar = ?
            WHERE id = ?;
        `;
        db.run(
            updateQuery,
            [
                customer.firstName,
                customer.lastName,
                customer.email,
                customer.phone,
                customer.address,
                customer.city,
                customer.state,
                customer.zipCode,
                customer.country,
                customer.avatar,
                id // ID в конце
            ],
            function (err) {
                if (err) {
                    console.error('Error updating customer:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes > 0); // Возвращает true, если запись была обновлена
                }
            }
        );
    });
}

// Удаление клиента по ID
function deleteCustomer(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM customers WHERE id = ?", [id], function (err) {
            if (err) {
                console.error('Error deleting customer:', err.message);
                reject(err);
            } else {
                resolve(this.changes > 0); // Возвращает true, если запись была удалена
            }
        });
    });
}

// Экспорт функций
module.exports = { ensureCustomersTableExists, getAllCustomers, addCustomer, getCustomerById, updateCustomer, deleteCustomer };