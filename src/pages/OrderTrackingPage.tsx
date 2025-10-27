import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { supabase } from '../lib/supabase';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface Order {
  id: string;
  user_name: string;
  user_email: string;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'shipped';
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  pizza_name: string;
  size: string;
  crust: string;
  sauce: string;
  toppings: any;
  quantity: number;
  price: number;
}

const OrderTrackingPage = () => {
  const { authUser, isLoading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    if (authUser) {
      loadOrders();

      const channel = supabase
        .channel('order_tracking')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${authUser.id}`,
          },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authUser]);

  const loadOrders = async () => {
    if (!authUser) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu Konfirmasi',
      processing: 'Sedang Diproses',
      completed: 'Pesanan Selesai',
      shipped: 'Dalam Pengiriman',
    };
    return labels[status] || status;
  };

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      pending: 'Pesanan Anda sedang menunggu konfirmasi dari admin',
      processing: 'Pesanan Anda sedang dibuat oleh chef kami',
      shipped: 'Pesanan Anda sedang dalam perjalanan',
      completed: 'Pesanan Anda telah selesai dan diterima',
    };
    return descriptions[status] || '';
  };

  const getTimelineSteps = (status: string) => {
    const steps = [
      { status: 'pending', label: 'Pesanan Diterima', icon: Clock },
      { status: 'processing', label: 'Sedang Dibuat', icon: Package },
      { status: 'shipped', label: 'Dalam Pengiriman', icon: Truck },
      { status: 'completed', label: 'Selesai', icon: CheckCircle },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'completed'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: statusOrder[index] === status,
    }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    const timelineSteps = getTimelineSteps(selectedOrder.status);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <button
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Daftar Pesanan
          </button>

          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Detail Pesanan</h1>
                <p className="text-gray-500">ID: {selectedOrder.id.slice(0, 8)}...</p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {getStatusIcon(selectedOrder.status)}
                {getStatusLabel(selectedOrder.status)}
              </span>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-8">
              <p className="text-gray-700 text-center font-medium">
                {getStatusDescription(selectedOrder.status)}
              </p>
            </div>

            <div className="relative mb-8">
              <div className="flex items-center justify-between">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all ${
                            step.isActive
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-gray-200 border-gray-300 text-gray-400'
                          } ${step.isCurrent ? 'ring-4 ring-red-200' : ''}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <p
                          className={`mt-3 text-sm font-semibold text-center ${
                            step.isActive ? 'text-gray-800' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      {index < timelineSteps.length - 1 && (
                        <div
                          className={`absolute top-7 left-1/2 w-full h-1 -z-10 ${
                            step.isActive ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Item Pesanan</h3>
              <div className="space-y-4">
                {selectedOrder.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.pizza_name}</h4>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Ukuran:</span> {item.size} •{' '}
                          <span className="font-medium">Crust:</span> {item.crust}
                        </p>
                        <p>
                          <span className="font-medium">Saus:</span> {item.sauce}
                        </p>
                        {item.toppings && Array.isArray(item.toppings) && item.toppings.length > 0 && (
                          <p>
                            <span className="font-medium">Topping:</span>{' '}
                            {item.toppings.map((t: any) => t.name).join(', ')}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Jumlah:</span> {item.quantity}x
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        Rp {Number(item.price).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-red-600">
                    Rp {Number(selectedOrder.total_price).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-8">
          Lacak Pesanan
        </h1>

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-400">ID: {order.id.slice(0, 8)}...</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {order.order_items.length} item pesanan
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">Total Pembayaran:</span>
                    <span className="text-xl font-bold text-red-600">
                      Rp {Number(order.total_price).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                  Lihat Detail
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Mulai pesan pizza favorit Anda sekarang!</p>
            <button
              onClick={() => navigate('/order')}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all"
            >
              Pesan Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
