import React from 'react';
import { useForm } from 'react-hook-form';
import { Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function AddPaymentForm({ onSubmit, loading = false, globalProducts = [] }) {
  console.log('AddPaymentForm received globalProducts:', globalProducts);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      productId: '',
      quantity: '',
      note: ''
    }
  });

  // Watch selected product to auto-fill unit
  const selectedProductId = watch('productId');
  const selectedProduct = React.useMemo(() => {
    if (!selectedProductId || !globalProducts.length) return null;
    return globalProducts.find(p => p.id === parseInt(selectedProductId));
  }, [selectedProductId, globalProducts]);

  // Sort products alphabetically
  const sortedProducts = React.useMemo(() => {
    console.log('Sorting products:', globalProducts);
    return (globalProducts || [])
      .filter(p => p.productName && p.productName.trim() !== '')
      .sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
  }, [globalProducts]);

  const onFormSubmit = async (data) => {
    try {
      const selectedProduct = globalProducts.find(p => p.id === parseInt(data.productId));
      
      if (!selectedProduct) {
        toast.error('❌ Seçilen ürün bulunamadı!', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      // Prepare order data (simulated as payment for compatibility)
      const orderData = {
        amount: 0, // Fiyat takibi yok
        method: 'Sipariş',
        note: data.note || null,
        products: [{
          productId: parseInt(data.productId),
          name: selectedProduct.productName,
          quantity: parseFloat(data.quantity),
          unit: selectedProduct.unit,
          note: data.note || null
        }]
      };

      // Call parent submit handler
      await onSubmit(orderData);
      
      // Reset form on success
      reset({
        productId: '',
        quantity: '',
        note: ''
      });
      
      toast.success('✅ Ürün siparişi başarıyla kaydedildi!', {
        duration: 4000,
        position: 'top-right',
      });
      
    } catch (error) {
      console.error('Order form error:', error);
      toast.error('❌ Sipariş kaydedilirken hata oluştu.', {
        duration: 5000,
        position: 'top-right',
      });
    }
  };

  // If no products available, show disabled state
  if (globalProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 px-4 bg-gray-50 rounded-apple border-2 border-dashed border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün Bulunamadı</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sistemde henüz ürün tanımlanmamış.
          </p>
          <p className="text-xs text-gray-500">
            Ürün eklemek için <strong>Admin Paneli</strong>'ni kullanın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-blue-50 border border-blue-200 rounded-apple p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Bu sistemde fiyat takibi yapılmamaktadır. Sadece müşteriye ürün siparişi tanımlanır.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Product Selection Field */}
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Seçimi *
          </label>
          <select
            id="productId"
            className={`input-field ${errors.productId ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            {...register('productId', { required: 'Ürün seçimi gereklidir' })}
          >
            <option value="">Ürün seçiniz</option>
            {sortedProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.productName} ({product.unit})
                {product.description && ` - ${product.description}`}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-sm text-danger-600 mt-1">{errors.productId.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {sortedProducts.length} ürün mevcut
            {selectedProduct && (
              <span className="ml-2 font-medium">
                • Seçilen: {selectedProduct.productName} ({selectedProduct.unit})
              </span>
            )}
          </p>
        </div>

        {/* Quantity Field */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Sipariş Miktarı * {selectedProduct && <span className="text-gray-500">({selectedProduct.unit})</span>}
          </label>
          <input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
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

        {/* Note Field */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Not <span className="text-gray-400">(İsteğe bağlı)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            placeholder="Sipariş ile ilgili özel not..."
            className="input-field resize-none"
            {...register('note')}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedProduct}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Kaydediliyor...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Sipariş Ekle</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default AddPaymentForm; 