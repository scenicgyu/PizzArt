import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Users, Trophy, Sparkles, Star, ArrowRight, Zap, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

const HomePage = () => {
  const { state } = useApp();

  const featuredPizzas = state.communityPizzas.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent mb-6">
              Selamat Datang di Pizzart! 🍕
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Platform pizza interaktif yang menggabungkan <span className="font-semibold text-red-600">kreativitas</span>, 
              <span className="font-semibold text-red-700"> gamifikasi</span>, dan 
              <span className="font-semibold text-red-800"> teknologi</span> untuk pengalaman pemesanan pizza yang tak terlupakan!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/order"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Sparkles size={24} />
              <span>Buat Pizza Sekarang!</span>
            </Link>
            
            <Link
              to="/community"
              className="bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 border-2 border-red-300"
            >
              <Users size={24} />
              <span>Jelajahi Komunitas</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">🍕</div>
              <div className="text-3xl font-bold text-red-600">1,234</div>
              <div className="text-gray-600">Pizza Dibuat</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">👨‍🍳</div>
              <div className="text-3xl font-bold text-red-700">567</div>
              <div className="text-gray-600">Chef Kreatif</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-yellow-600">4.9</div>
              <div className="text-gray-600">Rating Rata-rata</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Kenapa Memilih Pizzart? ✨
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pizza size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Kustomisasi Tanpa Batas</h3>
              <p className="text-gray-300">Buat pizza unik dengan puluhan topping dan kombinasi rasa</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Gamifikasi Seru</h3>
              <p className="text-gray-300">Kumpulkan poin, unlock achievement, dan ikuti kontes mingguan</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-yellow-500 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Komunitas Kreatif</h3>
              <p className="text-gray-300">Bagikan kreasi dan dapatkan inspirasi dari chef lain</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-red-600 to-red-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Kualitas Premium</h3>
              <p className="text-gray-300">Bahan segar berkualitas tinggi dengan cita rasa autentik</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-4">
              🔥 Pizza Trending
            </h2>
            <p className="text-gray-600 text-lg">Kreasi terpopuler dari komunitas Pizzart</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPizzas.map((pizza, index) => (
              <div key={pizza.id} className="bg-white rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-r from-yellow-300 to-red-500 rounded-2xl mb-4 flex items-center justify-center text-6xl">
                    🍕
                  </div>
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">{pizza.name}</h3>
                <p className="text-gray-600 mb-4">
                  {pizza.size.charAt(0).toUpperCase() + pizza.size.slice(1)} • {pizza.crust} crust • {pizza.toppings.length} toppings
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-red-600">
                    <Heart size={16} fill="currentColor" />
                    <span className="ml-1 font-semibold">{pizza.likes}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    Rp {pizza.price.toLocaleString()}
                  </div>
                </div>
                
                <button className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all">
                  Pesan Sekarang
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/community"
              className="inline-flex items-center space-x-2 bg-white text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg border-2 border-red-300"
            >
              <span>Lihat Semua Kreasi</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Current Contest */}
      {state.contests.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-red-500">
          <div className="container mx-auto text-center">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <Trophy className="text-yellow-500 mr-2" size={48} />
                <h2 className="text-3xl font-bold text-gray-800">Kontes Aktif</h2>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-red-600 mb-2">{state.contests[0].title}</h3>
                <p className="text-gray-700 text-lg mb-4">{state.contests[0].description}</p>
                <div className="text-3xl font-bold text-green-600">🏆 {state.contests[0].prize}</div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link
                  to="/contests"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
                >
                  Ikuti Kontes
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-yellow-100 to-red-100">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-6">
            Siap Memulai Petualangan Pizza? 🚀
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pizza lover yang sudah merasakan pengalaman unik Pizzart!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!state.isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  Daftar Gratis Sekarang
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg border-2 border-red-300"
                >
                  Sudah Punya Akun?
                </Link>
              </>
            ) : (
              <Link
                to="/order"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Sparkles size={24} />
                <span>Mulai Berkreasi!</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;