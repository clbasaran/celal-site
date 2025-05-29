import React, { useEffect, useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { receiptAPI } from '../utils/api';
import MinimalLogo from './MinimalLogo';

function ReceiptPrint({ customer, payments = [], onClose, isOpen = false }) {
  const receiptRef = useRef(null);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, onClose]);

  // Toplam hesaplamalar
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalDebt = customer?.total_debt || 0;
  const remainingBalance = totalDebt - totalPaid;

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

  // Para formatı
  const formatCurrency = (amount) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Print fonksiyonu
  const handlePrint = async () => {
    window.print();
    
    // Yazdırma sonrası kayıt (kısa gecikmeyle)
    setTimeout(() => {
      recordPrintedReceipt();
    }, 1000);
  };

  // Ödeme makbuzu yazdırma kaydını veritabanına kaydet
  const recordPrintedReceipt = async () => {
    try {
      const receiptData = {
        type: 'payment',
        referenceId: payments.length > 0 ? payments[0].id : null, // İlk ödeme ID'si
        customerId: customer.id,
        content: {
          payments: payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            method: payment.method,
            note: payment.note,
            date: payment.date,
            products: payment.products || []
          })),
          customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            taxNumber: customer.taxNumber
          },
          totals: {
            totalPaid,
            totalDebt,
            remainingBalance
          },
          printedAt: new Date().toISOString(),
          printType: 'payment_receipt'
        }
      };

      const response = await receiptAPI.record(receiptData);
      
      if (response.data.success) {
        if (response.data.isExisting) {
          console.log('📄 Bu ödeme makbuzu daha önce yazdırılmış:', response.data.data.documentNumber);
        } else {
          console.log('✅ Ödeme makbuzu kaydı oluşturuldu:', response.data.data.documentNumber);
          toast.success(`📄 Makbuz kaydedildi: ${response.data.data.documentNumber}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      }
    } catch (error) {
      console.error('❌ Makbuz kayıt hatası:', error);
      toast.error('⚠️ Makbuz yazdırıldı ancak kayıt sırasında hata oluştu', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // PDF Export fonksiyonu
  const handlePDFExport = async () => {
    try {
      toast.loading('PDF oluşturuluyor...', { id: 'pdf-export' });
      
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * 0.264583] // Convert px to mm
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 0.264583);
      pdf.save(`${customer?.name || 'musteri'}-makbuz-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('PDF başarıyla indirildi!', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.error('PDF oluşturulurken hata oluştu.', { id: 'pdf-export' });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          
          .receipt-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .receipt-paper {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-apple-lg max-w-sm w-full max-h-full overflow-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 no-print">
            <h2 className="text-lg font-semibold text-gray-900">Makbuz Önizleme</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Receipt Content */}
          <div className="p-4">
            <div 
              ref={receiptRef}
              className="receipt-container receipt-paper bg-white border border-gray-200 rounded-apple p-2 mx-auto"
              style={{ 
                width: '280px',
                fontFamily: '"Courier New", "Liberation Mono", "Lucida Console", monospace',
                fontSize: '10px',
                lineHeight: '1.2',
                color: '#000'
              }}
            >
              {/* Logo */}
              <MinimalLogo 
                  style={{
                  margin: '0 0 8px 0' // Sol hizalama için
                  }}
                />
              
              {/* Company Info */}
              <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '9px', lineHeight: '1.1' }}>
                <div style={{ fontWeight: 'bold' }}>EMANET TAKİP SİSTEMİ</div>
                <div>ÖDEME YÖNETİM SİSTEMİ</div>
              </div>

              {/* Header */}
              <h3 style={{ textAlign: 'center', fontWeight: 'bold', margin: '6px 0', fontSize: '11px' }}>
                TAHSİLAT BELGESİ
              </h3>
              
              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }}></div>

              {/* Document Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold' }}>BELGE NO</span>
                <span>: P{Date.now().toString().slice(-8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold' }}>TARİH</span>
                <span>: {formatDate(new Date())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold' }}>MÜŞTERİ</span>
                <span>: {customer?.name || 'N/A'}</span>
              </div>
              {customer?.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                  <span style={{ fontWeight: 'bold' }}>TELEFON</span>
                  <span>: {customer.phone}</span>
                </div>
              )}
                {customer?.taxNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                  <span style={{ fontWeight: 'bold' }}>VERGİ NO</span>
                  <span>: {customer.taxNumber}</span>
                </div>
                )}
              
              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }}></div>

              {/* Payments Table Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                borderBottom: '1px solid #000', 
                padding: '2px 0', 
                fontWeight: 'bold', 
                fontSize: '9px' 
              }}>
                <span style={{ width: '30px' }}>S.No</span>
                <span style={{ width: '80px' }}>AÇIKLAMA</span>
                <span style={{ width: '60px' }}>YÖNTEM</span>
                <span style={{ width: '70px', textAlign: 'right' }}>TUTAR</span>
              </div>

              {/* Payment Rows */}
                {payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '9px', color: '#666' }}>
                    Henüz ödeme kaydı yok
                </div>
                ) : (
                <>
                    {payments.map((payment, index) => (
                    <div key={index}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '2px 0', 
                        fontSize: '9px',
                        borderBottom: '1px dotted #666'
                      }}>
                        <span style={{ width: '30px' }}>{index + 1}</span>
                        <span style={{ width: '80px', fontSize: '8px' }}>
                          ÖDEME ({formatDate(payment.date).split(' ')[0]})
                        </span>
                        <span style={{ width: '60px', fontSize: '8px' }}>{payment.method}</span>
                        <span style={{ width: '70px', textAlign: 'right', fontWeight: 'bold' }}>
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      {payment.note && (
                        <div style={{ margin: '1px 0 3px 30px', fontSize: '8px', fontStyle: 'italic' }}>
                          Not: {payment.note}
                      </div>
                    )}
                  </div>
                  ))}
                </>
                )}
              
              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }}></div>

              {/* Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px' }}>
                <span>Eski Bakiye</span>
                <span>: {formatCurrency(totalDebt - totalPaid)}</span>
                  </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px', fontWeight: 'bold' }}>
                <span>Toplam Tahsilat</span>
                <span>: {formatCurrency(totalPaid)}</span>
                  </div>
              
              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', fontSize: '9px', fontWeight: 'bold' }}>
                <span>Son Kalan Bakiye</span>
                <span style={{ color: remainingBalance > 0 ? '#dc2626' : '#059669' }}>
                  : {formatCurrency(Math.abs(remainingBalance))} TL
                    </span>
              </div>

              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }}></div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '10px', color: '#666' }}>
                <div>Bu belge elektronik olarak üretilmiştir.</div>
                <div>{formatDate(new Date())} tarihinde yazdırılmıştır.</div>
                <div style={{ marginTop: '4px' }}>Belge No: P{Date.now().toString().slice(-6)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 p-4 border-t border-gray-200 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-apple transition-colors duration-200"
            >
              <Printer size={16} />
              <span>Yazdır</span>
            </button>
            <button
              onClick={handlePDFExport}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-apple transition-colors duration-200"
            >
              <Download size={16} />
              <span>PDF İndir</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReceiptPrint; 