// lib/services/payment-service.ts
import Razorpay from 'razorpay';

export class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(amount: number, currency: string = 'INR') {
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    return await this.razorpay.orders.create(options);
  }

  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    return generated_signature === razorpay_signature;
  }
}

// components/features/PaymentForm.tsx
export default function PaymentForm({ planId, amount }: PaymentFormProps) {
  const handlePayment = async () => {
    const order = await createPaymentOrder(amount);
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Kanchen Academy',
      description: 'Premium Subscription',
      order_id: order.id,
      handler: async (response: any) => {
        await verifyPayment(response);
        // Activate subscription
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
      theme: {
        color: '#3B82F6',
      },
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="payment-form">
      {/* Payment UI */}
    </div>
  );
}
