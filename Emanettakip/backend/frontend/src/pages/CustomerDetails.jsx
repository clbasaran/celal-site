import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Phone, 
  MapPin, 
  DollarSign,
  Printer,
  Calendar,
  Truck,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { customerAPI, paymentAPI, deliveryAPI, productAPI } from '../utils/api';
import ReceiptPrint from '../components/ReceiptPrint';
import AddPaymentForm from '../components/AddPaymentForm';
import AddDeliveryForm from '../components/AddDeliveryForm';
import DeliveryPrintButton from '../components/DeliveryPrintButton';
import DeliveryReceipt from '../components/DeliveryReceipt';
import DeliveryBatchReceipt from '../components/DeliveryBatchReceipt';
import ReceiptHistory from '../components/ReceiptHistory';

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [customerStocks, setCustomerStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order'); // 'order', 'delivery', 'receipts'

  // Fetch global products
  const fetchGlobalProducts = async () => {
    try {
      const response = await productAPI.getAll();
      console.log('Raw products from API:', response.data);
      
      const transformedProducts = response.data.map(product => ({
        id: product.id,
        productName: product.product_name, // Backend'ten product_name geliyor
        unit: product.unit,
        description: product.description
      }));
      
      console.log('Transformed products:', transformedProducts);
      setGlobalProducts(transformedProducts);
    } catch (error) {
      console.error('Global ürünler yüklenirken hata:', error);
      toast.error('❌ Ürün kataloğu yüklenemedi.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch customer stocks
  const fetchCustomerStocks = React.useCallback(async () => {
    try {
      const response = await customerAPI.getStocks(id);
      console.log('Customer stocks from new endpoint:', response.data);
      setCustomerStocks(response.data);
    } catch (error) {
      console.error('Müşteri stokları yüklenirken hata:', error);
      // Stok hatası kritik değil, sessizce geç
      setCustomerStocks([]);
    }
  }, [id]);

  // Fetch customer data
  const fetchCustomerData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch customer details
      const customerResponse = await customerAPI.getById(id);
      setCustomer(customerResponse.data);
      
      // Fetch customer payments
      const paymentsResponse = await paymentAPI.getByCustomerId(id);
      setPayments(paymentsResponse.data);
      
      // Fetch customer deliveries
      const deliveriesResponse = await deliveryAPI.getByCustomerId(id);
      setDeliveries(deliveriesResponse.data);
      
      // Fetch customer stocks
      await fetchCustomerStocks();
      
    } catch (error) {
      console.error('Müşteri detayları yüklenirken hata:', error);
      toast.error('❌ Müşteri detayları yüklenemedi.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }, [id, fetchCustomerStocks]);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
      fetchGlobalProducts(); // Fetch global products on component mount
    }
  }, [id, fetchCustomerData]);

  // Calculations (simplified - no price tracking)
  const totalOrders = payments.length;
  const totalDeliveries = deliveries.length;

  // Date formatter
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Check if it's a date-only string (YYYY-MM-DD)
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // Full datetime format
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Currency formatter
  const formatCurrency = (amount) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Payment form submission handler
  const handlePaymentSubmit = async (paymentData) => {
    setSubmittingPayment(true);
    
    try {
      const response = await paymentAPI.create({
        customerId: parseInt(id),
        amount: paymentData.amount,
        method: paymentData.method,
        note: paymentData.note,
        products: paymentData.products
      });
      
      // Add payment with products to local state
      const newPayment = {
        id: response.data.payment.id,
        amount: response.data.payment.amount,
        method: response.data.payment.method,
        note: response.data.payment.note,
        date: response.data.payment.date,
        products: response.data.payment.products || []
      };
      
      setPayments(prev => [newPayment, ...prev]);
      
      // Stokları yeniden yükle
      await fetchCustomerStocks();
      
    } catch (error) {
      console.error('Ödeme kaydetme hatası:', error);
      throw error; // Re-throw to let AddPaymentForm handle the error
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delivery form submission handler
  const handleDeliverySubmit = async (deliveryData) => {
    setSubmittingDelivery(true);
    
    try {
      const newDeliveryData = {
        ...deliveryData,
        customerId: parseInt(id)
      };
      
      const response = await deliveryAPI.create(newDeliveryData);
      const newDelivery = response.data.delivery;
      
      setDeliveries(prev => [newDelivery, ...prev]);
      
      // Stokları yeniden yükle
      await fetchCustomerStocks();
      
      // Başarı mesajında kalan stok bilgisini göster
      if (response.data.remainingStock !== undefined) {
        toast.success(`✅ Teslimat kaydedildi! Kalan stok: ${response.data.remainingStock} ${newDelivery.unit}`, {
          duration: 5000,
          position: 'top-right',
        });
      }
      
    } catch (error) {
      console.error('Teslimat kaydetme hatası:', error);
      
      // Stok yetersizliği hatası özel olarak handle et
      if (error.response?.data?.type === 'INSUFFICIENT_STOCK') {
        toast.error(`❌ ${error.response.data.message}`, {
          duration: 6000,
          position: 'top-right',
        });
      } else {
        toast.error('❌ Teslimat kaydedilirken hata oluştu.', {
          duration: 5000,
          position: 'top-right',
        });
      }
      
      throw error; // Re-throw to let AddDeliveryForm handle the error
    } finally {
      setSubmittingDelivery(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Müşteri detayları yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız müşteri bulunamadı.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Anasayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mr-4"
          >
            <ArrowLeft size={20} />
            <span>Geri</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Müşteri Detayları</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-apple mr-3">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                  <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-apple mr-3">
                  <CreditCard className="w-6 h-6 text-success-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Teslimat</p>
                  <p className="text-xl font-bold text-gray-900">{totalDeliveries}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-apple mr-3">
                  <Truck className="w-6 h-6 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Stok Çeşidi</p>
                  <p className="text-xl font-bold text-gray-900">{customerStocks.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-info-100 rounded-apple mr-3">
                  <Calendar className="w-6 h-6 text-info-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Stok</p>
                  <p className="text-xl font-bold text-gray-900">
                    {customerStocks.reduce((total, stock) => total + stock.quantity, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Info Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Müşteri Bilgileri
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ad Soyad</p>
                        <p className="text-gray-900">{customer.name}</p>
                      </div>
                    </div>
                    
                    {customer.taxNumber && (
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Vergi Numarası</p>
                          <p className="text-gray-900">{customer.taxNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {customer.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Telefon</p>
                          <p className="text-gray-900">{customer.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Adres</p>
                          <p className="text-gray-900">{customer.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Ödemeler ({payments.length})
                  </h2>
                  <button
                    onClick={() => setIsReceiptOpen(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Printer size={16} />
                    <span>Makbuz</span>
                  </button>
                </div>
              </div>
              <div className="card-body">
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Henüz ödeme yok</h3>
                    <p className="text-gray-500">İlk ödemeyi eklemek için yan paneli kullanın.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="bg-gray-50 rounded-apple p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(payment.date)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-apple text-xs font-medium bg-primary-100 text-primary-800">
                                {payment.method}
                              </span>
                              {payment.note && (
                                <span className="text-sm text-gray-600">{payment.note}</span>
                              )}
                            </div>
                            {/* Products section */}
                            {payment.products && payment.products.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <h4 className="text-xs font-medium text-gray-600 mb-2">Ürünler:</h4>
                                <div className="space-y-1">
                                  {payment.products.map((product, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">
                                        {product.name} - {product.quantity} {product.unit}
                                      </span>
                                      {product.note && (
                                        <span className="text-xs text-gray-500 italic">
                                          {product.note}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Deliveries Section */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Teslimatlar ({deliveries.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    {deliveries.length > 0 && (
                      <DeliveryBatchReceipt 
                        customer={customer}
                        deliveries={deliveries}
                      />
                    )}
                  <DeliveryPrintButton 
                    deliveries={deliveries}
                    customerName={customer.name}
                  />
                  </div>
                </div>
              </div>
              <div className="card-body">
                {deliveries.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Henüz teslimat yok</h3>
                    <p className="text-gray-500">Teslimat kayıtları burada görünecek.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} className="bg-gray-50 rounded-apple p-4 animate-scale-in">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{delivery.productName}</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(delivery.date)}
                            </span>
                            <DeliveryReceipt 
                              delivery={delivery} 
                              customer={customer}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm bg-white rounded-apple p-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600">Miktar:</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-gray-900">
                              {delivery.quantity} {delivery.unit}
                            </span>
                            {delivery.note && (
                              <div className="text-xs text-gray-500 italic">
                                {delivery.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Stocks Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Mevcut Stoklar ({customerStocks.length})
                </h2>
              </div>
              <div className="card-body">
                {customerStocks.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Stok bulunmuyor</h3>
                    <p className="text-gray-500">Sipariş vererek stok oluşturabilirsiniz.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerStocks.map((stock) => (
                      <div key={`${stock.productId}`} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-apple p-4 border border-blue-100">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{stock.productName}</h3>
                          <span className="text-xs text-gray-500">
                            ID: {stock.productId}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {stock.quantity} {stock.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Son güncelleme: {formatDate(stock.lastUpdated)}
                          </div>
                        </div>
                        
                        {stock.quantity < 10 && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-apple">
                            ⚠️ Düşük stok seviyesi
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Receipt History Section */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Yazdırılan Fişler
                </h2>
              </div>
              <div className="card-body">
                <ReceiptHistory 
                  customerId={parseInt(id)}
                  customerName={customer.name}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Tab Navigation for Forms */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <div className="card-header">
                <div className="flex space-x-1 bg-gray-100 rounded-apple p-1 md:flex-row flex-col md:space-y-0 space-y-1 md:space-x-1 space-x-0">
                  <button
                    onClick={() => setActiveTab('order')}
                    className={`flex-1 md:flex-1 w-full py-2 px-3 rounded-apple text-sm font-medium transition-all duration-200 ${
                      activeTab === 'order'
                        ? 'bg-white text-primary-600 shadow-apple'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Sipariş</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('delivery')}
                    className={`flex-1 md:flex-1 w-full py-2 px-3 rounded-apple text-sm font-medium transition-all duration-200 ${
                      activeTab === 'delivery'
                        ? 'bg-white text-primary-600 shadow-apple'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <Truck className="w-4 h-4" />
                      <span>Teslimat</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="card-body p-0">
                {activeTab === 'order' ? (
                  <div className="p-6">
                    <AddPaymentForm 
                      onSubmit={handlePaymentSubmit}
                      loading={submittingPayment}
                      globalProducts={globalProducts}
                    />
                  </div>
                ) : (
                  <div className="p-6">
                    <AddDeliveryForm 
                      customerId={parseInt(id)}
                      onSubmit={handleDeliverySubmit}
                      loading={submittingDelivery}
                      availableProducts={customerStocks}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Print Modal */}
      <ReceiptPrint 
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        customer={customer}
        payments={payments}
      />
    </div>
  );
}

export default CustomerDetails; 