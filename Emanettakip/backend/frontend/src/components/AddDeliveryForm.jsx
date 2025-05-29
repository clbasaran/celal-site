import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function AddDeliveryForm({ customerId, onSubmit, loading = false, availableProducts = [] }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      productId: '',
      quantity: '',
      deliveryDate: new Date().toISOString().split('T')[0], // Today's date
      note: ''
    }
  });

  // Watch selected product to auto-fill unit
  const selectedProductId = watch('productId');
  const selectedProduct = React.useMemo(() => {
    if (!selectedProductId || !availableProducts.length) return null;
    return availableProducts.find(p => p.productId === parseInt(selectedProductId));
  }, [selectedProductId, availableProducts]);

  // Sort products alphabetically and auto-select first product
  const sortedProducts = React.useMemo(() => {
    return (availableProducts || [])
      .filter(p => p.productName && p.quantity > 0) // Sadece stoğu olan ürünler
      .sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
  }, [availableProducts]);

  // Auto-select first product when available products change
  useEffect(() => {
    if (sortedProducts.length > 0) {
      setValue('productId', sortedProducts[0].productId.toString());
    }
  }, [sortedProducts, setValue]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const onFormSubmit = async (data) => {
    try {
      const selectedProduct = availableProducts.find(p => p.productId === parseInt(data.productId));
      
      if (!selectedProduct) {
        toast.error('❌ Seçilen ürün bulunamadı!', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }

      // Stok kontrolü
      const requestedQuantity = parseFloat(data.quantity);
      if (requestedQuantity > selectedProduct.quantity) {
        toast.error(`❌ Yetersiz stok! Mevcut: ${selectedProduct.quantity} ${selectedProduct.unit}`, {
          duration: 5000,
          position: 'top-right',
        });
        return;
      }

      // Prepare delivery data
      const deliveryData = {
        customerId: customerId,
        productId: parseInt(data.productId),
        productName: selectedProduct.productName,
        quantity: requestedQuantity,
        unit: selectedProduct.unit,
        deliveryDate: data.deliveryDate,
        note: data.note || null
      };

      // Call parent submit handler
      await onSubmit(deliveryData);
      
      // Reset form on success (but keep first product selected)
      reset({
        productId: sortedProducts[0]?.productId?.toString() || '',
        quantity: '',
        deliveryDate: getTodayDate(),
        note: ''
      });
      
      toast.success('✅ Teslimat başarıyla kaydedildi!', {
        duration: 4000,
        position: 'top-right',
      });
      
    } catch (error) {
      console.error('Delivery form error:', error);
      // Error handling is done in parent component
    }
  };

  // If no products available, show disabled state
  if (availableProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 px-4 bg-gray-50 rounded-apple border-2 border-dashed border-gray-200">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aktif Stok Bulunamadı</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bu müşterinin teslim edilebilir stoğu bulunmamaktadır.
          </p>
          <p className="text-xs text-gray-500">
            Önce **Sipariş** sekmesinden ürün siparişi verin, ardından teslimat yapabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
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
              <option key={product.productId} value={product.productId}>
                {product.productName} ({product.unit}) - Stok: {product.quantity}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-sm text-danger-600 mt-1">{errors.productId.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {sortedProducts.length} ürün stoğu mevcut
            {selectedProduct && (
              <span className="ml-2 font-medium text-blue-600">
                • Seçilen: {selectedProduct.productName} (Mevcut: {selectedProduct.quantity} {selectedProduct.unit})
              </span>
            )}
          </p>
        </div>

        {/* Quantity Field */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Miktar * {selectedProduct && <span className="text-gray-500">({selectedProduct.unit})</span>}
            {selectedProduct && (
              <span className="text-xs text-blue-600 ml-2">
                Maksimum: {selectedProduct.quantity}
              </span>
            )}
          </label>
          <input
            id="quantity"
            type="number"
            step="0.01"
            min="0.01"
            max={selectedProduct ? selectedProduct.quantity : undefined}
            placeholder="0"
            className={`input-field ${errors.quantity ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            {...register('quantity', {
              required: 'Miktar gereklidir',
              min: { value: 0.01, message: 'Miktar 0\'dan büyük olmalıdır' },
              max: selectedProduct ? { 
                value: selectedProduct.quantity, 
                message: `Maksimum ${selectedProduct.quantity} ${selectedProduct.unit} teslim edilebilir` 
              } : undefined
            })}
          />
          {errors.quantity && (
            <p className="text-sm text-danger-600 mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {/* Delivery Date Field */}
        <div>
          <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Teslimat Tarihi *
          </label>
          <input
            id="deliveryDate"
            type="date"
            className={`input-field ${errors.deliveryDate ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            {...register('deliveryDate', { required: 'Teslimat tarihi gereklidir' })}
          />
          {errors.deliveryDate && (
            <p className="text-sm text-danger-600 mt-1">{errors.deliveryDate.message}</p>
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
            placeholder="Teslimat ile ilgili özel not..."
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
              <span>Teslimat Ekle</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default AddDeliveryForm; 