import React, { useState, useEffect } from 'react';
import { QrCode, Clock, CheckCircle, XCircle, Loader, Copy, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

interface QRISPaymentProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentData {
  id: string;
  qr_string: string;
  transaction_id: string;
  midtrans_order_id: string;
  expiry_time: string;
  amount: number;
}

const QRISPayment: React.FC<QRISPaymentProps> = ({
  orderId,
  amount,
  customerEmail,
  customerName,
  onSuccess,
  onCancel,
}) => {
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'expired'>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    createPayment();
  }, []);

  useEffect(() => {
    if (paymentId && paymentStatus === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [paymentId, paymentStatus]);

  useEffect(() => {
    if (payment?.expiry_time) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expiry_time).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining === 0 && paymentStatus === 'pending') {
          setPaymentStatus('expired');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment?.expiry_time, paymentStatus]);

  const createPayment = async () => {
    try {
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15);

      const qrCodeURL = `https://api.midtrans.com/qris?amount=${amount}&orderId=${orderId}`;

      const paymentData = {
        order_id: orderId,
        user_id: customerEmail,
        total_amount: amount,
        payment_status: 'pending',
        payment_method: 'qris',
        qris_reference: qrCodeURL,
        transaction_id: `TXN-${Date.now()}`,
        midtrans_order_id: `ORDER-${orderId}-${Date.now()}`,
        expiry_time: expiryTime.toISOString(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        metadata: {
          customer_name: customerName,
          customer_email: customerEmail,
        },
      };

      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      setPaymentId(docRef.id);

      setPayment({
        id: docRef.id,
        qr_string: qrCodeURL,
        transaction_id: paymentData.transaction_id,
        midtrans_order_id: paymentData.midtrans_order_id,
        expiry_time: expiryTime.toISOString(),
        amount: amount,
      });

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || 'Gagal membuat pembayaran');
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));

      if (paymentDoc.exists()) {
        const newStatus = paymentDoc.data().payment_status;
        if (newStatus !== paymentStatus) {
          setPaymentStatus(newStatus);
          if (newStatus === 'success') {
            setTimeout(onSuccess, 2000);
          }
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  };

  const copyToClipboard = () => {
    if (payment?.qr_string) {
      navigator.clipboard.writeText(payment.qr_string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <Loader className="w-16 h-16 text-red-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Membuat QR Code...</h3>
          <p className="text-gray-600">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onCancel}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h3>
          <p className="text-gray-600 mb-4">Terima kasih atas pembayaran Anda</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 mb-1">Total Dibayar</p>
            <p className="text-2xl font-bold text-green-600">Rp {amount.toLocaleString('id-ID')}</p>
          </div>
          <p className="text-sm text-gray-500">Anda akan dialihkan secara otomatis...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'expired' || paymentStatus === 'failed') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {paymentStatus === 'expired' ? 'QR Code Kedaluwarsa' : 'Pembayaran Gagal'}
          </h3>
          <p className="text-gray-600 mb-6">Silakan coba lagi</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Scan QR Code</h3>
          <p className="text-gray-600">Scan dengan aplikasi e-wallet Anda</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 mb-6">
          <div className="bg-white rounded-xl p-4 mb-4">
            {payment?.qr_string && (
              <img
                src={payment.qr_string}
                alt="QR Code"
                className="w-full h-auto"
              />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-bold text-red-600">
              Rp {amount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2 text-orange-800">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">
              Berlaku hingga: {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {copied ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>Salin Link QR</span>
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Status akan diperbarui otomatis setelah pembayaran
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRISPayment;
