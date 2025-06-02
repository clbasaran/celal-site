const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Payment {
    constructor() {
        this.dbPath = path.join(__dirname, '../database.sqlite');
    }

    // Veritabanı bağlantısı
    getDb() {
        return new sqlite3.Database(this.dbPath);
    }

    // Ödeme tablosu oluştur
    createTable() {
        const db = this.getDb();
        const sql = `
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                payment_date DATE NOT NULL,
                payment_method TEXT DEFAULT 'cash', -- cash, bank_transfer, check
                installment_number INTEGER DEFAULT 1,
                total_installments INTEGER DEFAULT 1,
                receipt_number TEXT,
                notes TEXT,
                status TEXT DEFAULT 'completed', -- completed, pending, cancelled
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

    // Tüm ödemeleri getir
    getAll() {
        const db = this.getDb();
        const sql = `
            SELECT p.*, c.name as customer_name 
            FROM payments p 
            LEFT JOIN customers c ON p.customer_id = c.id 
            ORDER BY p.payment_date DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ID ile ödeme getir
    getById(id) {
        const db = this.getDb();
        const sql = `
            SELECT p.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address 
            FROM payments p 
            LEFT JOIN customers c ON p.customer_id = c.id 
            WHERE p.id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Müşteri ID ile ödemeleri getir
    getByCustomerId(customerId) {
        const db = this.getDb();
        const sql = `
            SELECT * FROM payments 
            WHERE customer_id = ? 
            ORDER BY payment_date DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [customerId], (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Tarih aralığına göre ödemeleri getir
    getByDateRange(startDate, endDate) {
        const db = this.getDb();
        const sql = `
            SELECT p.*, c.name as customer_name 
            FROM payments p 
            LEFT JOIN customers c ON p.customer_id = c.id 
            WHERE p.payment_date BETWEEN ? AND ?
            ORDER BY p.payment_date DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [startDate, endDate], (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Yeni ödeme oluştur
    create(paymentData) {
        const db = this.getDb();
        const { 
            customer_id, 
            amount, 
            payment_date, 
            payment_method = 'cash', 
            installment_number = 1, 
            total_installments = 1, 
            receipt_number,
            notes, 
            status = 'completed' 
        } = paymentData;
        
        const sql = `
            INSERT INTO payments 
            (customer_id, amount, payment_date, payment_method, installment_number, 
             total_installments, receipt_number, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [
                customer_id, 
                amount, 
                payment_date, 
                payment_method, 
                installment_number, 
                total_installments, 
                receipt_number,
                notes, 
                status
            ], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ id: this.lastID, ...paymentData });
            });
        });
    }

    // Ödeme güncelle
    update(id, paymentData) {
        const db = this.getDb();
        const { 
            customer_id, 
            amount, 
            payment_date, 
            payment_method, 
            installment_number, 
            total_installments, 
            receipt_number,
            notes, 
            status 
        } = paymentData;
        
        const sql = `
            UPDATE payments 
            SET customer_id = ?, amount = ?, payment_date = ?, payment_method = ?, 
                installment_number = ?, total_installments = ?, receipt_number = ?, 
                notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [
                customer_id, 
                amount, 
                payment_date, 
                payment_method, 
                installment_number, 
                total_installments, 
                receipt_number,
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

    // Ödeme sil
    delete(id) {
        const db = this.getDb();
        const sql = 'DELETE FROM payments WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Müşterinin toplam ödeme miktarını hesapla
    calculateCustomerPayments(customerId) {
        const db = this.getDb();
        const sql = `
            SELECT SUM(amount) as total_payments 
            FROM payments 
            WHERE customer_id = ? AND status = 'completed'
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [customerId], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row.total_payments || 0);
            });
        });
    }

    // Sonraki makbuz numarasını oluştur
    generateReceiptNumber() {
        const db = this.getDb();
        const sql = 'SELECT MAX(receipt_number) as last_receipt FROM payments WHERE receipt_number IS NOT NULL';
        
        return new Promise((resolve, reject) => {
            db.get(sql, (err, row) => {
                db.close();
                if (err) reject(err);
                else {
                    const lastNumber = row.last_receipt ? parseInt(row.last_receipt.replace(/\D/g, '')) : 0;
                    const newNumber = (lastNumber + 1).toString().padStart(6, '0');
                    resolve(`MKB${newNumber}`);
                }
            });
        });
    }

    // Günlük toplam tahsilat
    getDailyTotal(date) {
        const db = this.getDb();
        const sql = `
            SELECT SUM(amount) as daily_total 
            FROM payments 
            WHERE DATE(payment_date) = ? AND status = 'completed'
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [date], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row.daily_total || 0);
            });
        });
    }

    // Aylık toplam tahsilat
    getMonthlyTotal(year, month) {
        const db = this.getDb();
        const sql = `
            SELECT SUM(amount) as monthly_total 
            FROM payments 
            WHERE strftime('%Y', payment_date) = ? 
            AND strftime('%m', payment_date) = ? 
            AND status = 'completed'
        `;
        
        return new Promise((resolve, reject) => {
            db.get(sql, [year.toString(), month.toString().padStart(2, '0')], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row.monthly_total || 0);
            });
        });
    }
}

module.exports = Payment; 