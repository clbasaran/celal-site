const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Delivery {
    constructor() {
        this.dbPath = path.join(__dirname, '../database.sqlite');
    }

    // Veritabanı bağlantısı
    getDb() {
        return new sqlite3.Database(this.dbPath);
    }

    // Teslimat tablosu oluştur
    createTable() {
        const db = this.getDb();
        const sql = `
            CREATE TABLE IF NOT EXISTS deliveries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                delivery_date DATE NOT NULL,
                items TEXT NOT NULL, -- JSON formatında ürünler (tohum, gübre, kömür)
                total_amount REAL NOT NULL,
                notes TEXT,
                status TEXT DEFAULT 'delivered', -- delivered, pending, cancelled
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
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

    // Tüm teslimatları getir
    getAll() {
        const db = this.getDb();
        const sql = `
            SELECT d.*, c.name as customer_name 
            FROM deliveries d 
            LEFT JOIN customers c ON d.customer_id = c.id 
            ORDER BY d.delivery_date DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                db.close();
                if (err) reject(err);
                else {
                    // JSON string olan items'ları parse et
                    const parsedRows = rows.map(row => ({
                        ...row,
                        items: JSON.parse(row.items)
                    }));
                    resolve(parsedRows);
                }
            });
        });
    }

    // ID ile teslimat getir
    getById(id) {
        const db = this.getDb();
        const sql = `
            SELECT d.*, c.name as customer_name 
            FROM deliveries d 
            LEFT JOIN customers c ON d.customer_id = c.id 
            WHERE d.id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                db.close();
                if (err) reject(err);
                else {
                    if (row) {
                        row.items = JSON.parse(row.items);
                    }
                    resolve(row);
                }
            });
        });
    }

    // Müşteri ID ile teslimatları getir
    getByCustomerId(customerId) {
        const db = this.getDb();
        const sql = `
            SELECT * FROM deliveries 
            WHERE customer_id = ? 
            ORDER BY delivery_date DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [customerId], (err, rows) => {
                db.close();
                if (err) reject(err);
                else {
                    const parsedRows = rows.map(row => ({
                        ...row,
                        items: JSON.parse(row.items)
                    }));
                    resolve(parsedRows);
                }
            });
        });
    }

    // Hafta ve yıla göre teslimatları getir
    getByWeek(weekNumber, year) {
        const db = this.getDb();
        const sql = `
            SELECT d.*, c.name as customer_name 
            FROM deliveries d 
            LEFT JOIN customers c ON d.customer_id = c.id 
            WHERE d.week_number = ? AND d.year = ?
            ORDER BY c.name ASC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [weekNumber, year], (err, rows) => {
                db.close();
                if (err) reject(err);
                else {
                    const parsedRows = rows.map(row => ({
                        ...row,
                        items: JSON.parse(row.items)
                    }));
                    resolve(parsedRows);
                }
            });
        });
    }

    // Yeni teslimat oluştur
    create(deliveryData) {
        const db = this.getDb();
        const { 
            customer_id, 
            week_number, 
            year, 
            delivery_date, 
            items, 
            total_amount, 
            notes, 
            status = 'delivered' 
        } = deliveryData;
        
        const sql = `
            INSERT INTO deliveries 
            (customer_id, week_number, year, delivery_date, items, total_amount, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [
                customer_id, 
                week_number, 
                year, 
                delivery_date, 
                JSON.stringify(items), 
                total_amount, 
                notes, 
                status
            ], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ id: this.lastID, ...deliveryData });
            });
        });
    }

    // Teslimat güncelle
    update(id, deliveryData) {
        const db = this.getDb();
        const { 
            customer_id, 
            week_number, 
            year, 
            delivery_date, 
            items, 
            total_amount, 
            notes, 
            status 
        } = deliveryData;
        
        const sql = `
            UPDATE deliveries 
            SET customer_id = ?, week_number = ?, year = ?, delivery_date = ?, 
                items = ?, total_amount = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [
                customer_id, 
                week_number, 
                year, 
                delivery_date, 
                JSON.stringify(items), 
                total_amount, 
                notes, 
                status, 
                id
            ], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Teslimat sil
    delete(id) {
        const db = this.getDb();
        const sql = 'DELETE FROM deliveries WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Müşterinin toplam borcunu hesapla
    calculateCustomerDebt(customerId) {
        const db = this.getDb();
        const sql = `
            SELECT SUM(total_amount) as total_debt 
            FROM deliveries 
            WHERE customer_id = ? AND status = 'delivered'
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [customerId], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row.total_debt || 0);
            });
        });
    }
}

module.exports = Delivery; 