const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

class MailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Mail servisi başlatma
  async initialize() {
    try {
      if (this.initialized) return;

      const mailConfig = {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD
        }
      };

      // Gmail için özel ayar
      if (process.env.MAIL_SERVICE === 'gmail') {
        mailConfig.service = 'gmail';
      }

      if (!mailConfig.auth.user || !mailConfig.auth.pass) {
        console.log('⚠️ E-posta credentials bulunamadı, mail gönderimi devre dışı');
        return false;
      }

      this.transporter = nodemailer.createTransporter(mailConfig);
      
      // Test connection
      await this.transporter.verify();
      this.initialized = true;
      
      console.log('✅ Mail servisi başlatıldı');
      return true;

    } catch (error) {
      console.error('❌ Mail servisi başlatma hatası:', error.message);
      return false;
    }
  }

  // Haftalık yedekleme raporu gönder
  async sendWeeklyBackupReport(reportData) {
    try {
      if (!this.initialized) {
        throw new Error('Mail servisi başlatılmamış');
      }

      const recipientEmail = process.env.BACKUP_REPORT_EMAIL;
      if (!recipientEmail) {
        throw new Error('BACKUP_REPORT_EMAIL tanımlanmamış');
      }

      const htmlContent = this.generateReportHTML(reportData);
      
      const mailOptions = {
        from: {
          name: 'Emanet Takip Sistemi',
          address: process.env.MAIL_USER
        },
        to: recipientEmail,
        subject: `📊 Haftalık Yedekleme Raporu - ${reportData.weekRange}`,
        html: htmlContent,
        attachments: []
      };

      console.log(`📧 Haftalık rapor gönderiliyor: ${recipientEmail}`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Haftalık rapor gönderildi:', info.messageId);

      // Mail kopyasını kaydet
      await this.saveReportCopy(reportData, htmlContent);

      return {
        success: true,
        messageId: info.messageId,
        recipient: recipientEmail,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Mail gönderme hatası:', error.message);
      throw error;
    }
  }

  // HTML rapor içeriği oluştur
  generateReportHTML(data) {
    const {
      weekRange,
      summary,
      backupDetails,
      errors,
      driveStats,
      systemHealth
    } = data;

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Haftalık Yedekleme Raporu</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .period {
            color: #6b7280;
            font-size: 16px;
            margin-top: 8px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin: 10px 0;
        }
        .stat-label {
            color: #64748b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .backup-item {
            background: #f9fafb;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
        }
        .backup-date {
            font-weight: bold;
            color: #065f46;
        }
        .backup-details {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .error-item {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
        }
        .error-title {
            font-weight: bold;
            color: #dc2626;
        }
        .health-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-good {
            background-color: #dcfce7;
            color: #166534;
        }
        .status-warning {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-error {
            background-color: #fecaca;
            color: #991b1b;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .drive-link {
            display: inline-block;
            background: #4285f4;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Haftalık Yedekleme Raporu</h1>
            <div class="period">${weekRange}</div>
            <div class="health-status ${systemHealth.level === 'good' ? 'status-good' : systemHealth.level === 'warning' ? 'status-warning' : 'status-error'}">
                Sistem Durumu: ${systemHealth.status}
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Toplam Yedek</div>
                <div class="stat-number">${summary.totalBackups}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Toplam Boyut</div>
                <div class="stat-number">${summary.totalSizeFormatted}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">JSON Dosyaları</div>
                <div class="stat-number">${summary.jsonFiles}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ZIP Dosyaları</div>
                <div class="stat-number">${summary.zipFiles}</div>
            </div>
        </div>

        ${summary.lastBackupDate ? `
        <div class="section">
            <h2>📅 Son Yedekleme</h2>
            <div class="backup-item">
                <div class="backup-date">${summary.lastBackupDate}</div>
                <div class="backup-details">Son yedekleme başarıyla tamamlandı</div>
            </div>
        </div>
        ` : ''}

        ${backupDetails.length > 0 ? `
        <div class="section">
            <h2>📦 Yedekleme Detayları</h2>
            ${backupDetails.map(backup => `
                <div class="backup-item">
                    <div class="backup-date">${backup.date}</div>
                    <div class="backup-details">
                        ${backup.files.length} dosya • ${backup.totalSizeFormatted} • ${backup.tables} tablo
                        ${backup.driveUploaded ? ' • ☁️ Google Drive' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${driveStats && driveStats.isConnected ? `
        <div class="section">
            <h2>☁️ Google Drive Durumu</h2>
            <div class="backup-item">
                <div class="backup-date">✅ Bağlantı Aktif</div>
                <div class="backup-details">
                    ${driveStats.totalFiles} dosya • ${driveStats.totalSizeFormatted}
                    ${driveStats.lastUpload ? ` • Son yükleme: ${new Date(driveStats.lastUpload).toLocaleDateString('tr-TR')}` : ''}
                </div>
                <div style="margin-top: 15px;">
                    <a href="${driveStats.folderUrl}" class="drive-link">📁 Drive Klasörünü Aç</a>
                </div>
            </div>
        </div>
        ` : ''}

        ${errors.length > 0 ? `
        <div class="section">
            <h2>⚠️ Hatalar ve Uyarılar</h2>
            ${errors.map(error => `
                <div class="error-item">
                    <div class="error-title">${error.type}: ${error.message}</div>
                    <div class="backup-details">${error.timestamp}</div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="section">
            <h2>✅ Sistem Durumu</h2>
            <div class="backup-item">
                <div class="backup-date">Hata Yok</div>
                <div class="backup-details">Bu hafta herhangi bir hata kaydedilmedi</div>
            </div>
        </div>
        `}

        <div class="footer">
            <p>Bu rapor Emanet Takip Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
            <p>Rapor Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Rapor kopyasını kaydet
  async saveReportCopy(reportData, htmlContent) {
    try {
      const reportDate = new Date().toISOString().split('T')[0];
      const backupDir = path.join(__dirname, '../backups', reportDate);
      
      await fs.ensureDir(backupDir);
      
      const reportFilePath = path.join(backupDir, `weekly-report-${reportDate}.log`);
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'weekly_backup_report',
        recipient: process.env.BACKUP_REPORT_EMAIL,
        data: reportData,
        htmlContent: htmlContent
      };

      await fs.writeJson(reportFilePath, logEntry, { spaces: 2 });
      
      console.log('📄 Rapor kopyası kaydedildi:', reportFilePath);

    } catch (error) {
      console.error('❌ Rapor kopyası kayıt hatası:', error.message);
    }
  }

  // Test e-postası gönder
  async sendTestEmail(recipientEmail) {
    try {
      if (!this.initialized) {
        throw new Error('Mail servisi başlatılmamış');
      }

      const mailOptions = {
        from: {
          name: 'Emanet Takip Sistemi',
          address: process.env.MAIL_USER
        },
        to: recipientEmail,
        subject: '🧪 Test E-postası - Emanet Takip Sistemi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">✅ Mail Servisi Test</h2>
            <p>Bu e-posta, Emanet Takip Sistemi mail servisinin çalışıp çalışmadığını test etmek için gönderilmiştir.</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Test Zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
              <p><strong>Sistem:</strong> Emanet Takip Backend</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Eğer bu e-postayı aldıysanız, mail konfigürasyonunuz başarılı! 🎉
            </p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Test e-postası gönderildi:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        recipient: recipientEmail
      };

    } catch (error) {
      console.error('❌ Test e-postası hatası:', error.message);
      throw error;
    }
  }
}

module.exports = new MailService(); 