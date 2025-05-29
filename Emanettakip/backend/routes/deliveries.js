const express = require('express');
const { param, body, validationResult } = require('express-validator');
const CustomerProductStock = require('../db/models/CustomerProductStock');

const router = express.Router();
const stockModel = new CustomerProductStock();

// Validation middleware
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Geçersiz veri',
            details: errors.array()
        });
    }
    next();
};

// In-memory storage for deliveries (replace with database later)
let deliveries = [
    {
        id: 1,
        customerId: 1,
        productId: 1,
        productName: 'Buğday Tohumu',
        quantity: 25,
        unit: 'kg',
        deliveryDate: '2025-05-20',
        note: 'İlk teslimat',
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        customerId: 1,
        productId: 5,
        productName: 'NPK Gübre',
        quantity: 15,
        unit: 'kg',
        deliveryDate: '2025-05-22',
        note: null,
        createdAt: new Date().toISOString()
    }
];

let nextId = 3;

// GET /api/deliveries/customer/:id - Müşteriye ait tüm teslimatları getir
router.get('/customer/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = parseInt(id);
        
        // Müşteriye ait teslimatları filtrele
        const customerDeliveries = deliveries.filter(delivery => delivery.customerId === customerId);
        
        // Tarihe göre sırala (en yeni önce)
        customerDeliveries.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));
        
        res.status(200).json(customerDeliveries);
        
    } catch (error) {
        console.error('Müşteri teslimatları getirme hatası:', error);
        res.status(500).json({ 
            error: 'Müşteri teslimatları alınırken hata oluştu',
            message: error.message 
        });
    }
});

// POST /api/deliveries - Yeni teslimat ekle (STOK KONTROLÜ İLE)
router.post('/', [
    body('customerId').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz'),
    body('productId').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID giriniz'),
    body('productName').trim().isLength({ min: 1 }).withMessage('Ürün adı gereklidir'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Miktar 0\'dan büyük olmalıdır'),
    body('unit').trim().isLength({ min: 1 }).withMessage('Birim gereklidir'),
    body('deliveryDate').isISO8601().withMessage('Geçerli bir tarih giriniz'),
    body('note').optional()
], handleValidation, async (req, res) => {
    try {
        const { customerId, productId, productName, quantity, unit, deliveryDate, note } = req.body;
        
        const customerIdInt = parseInt(customerId);
        const productIdInt = parseInt(productId);
        const quantityFloat = parseFloat(quantity);
        
        // 1. Stok kontrolü yap
        try {
            const result = await stockModel.decrementStock(customerIdInt, productIdInt, quantityFloat);
            console.log(`✅ Stok güncellendi - Kalan: ${result.remainingStock} ${unit}`);
        } catch (stockError) {
            return res.status(400).json({ 
                error: 'Stok Yetersiz',
                message: stockError.message,
                type: 'INSUFFICIENT_STOCK'
            });
        }
        
        // 2. Teslimat kaydını oluştur
        const newDelivery = {
            id: nextId++,
            customerId: customerIdInt,
            productId: productIdInt,
            productName: productName.trim(),
            quantity: quantityFloat,
            unit: unit.trim(),
            deliveryDate,
            note: note?.trim() || null,
            createdAt: new Date().toISOString()
        };
        
        deliveries.push(newDelivery);
        
        // 3. Güncel stok bilgisiyle birlikte response döndür
        const currentStock = await stockModel.getStock(customerIdInt, productIdInt);
        
        res.status(201).json({
            delivery: newDelivery,
            remainingStock: currentStock ? currentStock.quantity : 0,
            message: 'Teslimat başarıyla kaydedildi'
        });
        
    } catch (error) {
        console.error('Teslimat ekleme hatası:', error);
        res.status(500).json({ 
            error: 'Teslimat eklenirken hata oluştu',
            message: error.message 
        });
    }
});

// PUT /api/deliveries/:id - Teslimat güncelle
router.put('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir teslimat ID giriniz'),
    body('productName').optional().trim().isLength({ min: 1 }).withMessage('Ürün adı gereklidir'),
    body('quantity').optional().isFloat({ min: 0.01 }).withMessage('Miktar 0\'dan büyük olmalıdır'),
    body('unit').optional().trim().isLength({ min: 1 }).withMessage('Birim gereklidir'),
    body('deliveryDate').optional().isISO8601().withMessage('Geçerli bir tarih giriniz'),
    body('note').optional()
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const deliveryId = parseInt(id);
        
        const deliveryIndex = deliveries.findIndex(delivery => delivery.id === deliveryId);
        
        if (deliveryIndex === -1) {
            return res.status(404).json({ error: 'Teslimat bulunamadı' });
        }
        
        // Update delivery
        const updatedDelivery = {
            ...deliveries[deliveryIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        deliveries[deliveryIndex] = updatedDelivery;
        
        res.status(200).json(updatedDelivery);
        
    } catch (error) {
        console.error('Teslimat güncelleme hatası:', error);
        res.status(500).json({ 
            error: 'Teslimat güncellenirken hata oluştu',
            message: error.message 
        });
    }
});

// DELETE /api/deliveries/:id - Teslimat sil
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir teslimat ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const deliveryId = parseInt(id);
        
        const deliveryIndex = deliveries.findIndex(delivery => delivery.id === deliveryId);
        
        if (deliveryIndex === -1) {
            return res.status(404).json({ error: 'Teslimat bulunamadı' });
        }
        
        const deletedDelivery = deliveries.splice(deliveryIndex, 1)[0];
        
        res.status(200).json({ 
            message: 'Teslimat başarıyla silindi',
            delivery: deletedDelivery 
        });
        
    } catch (error) {
        console.error('Teslimat silme hatası:', error);
        res.status(500).json({ 
            error: 'Teslimat silinirken hata oluştu',
            message: error.message 
        });
    }
});

module.exports = router; 