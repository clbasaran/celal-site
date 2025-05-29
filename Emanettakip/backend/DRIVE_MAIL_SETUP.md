# 🌐 Google Drive & 📧 Mail Entegrasyonu Kurulum Rehberi

## 🌟 Genel Bakış

Bu sistem, Emanet Takip Sistemi yedeklemelerini otomatik olarak Google Drive'a yükler ve haftalık raporları e-posta ile gönderir.

## 🌐 Google Drive API Kurulumu

### 1. Google Cloud Console Projesi Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com) adresine gidin
2. Yeni proje oluşturun veya mevcut bir projeyi seçin
3. **APIs & Services** > **Library** bölümüne gidin
4. **Google Drive API**'yi arayın ve etkinleştirin

### 2. Service Account Oluşturma

1. **APIs & Services** > **Credentials** bölümüne gidin
2. **Create Credentials** > **Service Account** seçin
3. Service account adı girin (örn: `emanet-takip-backup`)
4. **Role** olarak **Editor** veya **Storage Admin** seçin
5. **Done** butonuna tıklayın

### 3. Service Account Key Oluşturma

1. Oluşturduğunuz service account'a tıklayın
2. **Keys** sekmesine gidin
3. **Add Key** > **Create new key** seçin
4. **JSON** formatını seçin ve **Create** butonuna tıklayın
5. İndirilen JSON dosyasını güvenli bir yerde saklayın

### 4. Environment Variables Kurulumu

`.env` dosyasına aşağıdaki bilgileri ekleyin:

```env
# Google Drive API Settings
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Not:** Private key'deki `\n` karakterlerini koruyun.

### 5. Google Drive Klasör İzinleri

Service account'ın Google Drive'da dosya oluşturabilmesi için:

1. Google Drive'da `EmanetTakipYedekleri` klasörünü manuel oluşturun (isteğe bağlı)
2. Service account email adresini bu klasöre **Editor** yetkisiyle ekleyin
3. Veya sistem otomatik olarak klasörü oluşturacaktır

## 📧 E-posta Kurulumu

### Gmail ile Kurulum (Önerilen)

1. Gmail hesabınızda 2FA'yı etkinleştirin
2. **App Passwords** oluşturun:
   - Google Hesap Ayarları > Güvenlik > 2-Step Verification
   - **App passwords** bölümüne gidin
   - **Select app**: Mail, **Select device**: Other
   - Uygulama adı girin ve **Generate** tıklayın
   - 16 haneli şifreyi kopyalayın

### Environment Variables

`.env` dosyasına ekleyin:

```env
# Mail Settings
MAIL_SERVICE=gmail
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-digit-app-password

# Backup Report Settings
BACKUP_REPORT_EMAIL=admin@yourcompany.com
```

### Diğer E-posta Sağlayıcıları

```env
# Outlook/Hotmail
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_SECURE=false

# Yahoo
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_SECURE=false

# Custom SMTP
MAIL_HOST=mail.yourcompany.com
MAIL_PORT=465
MAIL_SECURE=true
```

## 🔧 Sistem Özellikleri

### Otomatik Yedekleme
- **Günlük:** Her gün 02:00'de otomatik yedekleme
- **Drive Upload:** JSON ve ZIP dosyaları otomatik yüklenir
- **Temizlik:** 30 günden eski yerel dosyalar silinir

### Haftalık Raporlar
- **Zamanlama:** Her Pazar 09:00'da otomatik gönderim
- **İçerik:** 7 günlük yedekleme özeti, Drive durumu, hata analizi
- **Format:** Profesyonel HTML e-posta

### Cron Görevleri
```javascript
// Günlük yedekleme (02:00)
cron.schedule('0 2 * * *', backupTask);

// Haftalık temizlik (Pazar 03:00)
cron.schedule('0 3 * * 0', cleanupTask);

// Haftalık rapor (Pazar 09:00)
cron.schedule('0 9 * * 0', reportTask);
```

## 🧪 Test Endpoint'leri

### Manuel Yedekleme
```bash
curl http://localhost:3001/api/backup/manual
```

### Google Drive Durumu
```bash
curl http://localhost:3001/api/backup/drive/status
```

### Test E-postası
```bash
curl -X POST http://localhost:3001/api/backup/mail/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Haftalık Rapor Test
```bash
curl -X POST http://localhost:3001/api/backup/report/test
```

## 🔒 Güvenlik Önlemleri

### Environment Dosyası Güvenliği
```bash
# .env dosyasının izinlerini sınırlayın
chmod 600 .env

# Git'e eklenmediğinden emin olun
echo ".env" >> .gitignore
```

### Service Account İzinleri
- Minimum gerekli yetkileri verin
- Sadece gerekli API'leri etkinleştirin
- Düzenli olarak kullanım loglarını kontrol edin

### E-posta Güvenliği
- App Password kullanın (ana şifre değil)
- 2FA'yı etkinleştirin
- Düzenli olarak app password'leri yenileyin

## 🚨 Sorun Giderme

### Google Drive Hataları
```bash
# Credentials kontrolü
❌ Google Drive credentials bulunamadı
✅ Çözüm: .env dosyasında GOOGLE_CLIENT_EMAIL ve GOOGLE_PRIVATE_KEY kontrol edin

# Yetki hatası
❌ 403 Forbidden
✅ Çözüm: Service account'a Drive API yetkisi verin
```

### E-posta Hataları
```bash
# Authentication hatası
❌ Invalid login
✅ Çözüm: App password kullanıp MAIL_USER/MAIL_PASSWORD kontrol edin

# SMTP hatası
❌ Connection refused
✅ Çözüm: MAIL_HOST ve MAIL_PORT ayarlarını kontrol edin
```

### Log Takibi
```bash
# Backend loglarını takip edin
tail -f logs/backup-success.log
tail -f logs/backup-error.log
tail -f logs/backup-report-sent.log
```

## 📊 Monitoring

### Günlük Kontroller
- Yedekleme logları
- Drive upload durumu
- Disk alanı kullanımı

### Haftalık Kontroller
- E-posta gönderim durumu
- Drive klasör boyutu
- Sistem performansı

### Aylık Kontroller
- Service account kullanımı
- E-posta quota durumu
- Eski dosya temizliği

## 🔄 Güncelleme ve Bakım

### Paket Güncellemeleri
```bash
npm update googleapis nodemailer
```

### Yedekleme Retention
```javascript
// BackupService ayarları
static async deleteOldBackups(daysToKeep = 30) {
  // Varsayılan: 30 gün
  // Üretim: 90 gün önerilir
}
```

### Drive Quota Yönetimi
```javascript
// Drive'daki eski dosyaları temizleme
await driveService.cleanupOldFiles(30);
```

## 📞 Destek

Herhangi bir sorun yaşarsanız:

1. **Logları kontrol edin:** `logs/` klasöründe detaylı hata bilgileri
2. **Test endpoint'lerini kullanın:** Bağlantı durumunu kontrol edin
3. **Environment variables'ları doğrulayın:** Tüm gerekli ayarlar mevcut mu?
4. **API quota'larını kontrol edin:** Google Cloud Console'dan kullanım takibi

---

**🎉 Kurulum Tamamlandı!** 

Sistem artık otomatik olarak:
- ☁️ Google Drive'a yedekleme yüklüyor
- 📧 Haftalık raporları gönderiyor
- 🧹 Eski dosyaları temizliyor 