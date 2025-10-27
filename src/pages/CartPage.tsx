import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const CartPage = () => {
  const { state, dispatch } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: itemId, quantity: newQuantity } });
    }
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemId });
  };

  const totalPrice = state.cart.reduce((total, item) => total + (item.pizza.price * item.quantity), 0);
  const totalItems = state.cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckout = async () => {
    if (state.cart.length === 0) return;

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Silakan login terlebih dahulu untuk melakukan checkout');
        setIsProcessing(false);
        return;
      }

      const finalTotal = Math.floor(totalPrice * 1.1);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            user_email: user.email || state.user?.email || 'guest@pizza.com',
            user_name: state.user?.username || 'Guest',
            total_price: finalTotal,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = state.cart.map((item) => ({
        order_id: order.id,
        pizza_name: item.pizza.name,
        size: item.pizza.size,
        crust: item.pizza.crust,
        sauce: item.pizza.sauce,
        toppings: item.pizza.toppings,
        quantity: item.quantity,
        price: item.pizza.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      dispatch({ type: 'ADD_POINTS', payload: Math.floor(totalPrice / 1000) });
      alert(`🎉 Pesanan berhasil dibuat!\nID Pesanan: ${order.id.slice(0, 8)}\nTotal: Rp ${finalTotal.toLocaleString()}\n+${Math.floor(totalPrice / 1000)} poin telah ditambahkan ke akun kamu!`);
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            to="/order"
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold mr-4"
          >
            <ArrowLeft size={20} />
            <span>Lanjut Belanja</span>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
            🛒 Keranjang Belanja
          </h1>
        </div>

        {state.cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-8">Belum ada pizza yang dipilih. Yuk buat pizza pertamamu!</p>
            <Link
              to="/order"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <ShoppingBag size={24} />
              <span>Buat Pizza Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {state.cart.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl p-6 shadow-lg">
                  <div className="flex items-start space-x-6">
                    {/* Pizza Visual */}
                    <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                      🍕
                    </div>

                    {/* Pizza Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{item.pizza.name}</h3>
                      <div className="text-gray-600 text-sm mb-2">
                        <p>{item.pizza.size.charAt(0).toUpperCase() + item.pizza.size.slice(1)} • {item.pizza.crust} crust</p>
                        <p>Sauce: {item.pizza.sauce} • {item.pizza.toppings.length} toppings</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        Rp {item.pizza.price.toLocaleString()}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal ({item.quantity} item):</span>
                      <span className="font-bold text-xl text-gray-800">
                        Rp {(item.pizza.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 shadow-lg sticky top-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({totalItems})</span>
                    <span className="font-semibold">Rp {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-semibold">Rp {Math.floor(totalPrice * 0.1).toLocaleString()}</span>
                  </div>
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-2xl text-green-600">
                      Rp {Math.floor(totalPrice * 1.1).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Points Reward Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center text-yellow-800">
                    <span className="text-2xl mr-2">🏆</span>
                    <div>
                      <p className="font-semibold">Dapatkan Poin!</p>
                      <p className="text-sm">+{Math.floor(totalPrice / 1000)} poin setelah checkout</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={24} />
                  <span>{isProcessing ? 'Memproses...' : 'Checkout Sekarang'}</span>
                </button>

                <div className="mt-4 text-center text-gray-600 text-sm">
                  <p>🔒 Pembayaran aman & terpercaya</p>
                  <p>📞 Customer service 24/7</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;