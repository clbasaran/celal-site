import React, { useState } from 'react';
import { Printer, X, Calendar, Package } from 'lucide-react';
import MinimalLogo from './MinimalLogo';

function DeliveryPrintButton({ deliveries = [], customerName = '', className = '' }) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Group deliveries by product
  const deliveryGroups = React.useMemo(() => {
    const groups = {};
    
    deliveries.forEach(delivery => {
      if (!groups[delivery.productName]) {
        groups[delivery.productName] = {
          productName: delivery.productName,
          unit: delivery.unit,
          deliveries: [],
          totalDelivered: 0
        };
      }
      groups[delivery.productName].deliveries.push(delivery);
      groups[delivery.productName].totalDelivered += delivery.quantity;
    });

    return Object.values(groups).sort((a, b) => 
      a.productName.localeCompare(b.productName, 'tr')
    );
  }, [deliveries]);

  // Date formatter
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

  const handlePrint = () => {
    window.print();
  };

  if (deliveries.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @media print {
          .minimal-logo {
            max-width: 120px !important;
            max-height: 40px !important;
            object-fit: contain !important;
          }
        }
      `}</style>
      
      <button
        onClick={() => setIsPrintModalOpen(true)}
        className={`btn-secondary flex items-center space-x-2 ${className}`}
      >
        <Printer size={16} />
        <span>Teslimat Fişi</span>
      </button>

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-apple-lg shadow-apple-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Teslimat Fişi Önizleme</h2>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-apple p-1 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto">
              <div id="delivery-receipt" className="p-8 print:p-6">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                  {/* Logo */}
                  <MinimalLogo 
                    style={{ 
                      margin: '0 auto 20px auto',
                      maxWidth: '150px'
                    }}
                  />
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    TESLİMAT FİŞİ
                  </h2>
                  <div className="text-sm text-gray-600">
                    <p>Tarih: {formatDate(new Date())}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <div className="bg-gray-50 print:bg-gray-100 rounded-apple p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Müşteri Bilgileri</h3>
                    <p className="text-gray-700">
                      <strong>Müşteri Adı:</strong> {customerName}
                    </p>
                  </div>
                </div>

                {/* Delivery Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Teslimat Özeti
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                            Ürün Adı
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            Toplam Miktar
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            Birim
                          </th>
                          <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            Teslimat Sayısı
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryGroups.map((group, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              {group.productName}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                              {group.totalDelivered.toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {group.unit}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {group.deliveries.length}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Deliveries */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Detaylı Teslimat Geçmişi
                  </h3>
                  
                  {deliveryGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
                        {group.productName} ({group.unit})
                      </h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-3 py-2 text-left">Tarih</th>
                              <th className="border border-gray-300 px-3 py-2 text-center">Miktar</th>
                              <th className="border border-gray-300 px-3 py-2 text-left">Not</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.deliveries.map((delivery, deliveryIndex) => (
                              <tr key={deliveryIndex}>
                                <td className="border border-gray-300 px-3 py-2">
                                  {formatDate(delivery.date)}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                                  {delivery.quantity} {delivery.unit}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-gray-600">
                                  {delivery.note || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-300 pt-6 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
                    <div>
                      <p className="mb-2"><strong>Toplam Ürün Çeşidi:</strong> {deliveryGroups.length}</p>
                      <p className="mb-2"><strong>Toplam Teslimat:</strong> {deliveries.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="mb-4">Bu fiş elektronik olarak üretilmiştir.</p>
                      <div className="border-t border-gray-300 pt-4">
                        <p>Teslim Eden: ________________</p>
                        <br />
                        <p>Teslim Alan: ________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                onClick={handlePrint}
                className="btn-primary flex items-center space-x-2"
              >
                <Printer size={16} />
                <span>Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeliveryPrintButton; 