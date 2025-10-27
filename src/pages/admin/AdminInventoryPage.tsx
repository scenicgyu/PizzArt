import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'base';
  stock_quantity: number;
  unit: string;
  is_available: boolean;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

const AdminInventoryPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'meat' as InventoryItem['category'],
    stock_quantity: 0,
    unit: 'kg',
    is_available: true,
    low_stock_threshold: 10,
  });

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, categoryFilter]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInventory(filtered);
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ is_available: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory').insert([formData]);

        if (error) throw error;
      }

      await loadInventory();
      closeModal();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Gagal menyimpan data. Pastikan nama item unik.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);

      if (error) throw error;
      await loadInventory();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Gagal menghapus item');
    }
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        stock_quantity: item.stock_quantity,
        unit: item.unit,
        is_available: item.is_available,
        low_stock_threshold: item.low_stock_threshold,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'meat',
        stock_quantity: 0,
        unit: 'kg',
        is_available: true,
        low_stock_threshold: 10,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      meat: 'Daging',
      vegetable: 'Sayuran',
      cheese: 'Keju',
      sauce: 'Saus',
      base: 'Base',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      meat: 'bg-red-100 text-red-800',
      vegetable: 'bg-green-100 text-green-800',
      cheese: 'bg-yellow-100 text-yellow-800',
      sauce: 'bg-orange-100 text-orange-800',
      base: 'bg-blue-100 text-blue-800',
    };
    return colors[category] || 'bg-slate-100 text-slate-800';
  };

  const getStockStatus = (item: InventoryItem) => {
    if (!item.is_available) {
      return { color: 'text-red-600', icon: XCircle, label: 'Tidak Tersedia' };
    }
    if (item.stock_quantity < item.low_stock_threshold) {
      return { color: 'text-orange-600', icon: AlertTriangle, label: 'Stok Rendah' };
    }
    return { color: 'text-green-600', icon: CheckCircle, label: 'Tersedia' };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Memuat inventori...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Inventori</h1>
            <p className="text-slate-600 mt-1">Kelola stok bahan baku dan ketersediaan</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Item
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari bahan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="base">Base</option>
              <option value="sauce">Saus</option>
              <option value="cheese">Keju</option>
              <option value="meat">Daging</option>
              <option value="vegetable">Sayuran</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const status = getStockStatus(item);
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                      item.is_available
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {item.is_available ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Stok:</span>
                    <span className="text-lg font-bold text-slate-900">
                      {item.stock_quantity} {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${status.color}`} />
                    <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                  </div>

                  {item.stock_quantity < item.low_stock_threshold && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                      <p className="text-xs text-orange-800">
                        Stok di bawah {item.low_stock_threshold} {item.unit}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => openModal(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredInventory.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Tidak ada item</h3>
            <p className="text-slate-500">
              {searchTerm || categoryFilter !== 'all'
                ? 'Tidak ada item yang sesuai dengan filter'
                : 'Mulai tambahkan bahan baku ke inventori'}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingItem ? 'Edit Item' : 'Tambah Item Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Item
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as InventoryItem['category'],
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="base">Base</option>
                  <option value="sauce">Saus</option>
                  <option value="cheese">Keju</option>
                  <option value="meat">Daging</option>
                  <option value="vegetable">Sayuran</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Batas Stok Rendah
                </label>
                <input
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) =>
                    setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  min="0"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-slate-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-slate-700">
                  Tersedia untuk pelanggan
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {editingItem ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInventoryPage;
