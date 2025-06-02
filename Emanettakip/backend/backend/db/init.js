const Customer = require('./models/Customer');
const Delivery = require('./models/Delivery');
const Payment = require('./models/Payment');
const Product = require('./models/Product');
const ReceiptRecord = require('./models/ReceiptRecord');
const TransactionLog = require('./models/TransactionLog');

async function initializeDatabase() {
    try {
        console.log('🔧 Veritabanı başlatılıyor...');
        
        // Model instance'ları oluştur
        const customerModel = new Customer();
        const deliveryModel = new Delivery();
        const paymentModel = new Payment();
        const productModel = new Product();
        
        // Tabloları oluştur
        await customerModel.createTable();
        console.log('✅ Müşteri tablosu oluşturuldu');
        
        await deliveryModel.createTable();
        console.log('✅ Teslimat tablosu oluşturuldu');
        
        await paymentModel.createTable();
        console.log('✅ Ödeme tablosu oluşturuldu');
        
        await productModel.createTable();
        console.log('✅ Ürün tablosu oluşturuldu');
        
        // Yeni tabloları oluştur
        await ReceiptRecord.createTable();
        console.log('✅ Fiş kayıt tablosu oluşturuldu');
        
        await TransactionLog.createTable();
        console.log('✅ İşlem log tablosu oluşturuldu');
        
        // Örnek müşteri verisi ekle (sadece tablo boşsa)
        const customers = await customerModel.getAll();
        if (customers.length === 0) {
            await createSampleData(customerModel, deliveryModel, paymentModel, productModel);
        }
        
        console.log('🎉 Veritabanı başarıyla başlatıldı!');
        
    } catch (error) {
        console.error('❌ Veritabanı başlatma hatası:', error);
        process.exit(1);
    }
}

async function createSampleData(customerModel, deliveryModel, paymentModel, productModel) {
    try {
        console.log('📝 Örnek veriler oluşturuluyor...');
        
        // Örnek müşteriler
        const sampleCustomers = [
            {
                name: 'Ahmet Yılmaz',
                phone: '0532 123 4567',
                address: 'Merkez Mahallesi, Ankara',
                email: 'ahmet@example.com',
                notes: 'Düzenli müşteri, ödemeler zamanında'
            },
            {
                name: 'Fatma Kaya',
                phone: '0543 987 6543',
                address: 'Çamlık Köyü, Ankara',
                email: 'fatma@example.com',
                notes: 'Sebze üreticisi'
            },
            {
                name: 'Mehmet Öz',
                phone: '0555 111 2233',
                address: 'Tarım Mahallesi, Ankara',
                email: 'mehmet@example.com',
                notes: 'Büyük çiftlik sahibi'
            }
        ];
        
        for (const customer of sampleCustomers) {
            await customerModel.create(customer);
        }
        
        console.log('✅ Örnek müşteri verileri oluşturuldu');
        
        // Örnek ürünler
        await productModel.insertSampleData();
        console.log('✅ Örnek ürün verileri oluşturuldu');
        
        // Örnek teslimat
        const sampleDelivery = {
            customer_id: 1,
            week_number: 45,
            year: 2024,
            delivery_date: '2024-11-10',
            items: [
                { name: 'Buğday Tohumu', quantity: 50, unit: 'kg', price: 15, total: 750 },
                { name: 'NPK Gübre', quantity: 25, unit: 'kg', price: 25, total: 625 }
            ],
            total_amount: 1375,
            notes: 'Kış ekimi için teslimat',
            status: 'delivered'
        };
        
        await deliveryModel.create(sampleDelivery);
        console.log('✅ Örnek teslimat verisi oluşturuldu');
        
        // Örnek ödeme
        const samplePayment = {
            customer_id: 1,
            amount: 500,
            payment_date: '2024-11-15',
            payment_method: 'cash',
            installment_number: 1,
            total_installments: 3,
            receipt_number: 'MKB000001',
            notes: '1. taksit ödemesi',
            status: 'completed'
        };
        
        await paymentModel.create(samplePayment);
        console.log('✅ Örnek ödeme verisi oluşturuldu');
        
        // Müşteri borcunu güncelle
        await customerModel.updateDebt(1, 875); // 1375 - 500 = 875
        console.log('✅ Müşteri borcu güncellendi');
        
    } catch (error) {
        console.error('❌ Örnek veri oluşturma hatası:', error);
        throw error;
    }
}

// Direkt çalıştırılırsa init fonksiyonunu çağır
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase }; 