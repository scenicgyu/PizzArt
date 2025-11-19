import { corsHeaders } from '../_shared/cors.ts';

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || '';
const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

interface PaymentRequest {
  order_id: string;
  gross_amount: number;
  customer_details: {
    email: string;
    first_name: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { order_id, gross_amount, customer_details }: PaymentRequest = await req.json();

    if (!order_id || !gross_amount || !customer_details) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authString = btoa(MIDTRANS_SERVER_KEY + ':');

    const transactionData = {
      payment_type: 'qris',
      transaction_details: {
        order_id,
        gross_amount,
      },
      customer_details,
      qris: {
        acquirer: 'gopay',
      },
    };

    console.log('Creating QRIS payment:', transactionData);

    const response = await fetch(`${MIDTRANS_BASE_URL}/charge`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    console.log('Midtrans response:', result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Midtrans API error',
          details: result
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: result.transaction_id,
        order_id: result.order_id,
        qr_string: result.qr_string || result.actions?.[0]?.url,
        transaction_status: result.transaction_status,
        expiry_time: result.expiry_time,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating QRIS payment:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
