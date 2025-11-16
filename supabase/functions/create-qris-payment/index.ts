import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  customerDetails: {
    email: string;
    name: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!;
    const midtransClientKey = Deno.env.get('MIDTRANS_CLIENT_KEY')!;
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId, amount, customerDetails }: CreatePaymentRequest = await req.json();

    // Generate unique Midtrans order ID
    const midtransOrderId = `ORDER-${orderId}-${Date.now()}`;

    // Midtrans API endpoint
    const midtransUrl = isProduction
      ? 'https://api.midtrans.com/v2/charge'
      : 'https://api.sandbox.midtrans.com/v2/charge';

    // Create QRIS transaction
    const midtransPayload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: amount,
      },
      customer_details: {
        email: customerDetails.email,
        first_name: customerDetails.name,
      },
      qris: {
        acquirer: 'gopay',
      },
    };

    // Call Midtrans API
    const midtransResponse = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(midtransServerKey + ':'),
      },
      body: JSON.stringify(midtransPayload),
    });

    if (!midtransResponse.ok) {
      const errorData = await midtransResponse.json();
      console.error('Midtrans error:', errorData);
      throw new Error('Failed to create QRIS payment');
    }

    const midtransData = await midtransResponse.json();

    // Store payment in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount: amount,
        payment_method: 'qris',
        status: 'pending',
        qr_string: midtransData.actions?.[0]?.url || midtransData.qr_string,
        transaction_id: midtransData.transaction_id,
        midtrans_order_id: midtransOrderId,
        expiry_time: midtransData.expiry_time,
        metadata: midtransData,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Database error:', paymentError);
      throw new Error('Failed to store payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          qr_string: payment.qr_string,
          transaction_id: payment.transaction_id,
          midtrans_order_id: payment.midtrans_order_id,
          expiry_time: payment.expiry_time,
          amount: payment.amount,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});