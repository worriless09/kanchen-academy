// app/api/payments/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency, type, reference_id } = await request.json();

    // Create payment transaction record
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        transaction_type: type,
        reference_id,
        amount,
        currency: currency || 'INR',
        status: 'pending',
        payment_gateway: 'razorpay'
      })
      .select()
      .single();

    if (error) throw error;

    // Create Razorpay order (mock implementation)
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      status: 'created'
    };

    // Update transaction with gateway order ID
    await supabase
      .from('payment_transactions')
      .update({ gateway_order_id: razorpayOrder.id })
      .eq('id', transaction.id);

    return NextResponse.json({
      order: razorpayOrder,
      transaction_id: transaction.id
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
