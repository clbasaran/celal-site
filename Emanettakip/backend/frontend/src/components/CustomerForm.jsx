import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, CreditCard, MapPin, Phone, X, Check } from 'lucide-react';
import { customerAPI } from '../utils/api';

function CustomerForm({ customer, onSubmit, onCancel, isOpen = true }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: customer?.name || '',
      taxNumber: customer?.taxNumber || '',
      address: customer?.address || '',
      phone: customer?.phone || ''
    }
  });

  // Müşteri verisi değiştiğinde formu güncelle
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        taxNumber: customer.taxNumber || '',
        address: customer.address || '',
        phone: customer.phone || ''
      });
    }
  }, [customer, reset]);

  const submitForm = async (data) => {
    try {
      // API utility kullanarak POST request gönder
      const response = await customerAPI.create(data);
      
      if (response.status === 201) {
        // Başarı toast'ı göster
        toast.success('✅ Müşteri başarıyla oluşturuldu!', {
          duration: 4000,
          position: 'top-right',
        });
        
        // Formu sıfırla
        reset();
        
        // Parent component'e başarı bildirimi
        if (onSubmit) {
          onSubmit(response.data.data);
        }
      }
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      
      // Hata türüne göre mesaj göster
      if (error.response?.status === 400) {
        // Validasyon hataları
        const errorMessage = error.response.data.details
          ?.map(detail => detail.msg)
          .join('\n') || 'Geçersiz veriler girdiniz.';
        
        toast.error(`❌ ${errorMessage}`, {
          duration: 6000,
          position: 'top-right',
        });
      } else if (error.response?.status === 500) {
        // Server hatası
        toast.error('❌ Sunucu hatası oluştu. Lütfen tekrar deneyin.', {
          duration: 5000,
          position: 'top-right',
        });
      } else {
        // Network hatası
        toast.error('❌ Bağlantı hatası. İnternet bağlantınızı kontrol edin.', {
          duration: 5000,
          position: 'top-right',
        });
      }
    }
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-apple-lg max-w-md w-full max-h-full overflow-auto animate-slide-up">
        {/* Header */}
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-apple hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submitForm)} className="card-body space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center space-x-2">
                <User size={16} className="text-gray-500" />
                <span>Müşteri Adı *</span>
              </div>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Örn: Ahmet Yılmaz"
              className={`input-field ${errors.name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
              {...register('name', {
                required: 'Müşteri adı gereklidir',
                minLength: {
                  value: 2,
                  message: 'Müşteri adı en az 2 karakter olmalıdır'
                }
              })}
            />
            {errors.name && (
              <p className="text-sm text-danger-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Tax Number Field */}
          <div className="space-y-2">
            <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center space-x-2">
                <CreditCard size={16} className="text-gray-500" />
                <span>Vergi Numarası</span>
              </div>
            </label>
            <input
              id="taxNumber"
              type="text"
              placeholder="Örn: 1234567890"
              className={`input-field ${errors.taxNumber ? 'border-danger-500 focus:ring-danger-500' : ''}`}
              {...register('taxNumber', {
                pattern: {
                  value: /^[0-9]*$/,
                  message: 'Vergi numarası sadece rakam içermelidir'
                }
              })}
            />
            {errors.taxNumber && (
              <p className="text-sm text-danger-600 mt-1">{errors.taxNumber.message}</p>
            )}
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-500" />
                <span>Adres</span>
              </div>
            </label>
            <textarea
              id="address"
              rows={3}
              placeholder="Örn: Ankara Merkez, Kızılay Mahallesi..."
              className={`input-field resize-none ${errors.address ? 'border-danger-500 focus:ring-danger-500' : ''}`}
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-danger-600 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-500" />
                <span>Telefon</span>
              </div>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="Örn: 05321234567"
              className={`input-field ${errors.phone ? 'border-danger-500 focus:ring-danger-500' : ''}`}
              {...register('phone', {
                minLength: {
                  value: 10,
                  message: 'Telefon numarası en az 10 karakter olmalıdır'
                }
              })}
            />
            {errors.phone && (
              <p className="text-sm text-danger-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1 order-2 sm:order-1"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 order-1 sm:order-2 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{customer ? 'Güncelle' : 'Kaydet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm; 