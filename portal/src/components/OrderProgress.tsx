import React from 'react';
import { CheckCircle, CreditCard, ShoppingCart, Award } from 'lucide-react';

type Step = 'cart' | 'payment' | 'success';

const StepBubble: React.FC<{ active?: boolean; done?: boolean; label: string; icon?: React.ReactNode }> = ({ active, done, label, icon }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-green-500 text-white' : active ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
        {done ? <CheckCircle className="w-5 h-5" /> : icon}
      </div>
      <div className="text-sm">
        <div className={`font-semibold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{label}</div>
      </div>
    </div>
  );
};

const OrderProgress: React.FC<{ step: Step }> = ({ step }) => {
  return (
    <div className="w-full bg-white/50 dark:bg-gray-900/40 rounded-xl mb-4">
      <div className="flex items-center justify-between ">
        <StepBubble label="Cart" icon={<ShoppingCart className="w-2 h-2" />} done={step === 'payment' || step === 'success'} active={step === 'cart'} />
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
        <StepBubble label="Payment" icon={<CreditCard className="w-2 h-2" />} done={step === 'success'} active={step === 'payment'} />
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
        <StepBubble label="Success" icon={<Award className="w-2 h-2" />} done={step === 'success'} active={step === 'success'} />
      </div>
    </div>
  );
};

export default OrderProgress;
