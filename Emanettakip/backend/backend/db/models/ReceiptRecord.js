const Database = require('sqlite3').Database;
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

class ReceiptRecord {
  static async createTable() {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS receipt_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('delivery', 'payment', 'batch_delivery')),
          reference_id INTEGER,
          customer_id INTEGER NOT NULL,
          content_json TEXT NOT NULL,
          document_number TEXT UNIQUE NOT NULL,
          printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
      `, (err) => {
        db.close();
        if (err) {
          console.error('ReceiptRecord table creation error:', err);
          reject(err);
        } else {
          console.log('ReceiptRecord table created successfully');
          resolve();
        }
      });
    });
  }

  static async generateDocumentNumber(type) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      // Prefix belirleme
      const prefix = {
        'delivery': 'T',
        'payment': 'P', 
        'batch_delivery': 'TT'
      }[type];

      // Son belge numarasını bul
      db.get(`
        SELECT document_number 
        FROM receipt_records 
        WHERE type = ? AND document_number LIKE ?
        ORDER BY id DESC 
        LIMIT 1
      `, [type, `${prefix}-%`], (err, row) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        let nextNumber = 1;
        if (row && row.document_number) {
          const lastNumber = parseInt(row.document_number.split('-')[1]) || 0;
          nextNumber = lastNumber + 1;
        }

        const documentNumber = `${prefix}-${nextNumber.toString().padStart(7, '0')}`;
        db.close();
        resolve(documentNumber);
      });
    });
  }

  static async create(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const documentNumber = await this.generateDocumentNumber(data.type);
        
        const db = new Database(dbPath);
        
        const query = `
          INSERT INTO receipt_records (
            type, reference_id, customer_id, content_json, document_number, printed_at
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        const values = [
          data.type,
          data.referenceId || null,
          data.customerId,
          JSON.stringify(data.content),
          documentNumber
        ];
        
        db.run(query, values, function(err) {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          const receiptId = this.lastID;
          
          // Oluşturulan kaydı geri getir
          db.get(`
            SELECT * FROM receipt_records WHERE id = ?
          `, [receiptId], (err, row) => {
            db.close();
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              id: row.id,
              type: row.type,
              referenceId: row.reference_id,
              customerId: row.customer_id,
              content: JSON.parse(row.content_json),
              documentNumber: row.document_number,
              printedAt: row.printed_at,
              createdAt: row.created_at
            });
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static async findByCustomerId(customerId) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.all(`
        SELECT rr.*, c.name as customer_name
        FROM receipt_records rr
        LEFT JOIN customers c ON rr.customer_id = c.id
        WHERE rr.customer_id = ?
        ORDER BY rr.created_at DESC
      `, [customerId], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        const records = rows.map(row => ({
          id: row.id,
          type: row.type,
          referenceId: row.reference_id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          content: JSON.parse(row.content_json),
          documentNumber: row.document_number,
          printedAt: row.printed_at,
          createdAt: row.created_at
        }));
        
        resolve(records);
      });
    });
  }

  static async findAll(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.all(`
        SELECT rr.*, c.name as customer_name
        FROM receipt_records rr
        LEFT JOIN customers c ON rr.customer_id = c.id
        ORDER BY rr.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        const records = rows.map(row => ({
          id: row.id,
          type: row.type,
          referenceId: row.reference_id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          content: JSON.parse(row.content_json),
          documentNumber: row.document_number,
          printedAt: row.printed_at,
          createdAt: row.created_at
        }));
        
        resolve(records);
      });
    });
  }

  static async findByDocumentNumber(documentNumber) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.get(`
        SELECT rr.*, c.name as customer_name
        FROM receipt_records rr
        LEFT JOIN customers c ON rr.customer_id = c.id
        WHERE rr.document_number = ?
      `, [documentNumber], (err, row) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve({
          id: row.id,
          type: row.type,
          referenceId: row.reference_id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          content: JSON.parse(row.content_json),
          documentNumber: row.document_number,
          printedAt: row.printed_at,
          createdAt: row.created_at
        });
      });
    });
  }
}

module.exports = ReceiptRecord; 