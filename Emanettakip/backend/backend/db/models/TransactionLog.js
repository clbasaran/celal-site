const Database = require('sqlite3').Database;
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

class TransactionLog {
  static async createTable() {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS transaction_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'print', 'view')),
          entity TEXT NOT NULL CHECK (entity IN ('payment', 'delivery', 'receipt', 'customer', 'product')),
          entity_id INTEGER,
          detail TEXT,
          ip_address TEXT,
          user_agent TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        db.close();
        if (err) {
          console.error('TransactionLog table creation error:', err);
          reject(err);
        } else {
          console.log('TransactionLog table created successfully');
          resolve();
        }
      });
    });
  }

  static async create(data) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      const query = `
        INSERT INTO transaction_logs (
          user_id, action_type, entity, entity_id, detail, ip_address, user_agent, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const values = [
        data.userId || null,
        data.actionType,
        data.entity,
        data.entityId || null,
        data.detail || null,
        data.ipAddress || null,
        data.userAgent || null
      ];
      
      db.run(query, values, function(err) {
        if (err) {
          db.close();
          reject(err);
          return;
        }
        
        const logId = this.lastID;
        
        // Oluşturulan log kaydını geri getir
        db.get(`
          SELECT * FROM transaction_logs WHERE id = ?
        `, [logId], (err, row) => {
          db.close();
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            id: row.id,
            userId: row.user_id,
            actionType: row.action_type,
            entity: row.entity,
            entityId: row.entity_id,
            detail: row.detail,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            timestamp: row.timestamp,
            createdAt: row.created_at
          });
        });
      });
    });
  }

  static async findAll(limit = 100, offset = 0, filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      let whereClause = '';
      let params = [];
      
      if (filters.entity) {
        whereClause += ' WHERE entity = ?';
        params.push(filters.entity);
      }
      
      if (filters.actionType) {
        whereClause += whereClause ? ' AND action_type = ?' : ' WHERE action_type = ?';
        params.push(filters.actionType);
      }
      
      if (filters.entityId) {
        whereClause += whereClause ? ' AND entity_id = ?' : ' WHERE entity_id = ?';
        params.push(filters.entityId);
      }
      
      if (filters.startDate) {
        whereClause += whereClause ? ' AND timestamp >= ?' : ' WHERE timestamp >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        whereClause += whereClause ? ' AND timestamp <= ?' : ' WHERE timestamp <= ?';
        params.push(filters.endDate);
      }
      
      params.push(limit, offset);
      
      db.all(`
        SELECT * FROM transaction_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        const logs = rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          actionType: row.action_type,
          entity: row.entity,
          entityId: row.entity_id,
          detail: row.detail,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          timestamp: row.timestamp,
          createdAt: row.created_at
        }));
        
        resolve(logs);
      });
    });
  }

  static async findByCustomerId(customerId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      db.all(`
        SELECT tl.* FROM transaction_logs tl
        WHERE 
          (tl.entity = 'payment' AND tl.entity_id IN (
            SELECT id FROM payments WHERE customer_id = ?
          )) OR
          (tl.entity = 'delivery' AND tl.entity_id IN (
            SELECT id FROM deliveries WHERE customer_id = ?
          )) OR
          (tl.entity = 'receipt' AND tl.entity_id IN (
            SELECT id FROM receipt_records WHERE customer_id = ?
          )) OR
          (tl.entity = 'customer' AND tl.entity_id = ?)
        ORDER BY tl.timestamp DESC
        LIMIT ? OFFSET ?
      `, [customerId, customerId, customerId, customerId, limit, offset], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        const logs = rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          actionType: row.action_type,
          entity: row.entity,
          entityId: row.entity_id,
          detail: row.detail,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          timestamp: row.timestamp,
          createdAt: row.created_at
        }));
        
        resolve(logs);
      });
    });
  }

  static async getStatistics(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
      const db = new Database(dbPath);
      
      let whereClause = '';
      let params = [];
      
      if (startDate) {
        whereClause += ' WHERE timestamp >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        whereClause += whereClause ? ' AND timestamp <= ?' : ' WHERE timestamp <= ?';
        params.push(endDate);
      }
      
      db.all(`
        SELECT 
          action_type,
          entity,
          COUNT(*) as count
        FROM transaction_logs
        ${whereClause}
        GROUP BY action_type, entity
        ORDER BY count DESC
      `, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows);
      });
    });
  }

  // Middleware fonksiyonu - Express middleware olarak kullanılabilir
  static createLogMiddleware(actionType, entity) {
    return async (req, res, next) => {
      try {
        const originalSend = res.send;
        
        res.send = function(data) {
          // Başarılı işlemler için log oluştur
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const logData = {
              actionType,
              entity,
              entityId: req.params.id || req.body.id || null,
              detail: `${actionType} ${entity} - Status: ${res.statusCode}`,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent')
            };
            
            TransactionLog.create(logData).catch(console.error);
          }
          
          originalSend.call(this, data);
        };
        
        next();
      } catch (error) {
        console.error('Log middleware error:', error);
        next();
      }
    };
  }
}

module.exports = TransactionLog; 