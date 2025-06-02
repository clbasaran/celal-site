import React, { useState } from 'react';
import { Settings, Package, Users, BarChart3, FileText } from 'lucide-react';
import ProductCatalogManager from '../components/ProductCatalogManager';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    {
      id: 'products',
      name: 'Ürün Kataloğu',
      icon: Package,
      description: 'Sistemdeki tüm ürünleri yönetin'
    },
    {
      id: 'users',
      name: 'Kullanıcılar',
      icon: Users,
      description: 'Kullanıcı hesaplarını yönetin',
      disabled: true
    },
    {
      id: 'reports',
      name: 'Raporlar',
      icon: BarChart3,
      description: 'Sistem raporlarını görüntüleyin',
      disabled: true
    },
    {
      id: 'settings',
      name: 'Ayarlar',
      icon: Settings,
      description: 'Sistem ayarlarını düzenleyin',
      disabled: true
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductCatalogManager />;
      case 'users':
        return (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kullanıcı Yönetimi</h3>
            <p className="text-gray-600">Bu özellik yakında eklenecek.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Raporlar</h3>
            <p className="text-gray-600">Rapor özelliği yakında eklenecek.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sistem Ayarları</h3>
            <p className="text-gray-600">Ayarlar özelliği yakında eklenecek.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-4 text-primary-600" />
            Yönetim Paneli
          </h1>
          <p className="text-gray-600 mt-2">
            Sistem yönetimi ve yapılandırma araçları
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-apple shadow-apple border border-gray-200 overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-400 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                      }
                    `}
                    disabled={tab.disabled}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                    {tab.disabled && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Yakında
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-apple shadow-apple border border-gray-200 overflow-hidden">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel; 