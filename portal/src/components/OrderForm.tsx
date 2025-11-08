import React, { useState } from 'react';
import { Phone, MapPin, Store, Truck } from 'lucide-react';
import { useOrder } from '../contexts/OrderContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ServiceType } from '../types';

const OrderForm: React.FC = () => {
  const { serviceType, tableNumber, phoneNumber, setServiceType, setTableNumber, setPhoneNumber, specialInstructions, setSpecialInstructions } = useOrder();
  const { t } = useLanguage();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!serviceType) {
      newErrors.serviceType = t('required');
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('required');
    } else if (!/^\+?[\d\s-()]{10,}$/.test(phoneNumber.trim())) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }
    
    if (serviceType === 'dine-in' && !tableNumber.trim()) {
      newErrors.tableNumber = t('required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    if (type !== 'dine-in') {
      setTableNumber('');
    }
    // Clear service type error when user makes a selection
    if (errors.serviceType) {
      setErrors(prev => ({ ...prev, serviceType: '' }));
    }
  };

  const serviceOptions = [
    {
      type: 'dine-in' as ServiceType,
      icon: Store,
      title: t('dineIn'),
      description: 'Eat at the restaurant'
    },
    {
      type: 'takeaway' as ServiceType,
      icon: MapPin,
      title: t('takeaway'),
      description: 'Pick up your order'
    },
    {
      type: 'delivery' as ServiceType,
      icon: Truck,
      title: t('delivery'),
      description: 'We deliver to you'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('orderDetails')}
      </h3>
      
      {/* Service Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('selectService')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {serviceOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleServiceTypeChange(option.type)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  serviceType === option.type
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-6 h-6 ${
                    serviceType === option.type 
                      ? 'text-teal-600 dark:text-teal-400' 
                      : 'text-gray-400'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      serviceType === option.type 
                        ? 'text-teal-700 dark:text-teal-300' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.title}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {errors.serviceType && (
          <p className="mt-1 text-sm text-red-600">{errors.serviceType}</p>
        )}
      </div>

      {/* Table Number (for dine-in) */}
      {serviceType === 'dine-in' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('tableNumber')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => {
              setTableNumber(e.target.value);
              if (errors.tableNumber) {
                setErrors(prev => ({ ...prev, tableNumber: '' }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
              errors.tableNumber 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
            }`}
            placeholder={t('tableNumberPlaceholder')}
          />
          {errors.tableNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.tableNumber}</p>
          )}
        </div>
      )}

      {/* Phone Number */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('phoneNumber')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (errors.phoneNumber) {
                setErrors(prev => ({ ...prev, phoneNumber: '' }));
              }
            }}
            className={`w-full pl-10 pr-3 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
              errors.phoneNumber 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
            }`}
            placeholder={t('phoneNumberPlaceholder')}
          />
        </div>
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Note / Special Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('specialInstructions') || 'Special Instructions'}
        </label>
        <textarea
          value={specialInstructions || ''}
          onChange={e => setSpecialInstructions(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 border-gray-200 dark:border-gray-600"
          placeholder={t('specialInstructionsPlaceholder') || 'Add any notes or instructions for your order'}
          rows={3}
        />
      </div>

      {/* Validation function for external use */}
      <div style={{ display: 'none' }}>
        {JSON.stringify({ validateForm })}
      </div>
    </div>
  );
};

export default OrderForm;