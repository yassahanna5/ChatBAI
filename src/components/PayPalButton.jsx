// src/components/PayPalButton.jsx
import React from 'react';
import { PAYPAL_CONFIG } from '@/config/paypal';

export default function PayPalButton({ plan, user, onSuccess, onError }) {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // تحميل SDK PayPal
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.CLIENT_ID}&vault=true&intent=subscription`;
    script.async = true;
    script.onload = () => setIsReady(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  React.useEffect(() => {
    if (isReady && window.paypal) {
      const buttonContainer = `paypal-button-container-${plan.id}`;
      
      window.paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
        },
        createSubscription: function(data, actions) {
          return actions.subscription.create({
            plan_id: PAYPAL_CONFIG.PLAN_IDS[plan.id],
            custom_id: user?.email || ''
          });
        },
        onApprove: async function(data, actions) {
          try {
            // جلب تفاصيل الاشتراك
            const subscription = await actions.subscription.get();
            onSuccess({
              subscriptionID: data.subscriptionID,
              plan: plan,
              subscriber: subscription.subscriber,
              status: subscription.status,
              createTime: subscription.create_time
            });
          } catch (error) {
            onError(error);
          }
        },
        onError: function(err) {
          console.error('PayPal Error:', err);
          onError(err);
        }
      }).render(`#${buttonContainer}`);
    }
  }, [isReady, plan, user, onSuccess, onError]);

  return <div id={`paypal-button-container-${plan.id}`} className="w-full"></div>;
}