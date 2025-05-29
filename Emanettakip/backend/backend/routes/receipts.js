const express = require('express');
const router = express.Router();
const ReceiptRecord = require('../db/models/ReceiptRecord');
const TransactionLog = require('../db/models/TransactionLog');

// Middleware: İşlem loglaması
const logTransaction = (actionType, entity) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Başarılı işlemler için log oluştur
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const logData = {
            actionType,
            entity,
            entityId: req.params.id || (res.locals.entityId) || null,
            detail: `${actionType} ${entity} - ${req.method} ${req.originalUrl}`,
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
};

// POST /api/receipts/record - Fiş yazdırma kaydı oluştur
router.post('/record', logTransaction('print', 'receipt'), async (req, res) => {
  try {
    const { type, referenceId, customerId, content, documentNumber } = req.body;

    // Gerekli alanların kontrolü
    if (!type || !customerId || !content) {
      return res.status(400).json({
        success: false,
        error: 'type, customerId ve content alanları gerekli'
      });
    }

    // Type kontrolü
    if (!['delivery', 'payment', 'batch_delivery'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz fiş tipi. Geçerli tipler: delivery, payment, batch_delivery'
      });
    }

    // Aynı referans ID ile daha önce yazdırılmış mı kontrol et
    if (referenceId) {
      const existingRecords = await ReceiptRecord.findAll(1000, 0);
      const existingRecord = existingRecords.find(record => 
        record.type === type && 
        record.referenceId === referenceId && 
        record.customerId === customerId
      );

      if (existingRecord) {
        return res.status(200).json({
          success: true,
          message: 'Bu fiş daha önce yazdırılmış',
          data: existingRecord,
          isExisting: true
        });
      }
    }

    const receiptData = {
      type,
      referenceId,
      customerId: parseInt(customerId),
      content
    };

    const receipt = await ReceiptRecord.create(receiptData);
    
    // Response için entityId set et (log için)
    res.locals.entityId = receipt.id;

    res.status(201).json({
      success: true,
      message: 'Fiş kaydı başarıyla oluşturuldu',
      data: receipt
    });

  } catch (error) {
    console.error('Fiş kayıt oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiş kaydı oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// GET /api/receipts/customer/:id - Müşteri bazlı fiş geçmişi
router.get('/customer/:id', logTransaction('view', 'receipt'), async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz müşteri ID'
      });
    }

    const receipts = await ReceiptRecord.findByCustomerId(customerId);
    
    res.status(200).json({
      success: true,
      data: receipts
    });

  } catch (error) {
    console.error('Müşteri fiş geçmişi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiş geçmişi getirilirken hata oluştu',
      details: error.message
    });
  }
});

// GET /api/receipts - Tüm fiş kayıtları (sayfalama ile)
router.get('/', logTransaction('view', 'receipt'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const type = req.query.type;

    // Limit kontrolü
    if (limit > 500) {
      return res.status(400).json({
        success: false,
        error: 'Limit değeri 500\'den büyük olamaz'
      });
    }

    let receipts;
    if (type && ['delivery', 'payment', 'batch_delivery'].includes(type)) {
      // Type filtreli sorgulama - basit implementasyon
      const allReceipts = await ReceiptRecord.findAll(1000, 0);
      receipts = allReceipts
        .filter(receipt => receipt.type === type)
        .slice(offset, offset + limit);
    } else {
      receipts = await ReceiptRecord.findAll(limit, offset);
    }
    
    res.status(200).json({
      success: true,
      data: receipts,
      pagination: {
        limit,
        offset,
        count: receipts.length
      }
    });

  } catch (error) {
    console.error('Fiş listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Fiş listesi getirilirken hata oluştu',
      details: error.message
    });
  }
});

// GET /api/receipts/:documentNumber - Belge numarasına göre fiş getir
router.get('/:documentNumber', logTransaction('view', 'receipt'), async (req, res) => {
  try {
    const { documentNumber } = req.params;
    
    const receipt = await ReceiptRecord.findByDocumentNumber(documentNumber);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Belge bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: receipt
    });

  } catch (error) {
    console.error('Belge getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Belge getirilirken hata oluştu',
      details: error.message
    });
  }
});

module.exports = router; 