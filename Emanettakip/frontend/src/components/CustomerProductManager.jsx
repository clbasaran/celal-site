import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

function CustomerProductManager({ customerId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      productName: '',
      unit: 'kg',
      quantity: '',
      description: ''
    }
  });

  // Mock data for development
  const mockProducts = [
    {
      id: 1,
      productName: 'Buğday Tohumu Premium',
      unit: 'çuval',
      quantity: 100,
      description: '25kg çuvallar halinde premium buğday tohumu',
      createdAt: '2025-05-20T10:00:00Z'
    },
    {
      id: 2,
      productName: 'NPK Gübre 15-15-15',
      unit: 'kg',
      quantity: 500,
      description: 'Dengeli NPK gübre karışımı',
      createdAt: '2025-05-22T14:30:00Z'
    }
  ];

  // Fetch customer products (mock for now)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data by customerId for demo
      const customerProducts = customerId === 1 ? mockProducts : [];
      setProducts(customerProducts);
      
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
      toast.error('❌ Ürünler yüklenemedi.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchProducts();
    }
  }, [customerId]);

  // Add new product
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Mock API call - replace with actual POST /api/products
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newProduct = {
        id: Date.now(), // Mock ID
        customerId: parseInt(customerId),
        productName: data.productName,
        unit: data.unit,
        quantity: parseFloat(data.quantity),
        description: data.description || null,
        createdAt: new Date().toISOString()
      };
      
      setProducts(prev => [...prev, newProduct]);
      
      // Reset form
      reset({
        productName: '',
        unit: 'kg',
        quantity: '',
        description: ''
      });
      
      toast.success('✅ Ürün başarıyla eklendi!', {
        duration: 4000,
        position: 'top-right',
      });
      
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      toast.error('❌ Ürün eklenirken hata oluştu.', {
        duration: 5000,
        position: 'top-right',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (productId) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      // Mock API call - replace with actual DELETE /api/products/:id
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProducts(prev => prev.filter(product => product.id !== productId));
      
      toast.success('✅ Ürün başarıyla silindi!', {
        duration: 3000,
        position: 'top-right',
      });
      
    } catch (error) {
      console.error('Ürün silme hatası:', error);
      toast.error('❌ Ürün silinirken hata oluştu.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Edit product (placeholder)
  const handleEdit = (product) => {
    setEditingProduct(product);
    toast('🔧 Düzenleme özelliği yakında eklenecek!', {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Ürünler yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Product Form */}
      <div className="bg-gray-50 rounded-apple p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Yeni Ürün Ekle
        </h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Name */}
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Adı *
            </label>
            <input
              id="productName"
              type="text"
              placeholder="Örn: Buğday Tohumu Premium"
              className={`input-field ${errors.productName ? 'border-danger-500 focus:ring-danger-500' : ''}`}
              {...register('productName', { required: 'Ürün adı gereklidir' })}
            />
            {errors.productName && (
              <p className="text-sm text-danger-600 mt-1">{errors.productName.message}</p>
            )}
          </div>

          {/* Unit and Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Birim *
              </label>
              <select
                id="unit"
                className="input-field"
                {...register('unit')}
              >
                <option value="kg">kg</option>
                <option value="ton">ton</option>
                <option value="çuval">çuval</option>
                <option value="litre">litre</option>
                <option value="adet">adet</option>
                <option value="kutu">kutu</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Toplam Miktar *
              </label>
              <input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                className={`input-field ${errors.quantity ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                {...register('quantity', {
                  required: 'Miktar gereklidir',
                  min: { value: 0.01, message: 'Miktar 0\'dan büyük olmalıdır' }
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-danger-600 mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              id="description"
              rows={2}
              placeholder="Ürün hakkında ek bilgiler..."
              className="input-field resize-none"
              {...register('description')}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Ekleniyor...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Ürün Ekle</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Ürün Listesi ({products.length})
        </h3>

        {products.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-apple border-2 border-dashed border-gray-200">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz ürün yok</h4>
            <p className="text-sm text-gray-600">
              Bu müşteriye ait ürün bulunmamaktadır. Yukarıdaki formu kullanarak ürün ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-apple p-4 hover:shadow-apple transition-all duration-200 animate-scale-in"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{product.productName}</h4>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-apple hover:bg-primary-50"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-gray-400 hover:text-danger-600 transition-colors rounded-apple hover:bg-danger-50"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Birim:</span>
                        <span className="ml-2 font-medium text-gray-900">{product.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Toplam Miktar:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {product.quantity.toLocaleString('tr-TR')} {product.unit}
                        </span>
                      </div>
                    </div>
                    
                    {product.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 italic">{product.description}</p>
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
  );
}

export default CustomerProductManager; 