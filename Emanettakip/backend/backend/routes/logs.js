const express = require('express');
const router = express.Router();
const TransactionLog = require('../db/models/TransactionLog');

// GET /api/logs - Tüm işlem logları (filtreli + sayfalama)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    // Filtreleme parametreleri
    const filters = {
      entity: req.query.entity,
      actionType: req.query.actionType,
      entityId: req.query.entityId ? parseInt(req.query.entityId) : null,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Limit kontrolü
    if (limit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Limit değeri 1000\'den büyük olamaz'
      });
    }

    // Null değerleri temizle
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const logs = await TransactionLog.findAll(limit, offset, filters);
    
    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        count: logs.length
      },
      filters: filters
    });

  } catch (error) {
    console.error('Log listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Log listesi getirilirken hata oluştu',
      details: error.message
    });
  }
});

// GET /api/logs/customer/:id - Müşteri bazlı işlem geçmişi
router.get('/customer/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz müşteri ID'
      });
    }

    const logs = await TransactionLog.findByCustomerId(customerId, limit, offset);
    
    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        limit,
        offset,
        count: logs.length
      }
    });

  } catch (error) {
    console.error('Müşteri log geçmişi getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Müşteri log geçmişi getirilirken hata oluştu',
      details: error.message
    });
  }
});

// GET /api/logs/statistics - İşlem istatistikleri
router.get('/statistics', async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const statistics = await TransactionLog.getStatistics(startDate, endDate);
    
    // İstatistikleri daha okunaklı formata çevir
    const summary = statistics.reduce((acc, stat) => {
      if (!acc[stat.entity]) {
        acc[stat.entity] = {};
      }
      acc[stat.entity][stat.action_type] = stat.count;
      return acc;
    }, {});

    // Toplam sayıları hesapla
    const totals = {
      totalTransactions: statistics.reduce((sum, stat) => sum + stat.count, 0),
      byEntity: {},
      byAction: {}
    };

    statistics.forEach(stat => {
      totals.byEntity[stat.entity] = (totals.byEntity[stat.entity] || 0) + stat.count;
      totals.byAction[stat.action_type] = (totals.byAction[stat.action_type] || 0) + stat.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        detailed: summary,
        totals: totals,
        raw: statistics
      },
      filters: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Log istatistikleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Log istatistikleri getirilirken hata oluştu',
      details: error.message
    });
  }
});

// POST /api/logs - Yeni log kaydı oluştur (manuel log kayıtları için)
router.post('/', async (req, res) => {
  try {
    const { actionType, entity, entityId, detail } = req.body;

    // Gerekli alanların kontrolü
    if (!actionType || !entity) {
      return res.status(400).json({
        success: false,
        error: 'actionType ve entity alanları gerekli'
      });
    }

    // Enum kontrolü
    const validActionTypes = ['create', 'update', 'delete', 'print', 'view'];
    const validEntities = ['payment', 'delivery', 'receipt', 'customer', 'product'];

    if (!validActionTypes.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: `Geçersiz actionType. Geçerli değerler: ${validActionTypes.join(', ')}`
      });
    }

    if (!validEntities.includes(entity)) {
      return res.status(400).json({
        success: false,
        error: `Geçersiz entity. Geçerli değerler: ${validEntities.join(', ')}`
      });
    }

    const logData = {
      actionType,
      entity,
      entityId: entityId ? parseInt(entityId) : null,
      detail: detail || `Manual ${actionType} ${entity} log`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const log = await TransactionLog.create(logData);
    
    res.status(201).json({
      success: true,
      message: 'Log kaydı başarıyla oluşturuldu',
      data: log
    });

  } catch (error) {
    console.error('Log oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Log kaydı oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

module.exports = router; 