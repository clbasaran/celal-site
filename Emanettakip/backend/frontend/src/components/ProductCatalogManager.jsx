import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Package, Trash2, Edit, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI } from '../utils/api';

function ProductCatalogManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      productName: '',
      unit: 'kg',
      description: ''
    }
  });

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAll();
      setProducts(response.data);
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
    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Add new product
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      const productData = {
        productName: data.productName.trim(),
        unit: data.unit,
        description: data.description.trim() || null
      };

      await productAPI.create(productData);
      
      // Refresh products list
      await fetchProducts();
      
      // Reset form and hide
      reset({
        productName: '',
        unit: 'kg',
        description: ''
      });
      setShowAddForm(false);
      
      toast.success('✅ Ürün başarıyla eklendi!', {
        duration: 4000,
        position: 'top-right',
      });
      
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      
      // Check for validation errors
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details;
        validationErrors.forEach(err => {
          toast.error(`❌ ${err.msg}`, {
            duration: 5000,
            position: 'top-right',
          });
        });
      } else {
        toast.error('❌ Ürün eklenirken hata oluştu.', {
          duration: 5000,
          position: 'top-right',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }
    
    try {
      await productAPI.delete(productId);
      
      // Refresh products list
      await fetchProducts();
      
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

  // Unit options
  const unitOptions = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'ton', label: 'Ton' },
    { value: 'litre', label: 'Litre' },
    { value: 'çuval', label: 'Çuval' },
    { value: 'adet', label: 'Adet' },
    { value: 'kutu', label: 'Kutu' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 text-lg">Ürünler yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="w-7 h-7 mr-3 text-primary-600" />
            Ürün Kataloğu
          </h1>
          <p className="text-gray-600 mt-1">
            Sistemdeki tüm ürünleri yönetin
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Yeni Ürün</span>
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-apple shadow-apple border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Yeni Ürün Ekle
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  id="productName"
                  className={`input-field ${errors.productName ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Ürün adını giriniz"
                  {...register('productName', {
                    required: 'Ürün adı gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Ürün adı en az 2 karakter olmalıdır'
                    }
                  })}
                />
                {errors.productName && (
                  <p className="text-sm text-danger-600 mt-1">{errors.productName.message}</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Birim *
                </label>
                <select
                  id="unit"
                  className={`input-field ${errors.unit ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  {...register('unit', { required: 'Birim seçimi gereklidir' })}
                >
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="text-sm text-danger-600 mt-1">{errors.unit.message}</p>
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
                rows={3}
                className="input-field resize-none"
                placeholder="Ürün açıklaması (isteğe bağlı)"
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Açıklama en fazla 500 karakter olabilir'
                  }
                })}
              />
              {errors.description && (
                <p className="text-sm text-danger-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center justify-center space-x-2"
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
              
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  reset();
                }}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredProducts.length} / {products.length} ürün
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-apple shadow-apple border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4">
            {searchTerm ? (
              <>
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Arama sonucu bulunamadı</h3>
                <p className="text-gray-600">
                  "{searchTerm}" araması için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.
                </p>
              </>
            ) : (
              <>
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ürün yok</h3>
                <p className="text-gray-600 mb-4">
                  Henüz sisteme ürün eklenmemiş. İlk ürününüzü ekleyerek başlayın.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>İlk Ürünü Ekle</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.description || (
                          <span className="text-gray-400 italic">Açıklama yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDelete(product.id, product.product_name)}
                          className="p-2 text-gray-400 hover:text-danger-600 transition-colors rounded-apple hover:bg-danger-50"
                          title="Ürünü Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Count Summary */}
      {products.length > 0 && (
        <div className="bg-gray-50 rounded-apple p-4 border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Toplam {products.length} ürün kayıtlı</span>
            {searchTerm && (
              <span>"{searchTerm}" için {filteredProducts.length} sonuç</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductCatalogManager; 