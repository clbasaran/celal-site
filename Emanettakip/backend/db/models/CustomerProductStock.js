const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class CustomerProductStock {
  constructor() {
    this.dbPath = path.join(__dirname, '../emanet_takip.db');
  }

  // Veritabanı bağlantısı oluştur
  getConnection() {
    return new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
      }
    });
  }

  // Tablo oluştur
  async createTable() {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS customer_product_stocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
          unit TEXT NOT NULL,
          product_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(customer_id, product_id),
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
      `;
      
      db.run(sql, (err) => {
        db.close();
        if (err) {
          console.error('Müşteri ürün stok tablosu oluşturma hatası:', err.message);
          reject(err);
        } else {
          console.log('✅ Müşteri ürün stok tablosu hazır');
          resolve();
        }
      });
    });
  }

  // Müşteri için ürün stoku ekle/güncelle (sipariş)
  async upsertStock(customerId, productId, quantity, unit, productName) {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO customer_product_stocks 
        (customer_id, product_id, quantity, unit, product_name, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(customer_id, product_id) 
        DO UPDATE SET 
          quantity = quantity + ?,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      db.run(sql, [customerId, productId, quantity, unit, productName, quantity], function(err) {
        db.close();
        if (err) {
          console.error('Stok güncelleme hatası:', err.message);
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }

  // Stoktan düş (teslimat)
  async decrementStock(customerId, productId, quantity) {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      // Önce mevcut stoku kontrol et
      const checkSql = `
        SELECT quantity FROM customer_product_stocks 
        WHERE customer_id = ? AND product_id = ?
      `;
      
      db.get(checkSql, [customerId, productId], (err, row) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }
        
        if (!row || row.quantity < quantity) {
          db.close();
          reject(new Error(`Yetersiz stok. Mevcut: ${row?.quantity || 0}, İstenen: ${quantity}`));
          return;
        }
        
        // Stoktan düş
        const updateSql = `
          UPDATE customer_product_stocks 
          SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = ? AND product_id = ?
        `;
        
        db.run(updateSql, [quantity, customerId, productId], function(err) {
          db.close();
          if (err) {
            reject(err);
          } else {
            resolve({
              changes: this.changes,
              remainingStock: row.quantity - quantity
            });
          }
        });
      });
    });
  }

  // Müşterinin belirli ürün stokunu getir
  async getStock(customerId, productId) {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM customer_product_stocks 
        WHERE customer_id = ? AND product_id = ?
      `;
      
      db.get(sql, [customerId, productId], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Müşterinin tüm stoklarını getir
  async getCustomerStocks(customerId) {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM customer_product_stocks 
        WHERE customer_id = ? AND quantity > 0
        ORDER BY product_name ASC
      `;
      
      db.all(sql, [customerId], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Tüm stok listesini getir (admin için)
  async getAllStocks() {
    const db = this.getConnection();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          cps.*,
          c.name as customer_name
        FROM customer_product_stocks cps
        LEFT JOIN customers c ON cps.customer_id = c.id
        WHERE cps.quantity > 0
        ORDER BY c.name ASC, cps.product_name ASC
      `;
      
      db.all(sql, [], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

module.exports = CustomerProductStock; 