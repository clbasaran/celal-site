const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

// Models
const CustomerProductStock = require('./db/models/CustomerProductStock');
const { initializeDatabase } = require('./db/init');
const BackupService = require('./services/backupService');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database tables
async function initializeAllTables() {
  try {
    // Tüm tabloları oluştur (yeni tablolar dahil)
    await initializeDatabase();
    
    // Stok tablosu kontrolü
    const stockModel = new CustomerProductStock();
    await stockModel.createTable();
    console.log('✅ Tüm veritabanı tabloları hazır');
  } catch (error) {
    console.error('❌ Veritabanı başlatma hatası:', error);
  }
}

// Zamanlanmış yedekleme görevi
function startBackupScheduler() {
  // Her gün saat 02:00'de otomatik yedekleme
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🕐 Otomatik yedekleme başlatıldı (02:00)...');
      const summary = await BackupService.backupAll();
      console.log('✅ Otomatik yedekleme tamamlandı:', summary.totalRows, 'kayıt');
      
      // Eski yedekleri temizle (30 günden eski)
      const cleanup = await BackupService.deleteOldBackups(30);
      if (cleanup.deletedCount > 0) {
        console.log(`🧹 ${cleanup.deletedCount} eski yedek temizlendi`);
      }
      
    } catch (error) {
      console.error('❌ Otomatik yedekleme hatası:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });

  // Haftalık temizlik (her Pazar 03:00)
  cron.schedule('0 3 * * 0', async () => {
    try {
      console.log('🧽 Haftalık temizlik başlatıldı...');
      const cleanup = await BackupService.deleteOldBackups(7); // 1 haftadan eski
      console.log(`🗑️ ${cleanup.deletedCount} eski yedek temizlendi`);
    } catch (error) {
      console.error('❌ Haftalık temizlik hatası:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });

  // Haftalık yedekleme raporu (her Pazar 09:00)
  cron.schedule('0 9 * * 0', async () => {
    try {
      console.log('📧 Haftalık yedekleme raporu gönderiliyor...');
      const result = await BackupService.sendWeeklyReport();
      console.log('✅ Haftalık rapor gönderildi:', result.recipient);
    } catch (error) {
      console.error('❌ Haftalık rapor hatası:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });

  console.log('⏰ Yedekleme zamanlayıcısı başlatıldı:');
  console.log('   📅 Günlük yedekleme: 02:00');
  console.log('   🧹 Haftalık temizlik: Pazar 03:00');
  console.log('   📧 Haftalık rapor: Pazar 09:00');
}

// Initialize on startup
initializeAllTables().then(() => {
  // Sunucu başlatıldıktan sonra zamanlayıcıyı çalıştır
  startBackupScheduler();
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // Her IP için maksimum 100 istek
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});
app.use(limiter);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/products', require('./routes/products'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/backup', require('./routes/backup'));

// Test route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Emanet Takip API çalışıyor',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Sunucu hatası oluştu',
        message: process.env.NODE_ENV === 'development' ? err.message : 'İç server hatası'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Sayfa bulunamadı' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
}); 