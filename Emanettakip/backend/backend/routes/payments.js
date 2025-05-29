const express = require('express');
const { param, body, validationResult } = require('express-validator');
const Payment = require('../db/models/Payment');
const CustomerProductStock = require('../db/models/CustomerProductStock');

const router = express.Router();
const paymentModel = new Payment();
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

// POST /api/payments - Yeni sipariş/ödeme ekle
router.post('/', [
    body('customerId').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz'),
    body('amount').isFloat({ min: 0 }).withMessage('Geçerli bir tutar giriniz'),
    body('method').notEmpty().withMessage('Ödeme yöntemi gereklidir'),
    body('products').isArray({ min: 1 }).withMessage('En az bir ürün gereklidir'),
    body('products.*.productId').isInt({ min: 1 }).withMessage('Geçerli ürün ID gereklidir'),
    body('products.*.quantity').isFloat({ min: 0.01 }).withMessage('Geçerli miktar gereklidir'),
    body('products.*.name').notEmpty().withMessage('Ürün adı gereklidir'),
    body('products.*.unit').notEmpty().withMessage('Ürün birimi gereklidir')
], handleValidation, async (req, res) => {
    try {
        const { customerId, amount, method, note, products } = req.body;
        
        // 1. Ödeme kaydını oluştur
        const paymentData = {
            customer_id: parseInt(customerId),
            amount: parseFloat(amount),
            payment_method: method,
            notes: note || null,
            payment_date: new Date().toISOString().split('T')[0]
        };
        
        const payment = await paymentModel.create(paymentData);
        
        // 2. Her ürün için stok güncelle
        for (const product of products) {
            await stockModel.upsertStock(
                parseInt(customerId),
                parseInt(product.productId),
                parseFloat(product.quantity),
                product.unit,
                product.name
            );
        }
        
        console.log(`✅ Sipariş kaydedildi - Müşteri: ${customerId}, Ürün sayısı: ${products.length}`);
        
        res.status(201).json({
            message: 'Sipariş başarıyla kaydedildi',
            payment: {
                id: payment.id,
                customerId: payment.customer_id,
                amount: payment.amount,
                method: payment.payment_method,
                date: payment.payment_date,
                note: payment.notes,
                products: products
            }
        });
        
    } catch (error) {
        console.error('Sipariş kaydetme hatası:', error);
        res.status(500).json({ 
            error: 'Sipariş kaydedilirken hata oluştu',
            message: error.message 
        });
    }
});

// GET /api/payments/customer/:id - Müşteriye ait tüm ödemeleri getir
router.get('/customer/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Müşteriye ait ödemeleri getir (tarih sırasına göre azalan - en yeni önce)
        const payments = await paymentModel.getByCustomerId(id);
        
        // Ödemeleri response formatına dönüştür
        const formattedPayments = payments.map(payment => ({
            id: payment.id,
            customerId: payment.customer_id,
            amount: payment.amount,
            method: payment.payment_method,
            date: payment.payment_date,
            note: payment.notes,
            installmentNumber: payment.installment_number,
            totalInstallments: payment.total_installments,
            receiptNumber: payment.receipt_number,
            status: payment.status,
            createdAt: payment.created_at,
            updatedAt: payment.updated_at
        }));
        
        // Başarılı yanıt döndür (boş array dahil)
        res.status(200).json(formattedPayments);
        
    } catch (error) {
        console.error('Müşteri ödemeleri getirme hatası:', error);
        res.status(500).json({ 
            error: 'Müşteri ödemeleri alınırken hata oluştu',
            message: error.message 
        });
    }
});

// GET /api/payments/customer/:id/stocks - Müşterinin stok durumunu getir
router.get('/customer/:id/stocks', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        const stocks = await stockModel.getCustomerStocks(id);
        
        res.status(200).json(stocks);
        
    } catch (error) {
        console.error('Müşteri stok getirme hatası:', error);
        res.status(500).json({ 
            error: 'Müşteri stokları alınırken hata oluştu',
            message: error.message 
        });
    }
});

module.exports = router; 