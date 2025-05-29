import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Eye, Trash2, Phone, MapPin, CreditCard, Receipt, HardDrive, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomerForm from '../components/CustomerForm';
import ReceiptPrint from '../components/ReceiptPrint';
import { customerAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Sample payments data for testing
  const samplePayments = [
    {
      amount: 500,
      method: 'Nakit',
      date: '2025-05-28T10:30:00',
      note: 'Gübre alımı için ön ödeme'
    },
    {
      amount: 250,
      method: 'Kredi Kartı',
      date: '2025-05-25T14:15:00',
      note: 'Tohum satışı taksit ödemesi'
    },
    {
      amount: 175,
      method: 'Havale',
      date: '2025-05-20T09:45:00',
      note: null
    }
  ];

  // API'den müşterileri çek
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteri listesi yüklenirken hata:', error);
      toast.error('❌ Müşteri listesi yüklenemedi. Lütfen sayfayı yenileyin.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda müşterileri yükle
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Arama işlevselliği - müşteri adına göre filtrele
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleOpenCustomerForm = () => {
    setIsCustomerFormOpen(true);
  };

  const handleCloseCustomerForm = () => {
    setIsCustomerFormOpen(false);
  };

  const handleCustomerSubmit = (newCustomer) => {
    // Yeni müşteriyi listeye ekle
    setCustomers(prev => [...prev, newCustomer]);
    // Formu kapat
    setIsCustomerFormOpen(false);
  };

  const handleCustomerDetail = (customerId) => {
    // Müşteri detay sayfasına yönlendir
    navigate(`/customer/${customerId}`);
  };

  const handleCustomerDelete = (customerId) => {
    // Henüz uygulanmadı - gelecekte delete API call
    console.log('Müşteri sil:', customerId);
    toast.info('🔧 Müşteri silme özelliği henüz hazırlanmadı.', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleReceiptOpen = (customer) => {
    setSelectedCustomer(customer);
    setIsReceiptOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="Firma Logosu" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Emanet Takip Sistemi
                </h1>
                <p className="text-gray-600">
                  Tarım malzemeleri müşteri borç ve teslimat takip sistemi
                </p>
              </div>
            </div>
            
            {/* Navigation Menu */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/backup')}
                className="btn-secondary flex items-center space-x-2"
                title="Yedekleme Yönetimi"
              >
                <HardDrive size={16} />
                <span className="hidden sm:inline">Yedekleme</span>
              </button>
              
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary flex items-center space-x-2"
                title="Admin Panel"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Özet kartları */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-apple mr-3">
                  <User className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '-' : customers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-apple mr-3">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Borç</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-apple mr-3">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Bu Ay Tahsilat</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-apple mr-3">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Bu Hafta Teslimat</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Müşteri Listesi - Full width */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Müşteriler ({loading ? '-' : filteredCustomers.length})
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Arama Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Müşteri ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10 sm:w-64"
                  />
                </div>
                {/* Yeni Müşteri Butonu */}
                <button 
                  className="btn-primary whitespace-nowrap"
                  onClick={handleOpenCustomerForm}
                >
                  Yeni Müşteri
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-body">
            {loading ? (
              // Loading State
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">Müşteriler yükleniyor...</span>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                {customers.length === 0 ? (
                  // Hiç müşteri yok
                  <div className="space-y-3">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Henüz müşteri yok</h3>
                    <p className="text-gray-500">
                      İlk müşterinizi eklemek için "Yeni Müşteri" butonuna tıklayın.
                    </p>
                  </div>
                ) : (
                  // Arama sonucu bulunamadı
                  <div className="space-y-3">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">Müşteri bulunamadı</h3>
                    <p className="text-gray-500">
                      "{searchTerm}" araması için sonuç bulunamadı.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Müşteri Listesi
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="bg-gray-50 rounded-apple-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                  >
                    {/* Müşteri Bilgileri */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        {customer.name}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {customer.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                        
                        {customer.address && (
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{customer.address}</span>
                          </div>
                        )}
                        
                        {customer.taxNumber && (
                          <div className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-xs">Vergi No: {customer.taxNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Borç Bilgisi */}
                    <div className="mb-4 p-2 bg-white rounded-apple">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Toplam Borç:</span>
                        <span className="font-semibold text-primary-600">
                          ₺{customer.total_debt || 0}
                        </span>
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCustomerDetail(customer.id)}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-medium rounded-apple transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detay</span>
                      </button>
                      <button
                        onClick={() => handleReceiptOpen(customer)}
                        className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-apple transition-colors duration-200"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Makbuz</span>
                      </button>
                      <button
                        onClick={() => handleCustomerDelete(customer.id)}
                        className="flex items-center justify-center py-2 px-2 bg-danger-100 hover:bg-danger-200 text-danger-700 text-xs font-medium rounded-apple transition-colors duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Son Ödemeler */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Son Ödemeler</h2>
          </div>
          <div className="card-body">
            <p className="text-gray-500 text-center py-8">
              Son ödemeler listesi henüz hazırlanmadı...
            </p>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerForm 
        isOpen={isCustomerFormOpen}
        onSubmit={handleCustomerSubmit}
        onCancel={handleCloseCustomerForm}
      />

      {/* Receipt Print Modal */}
      <ReceiptPrint 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        customer={selectedCustomer}
        payments={samplePayments}
      />
    </div>
  );
}

export default Dashboard; 