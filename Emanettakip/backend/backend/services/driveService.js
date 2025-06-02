const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');

class DriveService {
  constructor() {
    this.drive = null;
    this.folderId = null;
    this.initialized = false;
  }

  // Google Drive API'yi başlat
  async initialize() {
    try {
      if (this.initialized) return;

      // Environment variables'ları kontrol et
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!clientEmail || !privateKey) {
        console.log('⚠️ Google Drive credentials bulunamadı, Drive yükleme devre dışı');
        return false;
      }

      // JWT ile authentication
      const auth = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/drive.file']
      );

      await auth.authorize();
      
      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;
      
      console.log('✅ Google Drive API başlatıldı');
      
      // EmanetTakipYedekleri klasörünü bul veya oluştur
      await this.ensureBackupFolder();
      
      return true;

    } catch (error) {
      console.error('❌ Google Drive başlatma hatası:', error.message);
      return false;
    }
  }

  // Yedek klasörünü bul veya oluştur
  async ensureBackupFolder() {
    try {
      const folderName = 'EmanetTakipYedekleri';
      
      // Mevcut klasörü ara
      const searchResponse = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (searchResponse.data.files.length > 0) {
        this.folderId = searchResponse.data.files[0].id;
        console.log(`📁 Mevcut klasör bulundu: ${folderName} (${this.folderId})`);
      } else {
        // Klasör oluştur
        const createResponse = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        
        this.folderId = createResponse.data.id;
        console.log(`📁 Yeni klasör oluşturuldu: ${folderName} (${this.folderId})`);
      }

    } catch (error) {
      console.error('❌ Klasör işlemi hatası:', error.message);
      throw error;
    }
  }

  // Dosyayı Google Drive'a yükle
  async uploadFile(filePath, fileName) {
    try {
      if (!this.initialized || !this.folderId) {
        throw new Error('Google Drive başlatılmamış');
      }

      const fileExists = await fs.pathExists(filePath);
      if (!fileExists) {
        throw new Error(`Dosya bulunamadı: ${filePath}`);
      }

      const fileStats = await fs.stat(filePath);
      const mimeType = fileName.endsWith('.zip') ? 'application/zip' : 'application/json';

      console.log(`📤 Google Drive'a yükleniyor: ${fileName}`);

      const response = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [this.folderId]
        },
        media: {
          mimeType: mimeType,
          body: fs.createReadStream(filePath)
        },
        fields: 'id, name, size, createdTime'
      });

      const uploadedFile = response.data;
      
      console.log(`✅ Drive yükleme başarılı: ${fileName}`);
      console.log(`📄 File ID: ${uploadedFile.id}`);
      console.log(`📊 Boyut: ${(fileStats.size / 1024).toFixed(2)} KB`);

      return {
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
        size: fileStats.size,
        createdTime: uploadedFile.createdTime,
        driveUrl: `https://drive.google.com/file/d/${uploadedFile.id}/view`
      };

    } catch (error) {
      console.error(`❌ Drive yükleme hatası (${fileName}):`, error.message);
      throw error;
    }
  }

  // Birden fazla dosyayı yükle
  async uploadMultipleFiles(files) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file.path, file.name);
        results.push({
          ...result,
          localPath: file.path,
          success: true
        });
      } catch (error) {
        errors.push({
          fileName: file.name,
          localPath: file.path,
          error: error.message,
          success: false
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalUploaded: results.length,
      totalFailed: errors.length
    };
  }

  // Klasör içindeki dosyaları listele
  async listBackupFiles(limit = 50) {
    try {
      if (!this.initialized || !this.folderId) {
        return [];
      }

      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and trashed=false`,
        orderBy: 'createdTime desc',
        pageSize: limit,
        fields: 'files(id, name, size, createdTime, modifiedTime)'
      });

      return response.data.files.map(file => ({
        fileId: file.id,
        name: file.name,
        size: parseInt(file.size) || 0,
        sizeFormatted: `${((parseInt(file.size) || 0) / 1024).toFixed(2)} KB`,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        driveUrl: `https://drive.google.com/file/d/${file.id}/view`
      }));

    } catch (error) {
      console.error('❌ Drive dosya listesi hatası:', error.message);
      return [];
    }
  }

  // Eski dosyaları temizle
  async cleanupOldFiles(daysToKeep = 30) {
    try {
      if (!this.initialized || !this.folderId) {
        return { deletedCount: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and trashed=false and createdTime < '${cutoffDate.toISOString()}'`,
        fields: 'files(id, name, createdTime)'
      });

      const filesToDelete = response.data.files;
      let deletedCount = 0;

      for (const file of filesToDelete) {
        try {
          await this.drive.files.delete({ fileId: file.id });
          console.log(`🗑️ Drive'dan silindi: ${file.name}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Drive silme hatası (${file.name}):`, error.message);
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Google Drive'dan ${deletedCount} eski dosya temizlendi`);
      }

      return { deletedCount };

    } catch (error) {
      console.error('❌ Drive temizlik hatası:', error.message);
      return { deletedCount: 0 };
    }
  }

  // Drive durumu ve istatistikleri
  async getStatistics() {
    try {
      if (!this.initialized || !this.folderId) {
        return null;
      }

      const files = await this.listBackupFiles(1000);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return {
        isConnected: true,
        folderId: this.folderId,
        folderUrl: `https://drive.google.com/drive/folders/${this.folderId}`,
        totalFiles: files.length,
        totalSize: totalSize,
        totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        lastUpload: files.length > 0 ? files[0].createdTime : null
      };

    } catch (error) {
      console.error('❌ Drive istatistik hatası:', error.message);
      return {
        isConnected: false,
        error: error.message
      };
    }
  }
}

module.exports = new DriveService(); 