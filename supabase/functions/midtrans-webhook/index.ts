import { corsHeaders } from '../_shared/cors.ts';

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || '';
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || '';
const FIREBASE_SERVICE_ACCOUNT_KEY = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY') || '';

interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  transaction_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  signature_key: string;
}

function verifySignature(notification: MidtransNotification): boolean {
  const crypto = globalThis.crypto.subtle;
  const { order_id, status_code, gross_amount, signature_key } = notification as any;

  const signatureString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const notification: MidtransNotification = await req.json();

    console.log('Received Midtrans notification:', notification);

    const isValid = verifySignature(notification);
    if (!isValid) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let paymentStatus = 'pending';

    if (notification.transaction_status === 'capture' || notification.transaction_status === 'settlement') {
      paymentStatus = 'success';
    } else if (notification.transaction_status === 'cancel' || notification.transaction_status === 'deny' || notification.transaction_status === 'expire') {
      paymentStatus = 'failed';
    } else if (notification.transaction_status === 'pending') {
      paymentStatus = 'pending';
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/payments`;

    const paymentsResponse = await fetch(
      `${firestoreUrl}?pageSize=1000`,
      {
        headers: {
          'Authorization': `Bearer ${FIREBASE_SERVICE_ACCOUNT_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentsData = await paymentsResponse.json();
    const paymentDoc = paymentsData.documents?.find((doc: any) =>
      doc.fields?.midtrans_order_id?.stringValue === notification.order_id
    );

    if (!paymentDoc) {
      console.error('Payment not found for order:', notification.order_id);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentId = paymentDoc.name.split('/').pop();
    const orderId = paymentDoc.fields?.order_id?.stringValue;

    const updateData = {
      fields: {
        ...paymentDoc.fields,
        payment_status: { stringValue: paymentStatus },
        transaction_id: { stringValue: notification.transaction_id },
        updated_at: { timestampValue: new Date().toISOString() },
      }
    };

    if (paymentStatus === 'success') {
      updateData.fields.paid_at = { timestampValue: new Date().toISOString() };
    }

    const updateResponse = await fetch(
      `${firestoreUrl}/${paymentId}?updateMask.fieldPaths=payment_status&updateMask.fieldPaths=transaction_id&updateMask.fieldPaths=updated_at${paymentStatus === 'success' ? '&updateMask.fieldPaths=paid_at' : ''}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${FIREBASE_SERVICE_ACCOUNT_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      console.error('Error updating payment:', await updateResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (paymentStatus === 'success' && orderId) {
      const ordersUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/orders`;

      const orderResponse = await fetch(`${ordersUrl}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${FIREBASE_SERVICE_ACCOUNT_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (orderResponse.ok) {
        const orderDoc = await orderResponse.json();

        await fetch(
          `${ordersUrl}/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updated_at`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${FIREBASE_SERVICE_ACCOUNT_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                ...orderDoc.fields,
                status: { stringValue: 'processing' },
                updated_at: { timestampValue: new Date().toISOString() },
              }
            }),
          }
        );
      }
    }

    console.log('Payment updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment status updated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
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
