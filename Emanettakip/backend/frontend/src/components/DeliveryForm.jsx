import React from 'react';

function DeliveryForm({ customerId, delivery, onSubmit, onCancel }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">
          {delivery ? 'Teslimat Düzenle' : 'Yeni Teslimat'}
        </h2>
      </div>
      <div className="card-body">
        <p className="text-gray-500 text-center py-8">
          Teslimat formu henüz hazırlanmadı...
        </p>
        <div className="flex justify-end space-x-3">
          <button className="btn-secondary" onClick={onCancel}>
            İptal
          </button>
          <button className="btn-primary" onClick={onSubmit}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryForm; 