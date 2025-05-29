import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { receiptAPI } from '../utils/api';
import toast from 'react-hot-toast';
import MinimalLogo from './MinimalLogo';

function DeliveryReceipt({ delivery, customer, className = '' }) {
  const receiptRef = useRef(null);

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Print fonksiyonu
  const handlePrint = async () => {
    const printContent = receiptRef.current;
    const windowPrint = window.open('', '', 'width=300,height=600');
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Teslimat Fişi - ${customer?.name}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.2;
              margin: 0;
              padding: 0;
              width: 280px;
              color: #000;
            }
            
            .receipt-print {
              width: 280px;
              padding: 8px;
              text-align: left;
            }
            
            .receipt-print img.logo,
            .receipt-print .minimal-logo {
              max-width: 120px;
              max-height: 40px;
              object-fit: contain;
              display: block;
              margin: 0 0 8px 0;
            }
            
            .company-info {
              text-align: center;
              margin-bottom: 8px;
              font-size: 9px;
              line-height: 1.1;
            }
            
            .center {
              text-align: center;
            }
            
            .bold {
              font-weight: bold;
            }
            
            .line {
              border-bottom: 1px dashed #000;
              margin: 6px 0;
            }
            
            .solid-line {
              border-bottom: 1px solid #000;
              margin: 6px 0;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 9px;
            }
            
            .table-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding: 2px 0;
              font-weight: bold;
              font-size: 9px;
            }
            
            .table-row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 9px;
              border-bottom: 1px dotted #666;
            }
            
            .signature-area {
              margin-top: 15px;
              font-size: 9px;
            }
            
            .signature-line {
              border-bottom: 1px solid #000;
              display: inline-block;
              width: 120px;
              margin-left: 5px;
            }
            
            p {
              margin: 2px 0;
            }
            
            h3 {
              margin: 6px 0;
              font-size: 11px;
            }
            
            .footer-info {
              text-align: center;
              font-size: 8px;
              margin-top: 10px;
              color: #666;
            }
            
            @media print {
              body {
                width: 280px !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .receipt-print {
                width: 280px !important;
                padding: 8px !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    
    // Logo yüklenene kadar bekle ve yazdır
    const img = windowPrint.document.querySelector('img');
    if (img) {
      img.onload = () => {
        setTimeout(() => {
          windowPrint.print();
          windowPrint.close();
          // Yazdırma sonrası kayıt
          recordPrintedReceipt();
        }, 100);
      };
      
      // Eğer logo zaten yüklüyse hemen yazdır
      if (img.complete) {
        setTimeout(() => {
          windowPrint.print();
          windowPrint.close();
          // Yazdırma sonrası kayıt
          recordPrintedReceipt();
        }, 100);
      }
    } else {
      setTimeout(() => {
        windowPrint.print();
        windowPrint.close();
        // Yazdırma sonrası kayıt
        recordPrintedReceipt();
      }, 100);
    }
  };

  // Fiş yazdırma kaydını veritabanına kaydet
  const recordPrintedReceipt = async () => {
    try {
      const receiptData = {
        type: 'delivery',
        referenceId: delivery.id,
        customerId: customer.id,
        content: {
          delivery: {
            id: delivery.id,
            productName: delivery.productName,
            quantity: delivery.quantity,
            unit: delivery.unit,
            note: delivery.note,
            date: delivery.date
          },
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address
          },
          printedAt: new Date().toISOString(),
          printType: 'single_delivery'
        }
      };

      const response = await receiptAPI.record(receiptData);
      
      if (response.data.success) {
        if (response.data.isExisting) {
          console.log('📄 Bu fiş daha önce yazdırılmış:', response.data.data.documentNumber);
        } else {
          console.log('✅ Fiş kaydı oluşturuldu:', response.data.data.documentNumber);
          toast.success(`📄 Fiş kaydedildi: ${response.data.data.documentNumber}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      }
    } catch (error) {
      console.error('❌ Fiş kayıt hatası:', error);
      toast.error('⚠️ Fiş yazdırıldı ancak kayıt sırasında hata oluştu', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  if (!delivery || !customer) {
    return null;
  }

  return (
    <div className="relative">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className={`btn-secondary flex items-center space-x-1 text-xs py-1 px-2 ${className}`}
        title="Bu teslimatı yazdır"
      >
        <Printer size={12} />
        <span>Yazdır</span>
      </button>

      {/* Hidden Receipt Content for Printing */}
      <div 
        ref={receiptRef}
        className="receipt-print"
        style={{ display: 'none' }}
      >
        {/* Logo */}
        <MinimalLogo />
        
        {/* Company Info */}
        <div className="company-info">
          <div className="bold">EMANET TAKİP SİSTEMİ</div>
          <div>TESLİMAT YÖNETİM SİSTEMİ</div>
        </div>
        
        {/* Header */}
        <h3 className="center bold">TESLİMAT BELGESİ</h3>
        
        <div className="solid-line"></div>
        
        {/* Document Info */}
        <div className="info-row">
          <span className="bold">BELGE NO</span>
          <span>: #{delivery.id.toString().padStart(8, '0')}</span>
        </div>
        <div className="info-row">
          <span className="bold">TARİH</span>
          <span>: {formatDate(delivery.date)}</span>
        </div>
        <div className="info-row">
          <span className="bold">MÜŞTERİ</span>
          <span>: {customer.name}</span>
        </div>
        {customer.phone && (
          <div className="info-row">
            <span className="bold">TELEFON</span>
            <span>: {customer.phone}</span>
          </div>
        )}
        {customer.address && (
          <div style={{ margin: '2px 0', fontSize: '9px' }}>
            <span className="bold">ADRES: </span>
            <span>{customer.address}</span>
          </div>
        )}
        
        <div className="solid-line"></div>
        
        {/* Product Table Header */}
        <div className="table-header">
          <span style={{ width: '40px' }}>S.No</span>
          <span style={{ width: '120px' }}>ÜRÜN</span>
          <span style={{ width: '60px' }}>MİKTAR</span>
          <span style={{ width: '40px' }}>BİRİM</span>
        </div>
        
        {/* Product Row */}
        <div className="table-row">
          <span style={{ width: '40px' }}>1</span>
          <span style={{ width: '120px' }}>{delivery.productName}</span>
          <span style={{ width: '60px' }}>{delivery.quantity}</span>
          <span style={{ width: '40px' }}>{delivery.unit}</span>
        </div>
        
        {delivery.note && (
          <div style={{ margin: '4px 0', fontSize: '9px' }}>
            <span className="bold">NOT: </span>
            <span>{delivery.note}</span>
          </div>
        )}
        
        <div className="solid-line"></div>
        
        {/* Summary */}
        <div className="info-row bold">
          <span>TOPLAM TESLİMAT</span>
          <span>: 1 ADET</span>
        </div>
        
        <div className="solid-line"></div>
        
        {/* Signatures */}
        <div className="signature-area">
          <p>Teslim Eden: <span className="signature-line"></span></p>
          <br />
          <p>Teslim Alan: <span className="signature-line"></span></p>
        </div>
        
        {/* Footer */}
        <div className="footer-info">
          <div>Bu belge elektronik olarak üretilmiştir.</div>
          <div>{formatDate(new Date())} tarihinde yazdırılmıştır.</div>
          <div style={{ marginTop: '4px' }}>Belge No: T{delivery.id.toString().padStart(6, '0')}</div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryReceipt; 