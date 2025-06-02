import React, { useState, useEffect } from 'react';
import { FileText, Printer, Calendar, Package, CreditCard, Eye } from 'lucide-react';
import { receiptAPI } from '../utils/api';
import toast from 'react-hot-toast';

function ReceiptHistory({ customerId, customerName }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fiş geçmişini yükle
  useEffect(() => {
    if (customerId) {
      fetchReceiptHistory();
    }
  }, [customerId]);

  const fetchReceiptHistory = async () => {
    try {
      setLoading(true);
      const response = await receiptAPI.getByCustomerId(customerId);
      
      if (response.data.success) {
        setReceipts(response.data.data);
      }
    } catch (error) {
      console.error('Fiş geçmişi yükleme hatası:', error);
      toast.error('❌ Fiş geçmişi yüklenemedi.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fiş tipine göre ikon
  const getReceiptIcon = (type) => {
    switch (type) {
      case 'delivery':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'batch_delivery':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Fiş tipine göre açıklama
  const getReceiptTypeLabel = (type) => {
    switch (type) {
      case 'delivery':
        return 'Teslimat Fişi';
      case 'batch_delivery':
        return 'Toplu Teslimat Fişi';
      case 'payment':
        return 'Ödeme Makbuzu';
      default:
        return 'Bilinmeyen Tip';
    }
  };

  // Fiş detayını göster
  const showReceiptDetail = (receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  // Fiş yeniden yazdır (salt okunur modda)
  const reprintReceipt = (receipt) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    
    let htmlContent = '';
    
    if (receipt.type === 'delivery') {
      htmlContent = generateDeliveryReceiptHTML(receipt);
    } else if (receipt.type === 'batch_delivery') {
      htmlContent = generateBatchDeliveryReceiptHTML(receipt);
    } else if (receipt.type === 'payment') {
      htmlContent = generatePaymentReceiptHTML(receipt);
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
    
    toast.success('📄 Fiş yeniden yazdırıldı', {
      duration: 2000,
      position: 'top-right',
    });
  };

  // HTML şablonları
  const generateDeliveryReceiptHTML = (receipt) => {
    const { content } = receipt;
    return `
      <html>
        <head>
          <title>Teslimat Fişi - ${content.customer.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 10px; width: 280px; margin: 0; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px solid #000; margin: 6px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="center bold">TESLİMAT BELGESİ</div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">BELGE NO</span><span>: ${receipt.documentNumber}</span></div>
          <div class="info-row"><span class="bold">TARİH</span><span>: ${formatDate(receipt.printedAt)}</span></div>
          <div class="info-row"><span class="bold">MÜŞTERİ</span><span>: ${content.customer.name}</span></div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">ÜRÜN</span><span>: ${content.delivery.productName}</span></div>
          <div class="info-row"><span class="bold">MİKTAR</span><span>: ${content.delivery.quantity} ${content.delivery.unit}</span></div>
          ${content.delivery.note ? `<div class="info-row"><span class="bold">NOT</span><span>: ${content.delivery.note}</span></div>` : ''}
          <div class="line"></div>
          <div class="center" style="font-size: 8px; margin-top: 10px;">
            YENİDEN YAZDIRMA - ${formatDate(new Date())}
          </div>
        </body>
      </html>
    `;
  };

  const generateBatchDeliveryReceiptHTML = (receipt) => {
    const { content } = receipt;
    return `
      <html>
        <head>
          <title>Toplu Teslimat Fişi - ${content.customer.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 10px; width: 280px; margin: 0; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px solid #000; margin: 6px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="center bold">TOPLU TESLİMAT BELGESİ</div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">BELGE NO</span><span>: ${receipt.documentNumber}</span></div>
          <div class="info-row"><span class="bold">TARİH</span><span>: ${formatDate(receipt.printedAt)}</span></div>
          <div class="info-row"><span class="bold">MÜŞTERİ</span><span>: ${content.customer.name}</span></div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">TOPLAM TESLİMAT</span><span>: ${content.totalDeliveries} ADET</span></div>
          <div class="info-row"><span class="bold">TOPLAM MİKTAR</span><span>: ${content.totalQuantity}</span></div>
          <div class="line"></div>
          <div class="center" style="font-size: 8px; margin-top: 10px;">
            YENİDEN YAZDIRMA - ${formatDate(new Date())}
          </div>
        </body>
      </html>
    `;
  };

  const generatePaymentReceiptHTML = (receipt) => {
    const { content } = receipt;
    return `
      <html>
        <head>
          <title>Ödeme Makbuzu - ${content.customer.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 10px; width: 280px; margin: 0; padding: 8px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px solid #000; margin: 6px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="center bold">TAHSİLAT BELGESİ</div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">BELGE NO</span><span>: ${receipt.documentNumber}</span></div>
          <div class="info-row"><span class="bold">TARİH</span><span>: ${formatDate(receipt.printedAt)}</span></div>
          <div class="info-row"><span class="bold">MÜŞTERİ</span><span>: ${content.customer.name}</span></div>
          <div class="line"></div>
          <div class="info-row"><span class="bold">TOPLAM TAHSİLAT</span><span>: ₺${content.totals.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></div>
          <div class="line"></div>
          <div class="center" style="font-size: 8px; margin-top: 10px;">
            YENİDEN YAZDIRMA - ${formatDate(new Date())}
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Fiş geçmişi yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Fiş Geçmişi ({receipts.length})
        </h3>
      </div>

      {/* Receipt List */}
      {receipts.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Henüz fiş kaydı yok</h3>
          <p className="text-gray-500">Yazdırılan fişler burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="bg-gray-50 rounded-apple p-4 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getReceiptIcon(receipt.type)}
                    <span className="font-semibold text-gray-900">
                      {receipt.documentNumber}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-apple text-xs font-medium bg-primary-100 text-primary-800">
                      {getReceiptTypeLabel(receipt.type)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Yazdırma: {formatDate(receipt.printedAt)}</span>
                    </div>
                    
                    {receipt.type === 'delivery' && (
                      <div>
                        Ürün: {receipt.content.delivery.productName} - 
                        {receipt.content.delivery.quantity} {receipt.content.delivery.unit}
                      </div>
                    )}
                    
                    {receipt.type === 'batch_delivery' && (
                      <div>
                        Toplam: {receipt.content.totalDeliveries} teslimat, 
                        {receipt.content.totalQuantity} miktar
                      </div>
                    )}
                    
                    {receipt.type === 'payment' && (
                      <div>
                        Toplam Tahsilat: ₺{receipt.content.totals.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showReceiptDetail(receipt)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Detayları Görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => reprintReceipt(receipt)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Yeniden Yazdır"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Receipt Details */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-apple-lg max-w-2xl w-full max-h-full overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Fiş Detayları - {selectedReceipt.documentNumber}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <pre className="bg-gray-100 p-4 rounded-apple text-xs overflow-auto">
                {JSON.stringify(selectedReceipt.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiptHistory; 