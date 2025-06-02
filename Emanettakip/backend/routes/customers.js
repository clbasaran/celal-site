const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Customer = require('../db/models/Customer');
const Delivery = require('../db/models/Delivery');
const Payment = require('../db/models/Payment');
const CustomerProductStock = require('../db/models/CustomerProductStock');

const router = express.Router();
const customerModel = new Customer();
const deliveryModel = new Delivery();
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

// Tüm müşterileri getir
router.get('/', async (req, res) => {
    try {
        const customers = await customerModel.getAll();
        res.json(customers);
    } catch (error) {
        console.error('Müşteri listesi hatası:', error);
        res.status(500).json({ error: 'Müşteri listesi alınırken hata oluştu' });
    }
});

// ID ile müşteri getir (detayları ile birlikte)
router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Müşteri bilgilerini al
        const customer = await customerModel.getById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }
        
        // Müşterinin teslimatlarını al
        const deliveries = await deliveryModel.getByCustomerId(id);
        
        // Müşterinin ödemelerini al
        const payments = await paymentModel.getByCustomerId(id);
        
        // Toplam borç ve ödeme hesapla
        const totalDebt = await deliveryModel.calculateCustomerDebt(id);
        const totalPayments = await paymentModel.calculateCustomerPayments(id);
        const remainingDebt = totalDebt - totalPayments;
        
        // Güncel borcu veritabanında güncelle
        await customerModel.updateDebt(id, remainingDebt);
        
        res.json({
            ...customer,
            total_debt: remainingDebt,
            deliveries,
            payments,
            summary: {
                total_debt: totalDebt,
                total_payments: totalPayments,
                remaining_debt: remainingDebt
            }
        });
    } catch (error) {
        console.error('Müşteri detay hatası:', error);
        res.status(500).json({ error: 'Müşteri detayları alınırken hata oluştu' });
    }
});

// Yeni müşteri oluştur
router.post('/', [
    // name: required, minimum 2 karakter
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Müşteri adı gereklidir')
        .isLength({ min: 2 })
        .withMessage('Müşteri adı en az 2 karakter olmalıdır'),
    
    // taxNumber: optional, numeric string
    body('taxNumber')
        .optional()
        .isNumeric()
        .withMessage('Vergi numarası sadece rakam içermelidir'),
    
    // address: optional
    body('address')
        .optional()
        .trim(),
    
    // phone: optional, minimum 10 karakter
    body('phone')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Telefon numarası en az 10 karakter olmalıdır')
], handleValidation, async (req, res) => {
    try {
        const { name, taxNumber, address, phone } = req.body;
        
        // Müşteri verilerini hazırla
        const customerData = {
            name,
            taxNumber: taxNumber || null,
            address: address || null,
            phone: phone || null
        };
        
        // Yeni müşteriyi oluştur
        const newCustomer = await customerModel.create(customerData);
        
        // 201 Created status ile başarılı yanıt döndür
        res.status(201).json({
            success: true,
            message: 'Müşteri başarıyla oluşturuldu',
            data: newCustomer
        });
    } catch (error) {
        console.error('Müşteri oluşturma hatası:', error);
        res.status(500).json({ 
            error: 'Müşteri oluşturulurken hata oluştu',
            message: error.message 
        });
    }
});

// Müşteri güncelle
router.put('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz'),
    body('name').trim().notEmpty().withMessage('Müşteri adı gereklidir'),
    body('phone').optional().isMobilePhone('tr-TR').withMessage('Geçerli telefon numarası giriniz'),
    body('email').optional().isEmail().withMessage('Geçerli email adresi giriniz'),
    body('address').optional().trim(),
    body('notes').optional().trim()
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const customerData = req.body;
        
        const result = await customerModel.update(id, customerData);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }
        
        res.json({ message: 'Müşteri başarıyla güncellendi' });
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error);
        res.status(500).json({ error: 'Müşteri güncellenirken hata oluştu' });
    }
});

// Müşteri sil
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await customerModel.delete(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }
        
        res.json({ message: 'Müşteri başarıyla silindi' });
    } catch (error) {
        console.error('Müşteri silme hatası:', error);
        res.status(500).json({ error: 'Müşteri silinirken hata oluştu' });
    }
});

// Müşteri borç özetini getir
router.get('/:id/debt-summary', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        const customer = await customerModel.getById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }
        
        const totalDebt = await deliveryModel.calculateCustomerDebt(id);
        const totalPayments = await paymentModel.calculateCustomerPayments(id);
        const remainingDebt = totalDebt - totalPayments;
        
        res.json({
            customer_name: customer.name,
            total_debt: totalDebt,
            total_payments: totalPayments,
            remaining_debt: remainingDebt,
            last_updated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Borç özeti hatası:', error);
        res.status(500).json({ error: 'Borç özeti alınırken hata oluştu' });
    }
});

// Müşterinin mevcut stoklarını getir (teslimat için)
router.get('/:id/stocks', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir müşteri ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Müşterinin varlığını kontrol et
        const customer = await customerModel.getById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı' });
        }
        
        // Müşterinin mevcut stoklarını getir
        const stocks = await stockModel.getCustomerStocks(id);
        
        // Teslimat formu için optimize edilmiş format
        const formattedStocks = stocks.map(stock => ({
            productId: stock.product_id,
            productName: stock.product_name,
            unit: stock.unit,
            quantity: stock.quantity,
            lastUpdated: stock.updated_at
        }));
        
        res.json(formattedStocks);
        
    } catch (error) {
        console.error('Müşteri stok getirme hatası:', error);
        res.status(500).json({ 
            error: 'Müşteri stokları alınırken hata oluştu',
            message: error.message 
        });
    }
});

module.exports = router; 