import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://emanet-backend.celalba78.workers.dev/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const customerAPI = {
  // Get all customers
  getAll: () => api.get('/customers'),
  
  // Get customer by ID
  getById: (id) => api.get(`/customers/${id}`),
  
  // Create new customer
  create: (customerData) => api.post('/customers', customerData),
  
  // Update customer
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  
  // Delete customer
  delete: (id) => api.delete(`/customers/${id}`),
  
  // Get customer debt summary
  getDebtSummary: (id) => api.get(`/customers/${id}/debt-summary`),
  
  // Get customer stocks (for delivery form)
  getStocks: (id) => api.get(`/customers/${id}/stocks`),
};

export const paymentAPI = {
  // Get all payments for a customer
  getByCustomerId: (customerId) => api.get(`/payments/customer/${customerId}`),
  
  // Create new payment - backend format'ına çevir
  create: async (paymentData) => {
    console.log('🔍 PaymentAPI.create called with:', paymentData);
    alert('🔍 PaymentAPI.create called with: ' + JSON.stringify(paymentData));
    
    // Frontend format: {customerId, amount, method, note, products}
    // Backend format: {customer_id, amount, payment_method, notes}
    const backendData = {
      customer_id: paymentData.customerId,
      amount: paymentData.amount,
      payment_method: paymentData.method || 'nakit',
      notes: paymentData.note || null
    };
    
    console.log('📤 Sending to backend:', backendData);
    alert('📤 Sending to backend: ' + JSON.stringify(backendData));
    
    try {
      const response = await api.post('/payments', backendData);
      console.log('✅ Backend response:', response.data);
      alert('✅ Backend response: ' + JSON.stringify(response.data));
      
      // Backend response'u frontend'in beklediği format'a çevir
      const frontendResponse = {
        data: {
          payment: {
            id: response.data.id,
            amount: paymentData.amount,
            method: paymentData.method || 'nakit',
            note: paymentData.note || null,
            date: new Date().toISOString(),
            products: paymentData.products || []
          }
        }
      };
      
      console.log('🔄 Mapped response:', frontendResponse);
      alert('🔄 Mapped response: ' + JSON.stringify(frontendResponse));
      return frontendResponse;
      
    } catch (error) {
      console.error('❌ PaymentAPI error:', error);
      console.error('❌ Error response:', error.response?.data);
      alert('❌ PaymentAPI error: ' + JSON.stringify({
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }));
      throw error;
    }
  },
  
  // Update payment
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  
  // Delete payment
  delete: (id) => api.delete(`/payments/${id}`),
};

export const deliveryAPI = {
  // Get all deliveries for a customer
  getByCustomerId: (customerId) => api.get(`/deliveries/customer/${customerId}`),
  
  // Create new delivery
  create: (deliveryData) => api.post('/deliveries', deliveryData),
  
  // Update delivery
  update: (id, deliveryData) => api.put(`/deliveries/${id}`, deliveryData),
  
  // Delete delivery
  delete: (id) => api.delete(`/deliveries/${id}`),
};

export const productAPI = {
  // Get all products
  getAll: () => api.get('/products'),
  
  // Get product by ID
  getById: (id) => api.get(`/products/${id}`),
  
  // Create new product
  create: (productData) => api.post('/products', productData),
  
  // Update product
  update: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Delete product
  delete: (id) => api.delete(`/products/${id}`),
};

export const stockAPI = {
  // Get customer stocks
  getCustomerStocks: (customerId) => api.get(`/customers/${customerId}/stocks`),
  
  // Get all stocks (admin)
  getAllStocks: () => api.get('/stocks/all'),
};

export const receiptAPI = {
  // Record a printed receipt
  record: (receiptData) => api.post('/receipts/record', receiptData),
  
  // Get all receipt records (with pagination)
  getAll: (limit = 50, offset = 0, type = null) => {
    const params = { limit, offset };
    if (type) params.type = type;
    return api.get('/receipts', { params });
  },
  
  // Get receipt records by customer ID
  getByCustomerId: (customerId) => api.get(`/receipts/customer/${customerId}`),
  
  // Get receipt by document number
  getByDocumentNumber: (documentNumber) => api.get(`/receipts/${documentNumber}`),
};

export const logAPI = {
  // Get all logs (with filtering and pagination)
  getAll: (params = {}) => api.get('/logs', { params }),
  
  // Get logs by customer ID
  getByCustomerId: (customerId, limit = 50, offset = 0) => 
    api.get(`/logs/customer/${customerId}`, { params: { limit, offset } }),
  
  // Get log statistics
  getStatistics: (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/logs/statistics', { params });
  },
  
  // Create manual log entry
  create: (logData) => api.post('/logs', logData),
};

export const backupAPI = {
  // Trigger manual backup
  createManual: () => api.get('/backup/manual'),
  
  // List all available backups
  getList: () => api.get('/backup/list'),
  
  // Download backup file
  downloadFile: (filename) => {
    return api.get(`/backup/download/${filename}`, {
      responseType: 'blob', // Important for file downloads
      headers: {
        'Accept': 'application/octet-stream'
      }
    });
  },
  
  // Get backup statistics
  getStatistics: () => api.get('/backup/statistics'),
  
  // Cleanup old backups
  cleanup: (daysToKeep = 30) => api.delete(`/backup/cleanup?daysToKeep=${daysToKeep}`),
};

// Export API instance for custom requests
export default api; 