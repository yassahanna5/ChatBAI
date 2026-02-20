// src/pages/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('✅ Payment success params:', Object.fromEntries(searchParams));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F1F2] to-[#A1D6E2]/20">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-xl">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-slate-600 mb-8">
          Thank you for your subscription. Your account has been upgraded.
        </p>
        <Button onClick={() => navigate(createPageUrl('Chat'))}>
          Go to Chat
        </Button>
      </div>
    </div>
  );
}