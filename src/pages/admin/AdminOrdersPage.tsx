import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Search,
  Filter,
  ChevronDown,
  Package,
} from 'lucide-react';

interface Order {
  id: string;
  user_name: string;
  user_email: string;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'shipped';
  created_at: string;
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

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Menunggu' },
    { value: 'processing', label: 'Diproses' },
    { value: 'completed', label: 'Selesai' },
    { value: 'shipped', label: 'Dikirim' },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat pesanan...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen Pesanan</h1>
          <p className="text-slate-600 mt-1">Kelola dan pantau semua pesanan pelanggan</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau ID pesanan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-11 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 appearance-none bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="processing">Diproses</option>
                <option value="completed">Selesai</option>
                <option value="shipped">Dikirim</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <p>
              Menampilkan <span className="font-semibold">{filteredOrders.length}</span> dari{' '}
              <span className="font-semibold">{orders.length}</span> pesanan
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-3 rounded-lg">
                          <ShoppingBag className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{order.user_name}</h3>
                          <p className="text-sm text-slate-500">{order.user_email}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            ID: {order.id.slice(0, 8)}... •{' '}
                            {new Date(order.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-xl font-bold text-slate-900">
                          Rp {Number(order.total_price).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as Order['status'])
                          }
                          className={`px-4 py-2 rounded-lg font-medium text-sm border-2 focus:ring-2 focus:ring-offset-2 ${getStatusColor(
                            order.status
                          )} border-transparent focus:ring-slate-500`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-slate-600 transition-transform ${
                              expandedOrder === order.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Detail Pesanan</h4>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between p-4 bg-slate-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900">{item.pizza_name}</h5>
                              <div className="mt-1 space-y-1 text-sm text-slate-600">
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
                              <p className="font-bold text-slate-900">
                                Rp {Number(item.price).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak ada pesanan</h3>
              <p className="text-slate-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tidak ada pesanan yang sesuai dengan filter'
                  : 'Belum ada pesanan masuk'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
