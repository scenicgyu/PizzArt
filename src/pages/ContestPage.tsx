import React, { useState } from 'react';
import { Trophy, Clock, Users, Gift, Calendar, Star, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ContestPage = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'upcoming'>('active');

  const currentContest = state.contests[0];
  const timeRemaining = Math.ceil((new Date(currentContest?.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
            🏆 Pizza Contests
          </h1>
          <p className="text-gray-600 text-lg">Tunjukkan kreativitasmu dan menangkan hadiah menarik!</p>
        </div>

        {/* Active Contest Highlight */}
        {currentContest && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-white mb-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Trophy className="mr-2" size={32} />
                  <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    KONTES AKTIF
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold mb-4">{currentContest.title}</h2>
                <p className="text-lg mb-6 opacity-90">{currentContest.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                    <Clock size={24} className="mx-auto mb-2" />
                    <div className="text-2xl font-bold">{timeRemaining}</div>
                    <div className="text-sm opacity-80">hari tersisa</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                    <Users size={24} className="mx-auto mb-2" />
                    <div className="text-2xl font-bold">47</div>
                    <div className="text-sm opacity-80">peserta</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105">
                    Ikuti Kontes
                  </button>
                  <button className="border-2 border-white text-white px-6 py-3 rounded-2xl font-bold hover:bg-white hover:text-orange-600 transition-all">
                    Lihat Aturan
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 mb-4">
                  <Gift className="mx-auto mb-4" size={64} />
                  <div className="text-2xl font-bold mb-2">Hadiah Utama</div>
                  <div className="text-3xl font-bold">{currentContest.prize}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white bg-opacity-10 rounded-xl p-2">
                    <div className="font-bold">Juara 2</div>
                    <div>Rp 200,000</div>
                  </div>
                  <div className="bg-white bg-opacity-10 rounded-xl p-2">
                    <div className="font-bold">Juara 3</div>
                    <div>Rp 100,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contest Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            {[
              { id: 'active', label: 'Kontes Aktif', count: 1 },
              { id: 'upcoming', label: 'Akan Datang', count: 3 },
              { id: 'past', label: 'Selesai', count: 8 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes yang Sedang Berlangsung</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-orange-800">
                    Saat ini ada 1 kontes aktif. Jangan lewatkan kesempatan untuk menang!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes Mendatang</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Pizza Autumn Special', date: '15 Mar 2025', theme: 'Autumn' },
                    { title: 'Healthy Pizza Challenge', date: '01 Apr 2025', theme: 'Health' },
                    { title: 'International Pizza Day', date: '09 Feb 2025', theme: 'International' },
                  ].map((contest, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{contest.title}</h4>
                        <p className="text-gray-600 text-sm">Theme: {contest.theme}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar size={16} className="mr-1" />
                          {contest.date}
                        </div>
                        <button className="text-orange-600 text-sm font-semibold hover:text-orange-700">
                          Set Reminder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'past' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes Selesai</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Valentine Special Pizza', winner: '@LoveChef', prize: 'Rp 500,000' },
                    { title: 'New Year Pizza Blast', winner: '@YearEndChef', prize: 'Rp 300,000' },
                    { title: 'Christmas Pizza Magic', winner: '@XmasChef', prize: 'Rp 400,000' },
                  ].map((contest, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{contest.title}</h4>
                        <div className="text-green-600 font-semibold">{contest.prize}</div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Award size={16} className="mr-1" />
                        <span>Pemenang: {contest.winner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contest Guidelines */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="mr-2 text-yellow-500" />
            Cara Ikut Kontes
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Buat Pizza</h4>
              <p className="text-gray-600 text-sm">Gunakan pizza builder untuk membuat kreasi sesuai tema</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Submit Kreasi</h4>
              <p className="text-gray-600 text-sm">Berikan nama kreatif dan deskripsi pizza kamu</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Menangkan Hadiah</h4>
              <p className="text-gray-600 text-sm">Pizza dengan likes terbanyak akan menjadi pemenang</p>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-3xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">🏅 Achievement Kontes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'First Timer', desc: 'Ikut kontes pertama', points: 50 },
              { name: 'Top 10', desc: 'Masuk 10 besar', points: 100 },
              { name: 'Podium Finisher', desc: 'Masuk 3 besar', points: 200 },
              { name: 'Contest Winner', desc: 'Juara kontes', points: 500 },
            ].map((achievement, index) => (
              <div key={index} className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-bold mb-1">{achievement.name}</h4>
                <p className="text-sm opacity-80 mb-2">{achievement.desc}</p>
                <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  +{achievement.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestPage;