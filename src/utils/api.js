// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://emanet-backend.celalba78.workers.dev/api'; 

export const stockAPI = {
  // Get customer stocks
  getCustomerStocks: (customerId) => api.get(`/customers/${customerId}/stocks`),
  
  // Get all stocks (admin)
  getAllStocks: () => api.get('/stocks/all'),
}; 