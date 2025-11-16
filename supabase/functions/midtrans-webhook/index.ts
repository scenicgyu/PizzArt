import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_id: string;
  signature_key: string;
  status_code: string;
  fraud_status?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const notification: MidtransNotification = await req.json();

    // Log webhook for debugging
    await supabase.from('webhook_logs').insert({
      event_type: 'midtrans_notification',
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payload: notification,
      processed: false,
    });

    // Verify signature
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;

    const hash = createHash('sha512');
    const expectedSignature = hash
      .update(orderId + statusCode + grossAmount + midtransServerKey)
      .digest('hex');

    if (signatureKey !== expectedSignature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find payment by midtrans_order_id
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single();

    if (findError || !payment) {
      console.error('Payment not found:', findError);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine payment status based on Midtrans status
    let newStatus = 'pending';
    let paidAt = null;

    switch (notification.transaction_status) {
      case 'capture':
      case 'settlement':
        if (notification.fraud_status === 'accept' || !notification.fraud_status) {
          newStatus = 'success';
          paidAt = new Date().toISOString();
        }
        break;
      case 'pending':
        newStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'failed';
        break;
      default:
        newStatus = 'pending';
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          notification: notification,
        },
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      throw new Error('Failed to update payment');
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('order_id', orderId)
      .eq('processed', false);

    console.log(`Payment ${payment.id} updated to ${newStatus}`);

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
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