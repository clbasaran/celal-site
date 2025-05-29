const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Product {
    constructor() {
        this.dbPath = path.join(__dirname, '../emanet_takip.db');
    }

    // SQLite bağlantısı
    getDb() {
        return new sqlite3.Database(this.dbPath);
    }

    // Tabloları oluştur
    createTable() {
        const db = this.getDb();
        const sql = `
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                unit TEXT NOT NULL,
                description TEXT,
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

    // Tüm ürünleri getir
    getAll() {
        const db = this.getDb();
        const sql = 'SELECT * FROM products ORDER BY product_name ASC';
        
        return new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ID'ye göre ürün getir
    getById(id) {
        const db = this.getDb();
        const sql = 'SELECT * FROM products WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                db.close();
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Yeni ürün ekle
    create(productData) {
        const db = this.getDb();
        const { productName, unit, description } = productData;
        
        const sql = `
            INSERT INTO products (product_name, unit, description)
            VALUES (?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [productName, unit, description], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({
                    id: this.lastID,
                    product_name: productName,
                    unit,
                    description,
                    created_at: new Date().toISOString()
                });
            });
        });
    }

    // Ürün güncelle
    update(id, productData) {
        const db = this.getDb();
        const { productName, unit, description } = productData;
        
        const sql = `
            UPDATE products 
            SET product_name = ?, unit = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.run(sql, [productName, unit, description, id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Ürün sil
    delete(id) {
        const db = this.getDb();
        const sql = 'DELETE FROM products WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.run(sql, [id], function(err) {
                db.close();
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // Sample data ekle
    insertSampleData() {
        const sampleProducts = [
            {
                productName: 'Buğday Tohumu Premium',
                unit: 'çuval',
                description: '25kg çuvallar halinde premium buğday tohumu'
            },
            {
                productName: 'NPK Gübre 15-15-15',
                unit: 'kg',
                description: 'Dengeli NPK gübre karışımı'
            },
            {
                productName: 'Arpa Tohumu',
                unit: 'çuval',
                description: 'Yüksek verimli arpa tohumu'
            },
            {
                productName: 'Mısır Tohumu',
                unit: 'kg',
                description: 'Hibrit mısır tohumu'
            },
            {
                productName: 'Üre Gübre',
                unit: 'çuval',
                description: '%46 azotlu üre gübresi'
            }
        ];

        const promises = sampleProducts.map(product => this.create(product));
        return Promise.all(promises);
    }
}

module.exports = Product; 