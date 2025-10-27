import React, { useState } from 'react';
import { Heart, MessageCircle, Share, ListFilter as Filter, Search, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CommunityPage = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('popular');

  const handleLike = (pizzaId: string) => {
    dispatch({ type: 'LIKE_PIZZA', payload: pizzaId });
    dispatch({ type: 'ADD_POINTS', payload: 5 }); // Reward for interaction
  };

  const sortedPizzas = [...state.communityPizzas].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'trending':
        return b.likes - a.likes; // Simplified trending logic
      case 'latest':
      default:
        return new Date(b.id).getTime() - new Date(a.id).getTime();
    }
  });

  const filteredPizzas = sortedPizzas.filter(pizza =>
    pizza.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
            🌟 Komunitas Pizzart
          </h1>
          <p className="text-gray-600 text-lg">Jelajahi kreasi pizza amazing dari chef-chef kreatif!</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pizza favorit..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Sort Options */}
            <div className="flex space-x-2">
              {[
                { value: 'popular', label: 'Populer', icon: Heart },
                { value: 'trending', label: 'Trending', icon: TrendingUp },
                { value: 'latest', label: 'Terbaru', icon: Filter },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    sortBy === value
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-600">
              {state.communityPizzas.length}
            </div>
            <div className="text-gray-600 text-sm">Total Pizza</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-700">
              {state.communityPizzas.reduce((sum, pizza) => sum + pizza.likes, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Likes</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-yellow-600">567</div>
            <div className="text-gray-600 text-sm">Active Chefs</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-800">1,234</div>
            <div className="text-gray-600 text-sm">Creations This Month</div>
          </div>
        </div>

        {/* Pizza Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPizzas.map((pizza, index) => (
            <div key={pizza.id} className="bg-white rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all">
              {/* Rank Badge */}
              {index < 3 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  #{index + 1}
                </div>
              )}

              {/* Pizza Visual */}
              <div className="relative mb-4">
                <div className="w-full h-48 bg-gradient-to-r from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center text-6xl relative overflow-hidden">
                  🍕
                  {/* Animated sparkles */}
                  <div className="absolute inset-0">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
                        style={{
                          top: `${20 + i * 30}%`,
                          left: `${20 + i * 25}%`,
                          animationDelay: `${i * 0.5}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Creator badge */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                  by @{pizza.createdBy || 'Chef'}
                </div>
              </div>

              {/* Pizza Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{pizza.name}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{pizza.size.charAt(0).toUpperCase() + pizza.size.slice(1)} • {pizza.crust}</span>
                  <span>{pizza.toppings.length} toppings</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  Rp {pizza.price.toLocaleString()}
                </div>
              </div>

              {/* Interaction Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(pizza.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Heart size={20} fill="currentColor" />
                    <span className="font-semibold">{pizza.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors">
                    <MessageCircle size={20} />
                    <span>12</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-700 transition-colors">
                    <Share size={20} />
                  </button>
                </div>

                <button className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 text-sm">
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPizzas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada pizza yang ditemukan</h3>
            <p className="text-gray-500">Coba ubah kata kunci pencarian atau filter</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 text-center text-white mt-12">
          <h2 className="text-3xl font-bold mb-4">Punya Kreasi Pizza Unik? 🎨</h2>
          <p className="text-lg mb-6 opacity-90">
            Bagikan kreasi pizza terbaikmu dan dapatkan likes dari komunitas!
          </p>
          <button className="bg-white text-red-600 px-8 py-3 rounded-2xl font-bold hover:bg-yellow-100 transition-all transform hover:scale-105">
            Buat Pizza Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;