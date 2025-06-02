const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Customer {
    constructor() {
        this.dbPath = path.join(__dirname, '../database.sqlite');
    }

    // Veritabanı bağlantısı
    getDb() {
        return new sqlite3.Database(this.dbPath);
    }

    // Müşteri tablosu oluştur
    createTable() {
        const db = this.getDb();
        const sql = `
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                taxNumber TEXT,
                phone TEXT,
                address TEXT,
                email TEXT,
                notes TEXT,
                total_debt REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, (err) => {
                db.close();
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Tüm müşterileri getir
    getAll() {
        const db = this.getDb();
        const sql = 'SELECT * FROM customers ORDER BY name ASC';
        
        return new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ID ile müşteri getir
    getById(id) {
        const db = this.getDb();
        const sql = 'SELECT * FROM customers WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Yeni müşteri oluştur
    create(customerData) {
        const db = this.getDb();
        const { name, taxNumber, phone, address, email, notes } = customerData;
        const sql = `
            INSERT INTO customers (name, taxNumber, phone, address, email, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [name, taxNumber, phone, address, email, notes], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ id: this.lastID, ...customerData });
            });
        });
    }

    // Müşteri güncelle
    update(id, customerData) {
        const db = this.getDb();
        const { name, taxNumber, phone, address, email, notes } = customerData;
        const sql = `
            UPDATE customers 
            SET name = ?, taxNumber = ?, phone = ?, address = ?, email = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [name, taxNumber, phone, address, email, notes, id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Müşteri borç güncelle
    updateDebt(id, amount) {
        const db = this.getDb();
        const sql = 'UPDATE customers SET total_debt = ? WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [amount, id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Müşteri sil
    delete(id) {
        const db = this.getDb();
        const sql = 'DELETE FROM customers WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }
}

module.exports = Customer; 