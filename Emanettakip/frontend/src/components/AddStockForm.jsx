import React, { useState, useEffect } from 'react';
import { Package, Plus, Minus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function AddStockForm({ onSubmit, loading, globalProducts }) {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [note, setNote] = useState('');

  console.log('AddStockForm received globalProducts:', globalProducts);

  // Add product to list
  const addProduct = () => {
    if (!globalProducts || globalProducts.length === 0) {
      toast.error('❌ Henüz ürün bulunmuyor. Önce admin panelden ürün ekleyin.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    setSelectedProducts(prev => [...prev, {
      id: '',
      productName: '',
      quantity: '',
      unit: '',
      note: ''
    }]);
  };

  // Remove product from list
  const removeProduct = (index) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Update product in list
  const updateProduct = (index, field, value) => {
    setSelectedProducts(prev => prev.map((product, i) => {
      if (i === index) {
        const updatedProduct = { ...product, [field]: value };
        
        // If product ID changes, update product name and unit
        if (field === 'id' && value) {
          const selectedGlobalProduct = globalProducts.find(p => p.id === parseInt(value));
          if (selectedGlobalProduct) {
            updatedProduct.productName = selectedGlobalProduct.productName;
            updatedProduct.unit = selectedGlobalProduct.unit;
          }
        }
        
        return updatedProduct;
      }
      return product;
    }));
  };

  // Sort and filter available products
  const availableProducts = globalProducts ? globalProducts.sort((a, b) => 
    a.productName.localeCompare(b.productName, 'tr')
  ) : [];

  console.log('Sorting products:', availableProducts);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (selectedProducts.length === 0) {
      toast.error('❌ En az bir ürün seçmelisiniz.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }

    // Validate each product
    for (const product of selectedProducts) {
      if (!product.id || !product.quantity || parseFloat(product.quantity) <= 0) {
        toast.error('❌ Tüm ürünler için geçerli miktar girmelisiniz.', {
          duration: 4000,
          position: 'top-right',
        });
        return;
      }
    }

    const stockData = {
      method: 'stok_girisi', // Fixed method for stock entries
      note: note.trim(),
      products: selectedProducts.map(product => ({
        id: parseInt(product.id),
        name: product.productName,
        quantity: parseFloat(product.quantity),
        unit: product.unit,
        note: product.note
      }))
    };

    try {
      await onSubmit(stockData);
      
      // Reset form
      setSelectedProducts([]);
      setNote('');
      
      toast.success('✅ Stok girişi başarıyla kaydedildi!', {
        duration: 4000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Stok form error:', error);
      toast.error('❌ Stok girişi kaydedilirken hata oluştu.', {
        duration: 5000,
        position: 'top-right',
      });
    }
  };

  // Auto-add first product when form loads
  useEffect(() => {
    if (selectedProducts.length === 0) {
      addProduct();
    }
  }, [globalProducts]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Package className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Müşteri Ürün Girişi</h3>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Ürünler
          </label>
          <button
            type="button"
            onClick={addProduct}
            className="btn-secondary-sm flex items-center space-x-1"
          >
            <Plus size={16} />
            <span>Ürün Ekle</span>
          </button>
        </div>

        {selectedProducts.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-apple">
            <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">Henüz ürün eklenmedi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedProducts.map((product, index) => (
              <div key={index} className="bg-gray-50 rounded-apple p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Ürün {index + 1}
                  </span>
                  {selectedProducts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Product Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ürün Seçin
                    </label>
                    <select
                      value={product.id}
                      onChange={(e) => updateProduct(index, 'id', e.target.value)}
                      className="input-field text-sm"
                      required
                    >
                      <option value="">Ürün seçin...</option>
                      {availableProducts.map((globalProduct) => (
                        <option key={globalProduct.id} value={globalProduct.id}>
                          {globalProduct.productName} ({globalProduct.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Miktar {product.unit && `(${product.unit})`}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      placeholder="Miktar girin"
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  {/* Product Note */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ürün Notu (isteğe bağlı)
                    </label>
                    <input
                      type="text"
                      value={product.note}
                      onChange={(e) => updateProduct(index, 'note', e.target.value)}
                      placeholder="Ürün ile ilgili not"
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Genel Not (isteğe bağlı)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="input-field resize-none"
          placeholder="Stok girişi ile ilgili genel not..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || selectedProducts.length === 0 || !selectedProducts.some(p => p.id && p.quantity)}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Kaydediliyor...</span>
          </>
        ) : (
          <>
            <Package size={16} />
            <span>Stok Girişi Kaydet</span>
          </>
        )}
      </button>

      {/* Info Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-apple p-3">
        <p className="text-sm text-blue-700">
          <strong>💡 Bilgi:</strong> Bu ekrandan admin panelde oluşturduğunuz ürünleri müşteriye stok olarak girebilirsiniz. 
          Girilen stoklar müşterinin stok listesine eklenecek ve teslimat ekranından teslim edilebilecektir.
        </p>
      </div>
    </form>
  );
}

export default AddStockForm; 