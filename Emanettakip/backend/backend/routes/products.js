const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Product = require('../db/models/Product');

const router = express.Router();
const productModel = new Product();

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

// GET /api/products - Tüm ürünleri getir
router.get('/', async (req, res) => {
    try {
        const products = await productModel.getAll();
        res.status(200).json(products);
    } catch (error) {
        console.error('Ürünler getirme hatası:', error);
        res.status(500).json({
            error: 'Ürünler alınırken hata oluştu',
            message: error.message
        });
    }
});

// GET /api/products/:id - ID'ye göre ürün getir
router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productModel.getById(id);
        
        if (!product) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Ürün getirme hatası:', error);
        res.status(500).json({
            error: 'Ürün alınırken hata oluştu',
            message: error.message
        });
    }
});

// POST /api/products - Yeni ürün ekle
router.post('/', [
    body('productName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Ürün adı en az 2 karakter olmalıdır'),
    body('unit')
        .trim()
        .isIn(['kg', 'ton', 'litre', 'çuval', 'adet', 'kutu'])
        .withMessage('Geçerli bir birim seçiniz (kg, ton, litre, çuval, adet, kutu)'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Açıklama en fazla 500 karakter olabilir')
], handleValidation, async (req, res) => {
    try {
        const { productName, unit, description } = req.body;
        
        const newProduct = await productModel.create({
            productName: productName.trim(),
            unit: unit.trim(),
            description: description?.trim() || null
        });
        
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({
            error: 'Ürün eklenirken hata oluştu',
            message: error.message
        });
    }
});

// PUT /api/products/:id - Ürün güncelle
router.put('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID giriniz'),
    body('productName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Ürün adı en az 2 karakter olmalıdır'),
    body('unit')
        .optional()
        .trim()
        .isIn(['kg', 'ton', 'litre', 'çuval', 'adet', 'kutu'])
        .withMessage('Geçerli bir birim seçiniz (kg, ton, litre, çuval, adet, kutu)'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Açıklama en fazla 500 karakter olabilir')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, unit, description } = req.body;
        
        const result = await productModel.update(id, {
            productName: productName?.trim(),
            unit: unit?.trim(),
            description: description?.trim() || null
        });
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        
        // Updated product'ı getir
        const updatedProduct = await productModel.getById(id);
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({
            error: 'Ürün güncellenirken hata oluştu',
            message: error.message
        });
    }
});

// DELETE /api/products/:id - Ürün sil
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('Geçerli bir ürün ID giriniz')
], handleValidation, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await productModel.delete(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }
        
        res.status(200).json({
            message: 'Ürün başarıyla silindi',
            id: parseInt(id)
        });
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        res.status(500).json({
            error: 'Ürün silinirken hata oluştu',
            message: error.message
        });
    }
});

module.exports = router; 