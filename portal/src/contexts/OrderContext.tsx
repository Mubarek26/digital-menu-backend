import React, { createContext, useContext, useState } from 'react';
import { ServiceType } from '../types';

interface OrderContextType {
  serviceType: ServiceType | null;
  tableNumber: string;
  phoneNumber: string;
  orderId: string;
  setServiceType: (type: ServiceType) => void;
  setTableNumber: (number: string) => void;
  setPhoneNumber: (number: string) => void;
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderId, setOrderId] = useState('');

  const resetOrder = () => {
    setServiceType(null);
    setTableNumber('');
    setPhoneNumber('');
    setOrderId('');
  };

  return (
    <OrderContext.Provider value={{
      serviceType,
      tableNumber,
      phoneNumber,
      setServiceType,
      setTableNumber,
      setPhoneNumber,
      resetOrder,
      orderId
    }}>
      {children}
    </OrderContext.Provider>
  );
};