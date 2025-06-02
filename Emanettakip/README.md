# 🌾 Emanet Takip Sistemi

Yerel tarım malzemeleri işletmesi için müşteri borç ve haftalık teslimat takip sistemi.

## 📋 Özellikler

- **Müşteri Yönetimi**: Müşteri ekleme, düzenleme, silme
- **Teslimat Takibi**: Haftalık teslimat kayıtları (tohum, gübre, kömür)
- **Borç Yönetimi**: Toplam borç, ödeme ve kalan bakiye takibi
- **Taksitli Ödeme**: Çok taksitli ödeme desteği
- **Makbuz Yazdırma**: Printable PDF/HTML makbuzlar
- **Modern UI**: Apple tarzı temiz, modern tasarım
- **Responsive**: Mobil ve masaüstü uyumlu
- **Güvenli Giriş**: Kullanıcı adı/şifre tabanlı yetkilendirme

## 🛠 Teknolojiler

### Backend
- **Node.js** + **Express.js**
- **SQLite** veritabanı
- **JWT** authentication
- **bcryptjs** şifreleme
- **express-validator** validasyon
- **puppeteer** PDF oluşturma

### Frontend
- **React.js** 18
- **TailwindCSS** styling
- **React Router** navigation
- **React Hook Form** form yönetimi
- **Axios** HTTP client
- **React Hot Toast** notifications
- **Lucide React** icons

## 📁 Proje Yapısı

```
emanettakip/
├── backend/                 # Backend API
│   ├── db/                 # Veritabanı
│   │   ├── models/         # Veri modelleri
│   │   │   ├── Customer.js
│   │   │   ├── Delivery.js
│   │   │   └── Payment.js
│   │   └── init.js         # DB initialization
│   ├── routes/             # API routes
│   │   ├── customers.js
│   │   ├── deliveries.js
│   │   └── payments.js
│   ├── utils/              # Utility functions
│   ├── app.js              # Express app
│   └── server.js           # Server entry point
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── pages/          # Sayfa bileşenleri
│   │   │   ├── Dashboard.jsx
│   │   │   └── CustomerDetails.jsx
│   │   ├── components/     # UI bileşenleri
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── DeliveryForm.jsx
│   │   │   └── ReceiptPrint.jsx
│   │   ├── utils/          # Frontend utilities
│   │   └── App.js          # Ana uygulama
│   ├── tailwind.config.js  # TailwindCSS config
│   └── package.json
├── package.json            # Root package manager
└── README.md
```

## 🚀 Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd emanettakip
```

### 2. Bağımlılıkları yükleyin
```bash
# Tüm bağımlılıkları yükle (root, backend, frontend)
npm run install:all

# Veya tek tek yükleyin:
npm install
npm run backend:install
npm run frontend:install
```

### 3. Environment dosyasını ayarlayın
```bash
# Backend için environment dosyası oluşturun
cd backend
cp env.example .env
# .env dosyasını ihtiyacınıza göre düzenleyin
```

### 4. Veritabanını başlatın
```bash
# Backend klasöründen çalıştırın
npm run init-db
```

### 5. Uygulamayı başlatın
```bash
# Root klasörden development modunda çalıştırın
npm run dev

# Veya ayrı ayrı:
npm run backend:dev  # Port 3001
npm run frontend:dev # Port 3000
```

## 📖 API Endpoints

### Müşteriler
- `GET /api/customers` - Tüm müşterileri listele
- `GET /api/customers/:id` - Müşteri detayı
- `POST /api/customers` - Yeni müşteri oluştur
- `PUT /api/customers/:id` - Müşteri güncelle
- `DELETE /api/customers/:id` - Müşteri sil

### Teslimatlar
- `GET /api/deliveries` - Tüm teslimatları listele
- `GET /api/deliveries/customer/:id` - Müşteri teslimatları
- `POST /api/deliveries` - Yeni teslimat oluştur
- `PUT /api/deliveries/:id` - Teslimat güncelle
- `DELETE /api/deliveries/:id` - Teslimat sil

### Ödemeler
- `GET /api/payments` - Tüm ödemeleri listele
- `GET /api/payments/customer/:id` - Müşteri ödemeleri
- `POST /api/payments` - Yeni ödeme oluştur
- `PUT /api/payments/:id` - Ödeme güncelle
- `DELETE /api/payments/:id` - Ödeme sil

## 🎨 Tasarım Sistemi

Proje Apple'ın design language'inden ilham alan modern bir tasarım sistemi kullanır:

- **Renkler**: Primary (mavi), Success (yeşil), Warning (sarı), Danger (kırmızı)
- **Typography**: System font stack (-apple-system, Segoe UI)
- **Shadows**: Soft, minimal gölgeler
- **Border Radius**: Rounded corners (12px, 16px, 20px)
- **Animations**: Subtle, smooth transitions

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # nodemon ile auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # React development server
```

### Production Build
```bash
npm run build     # Frontend build
npm run start     # Production server
```

## 🛡 Güvenlik

- Rate limiting (100 requests/15min per IP)
- Input validation ve sanitization
- CORS protection
- Helmet.js security headers
- bcryptjs password hashing
- JWT token authentication

## 📱 Responsive Design

Uygulama tüm cihaz boyutlarında optimize edilmiştir:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🖨 Makbuz Yazdırma

- HTML/CSS tabanlı makbuz tasarımı
- Thermal printer uyumlu (ESC/POS)
- PDF export desteği
- Print-specific CSS stilleri

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje ile ilgili sorularınız için:
- Email: info@emanettakip.com
- GitHub Issues: [Proje Issues](https://github.com/user/emanettakip/issues)

---

**Not**: Bu proje halihazırda temel yapı şemasıdır. İşlevsel özellikler gelecek sürümlerde eklenecektir. 