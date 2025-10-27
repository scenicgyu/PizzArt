import React, { useState, useEffect } from 'react';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { Pizza, Topping } from '../../types';
import { baseSauces, crustTypes, pizzaSizes } from '../../data/toppings';
import PizzaPreview from './PizzaPreview';
import { supabase } from '../../lib/supabase';

interface PizzaBuilderProps {
  onPizzaComplete: (pizza: Pizza) => void;
}

const PizzaBuilder: React.FC<PizzaBuilderProps> = ({ onPizzaComplete }) => {
  const [pizzaName, setPizzaName] = useState('');
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [selectedCrust, setSelectedCrust] = useState<'thin' | 'thick' | 'stuffed'>('thin');
  const [selectedSauce, setSelectedSauce] = useState('tomato');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([]);
  const [availableCrusts, setAvailableCrusts] = useState<typeof crustTypes>([]);
  const [availableSauces, setAvailableSauces] = useState<typeof baseSauces>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;

      const inventoryMap = new Map(inventory?.map(item => [item.name.toLowerCase(), item]) || []);

      const toppingCategories: Record<string, string> = {
        'pepperoni': 'meat',
        'italian sausage': 'meat',
        'bacon': 'meat',
        'chicken': 'meat',
        'ham': 'meat',
        'mushrooms': 'vegetable',
        'bell peppers': 'vegetable',
        'onions': 'vegetable',
        'tomatoes': 'vegetable',
        'olives': 'vegetable',
        'spinach': 'vegetable',
        'mozzarella cheese': 'cheese',
        'parmesan cheese': 'cheese',
        'cheddar cheese': 'cheese',
      };

      const toppingImages: Record<string, string> = {
        'pepperoni': '🍕',
        'italian sausage': '🌭',
        'bacon': '🥓',
        'chicken': '🍗',
        'ham': '🍖',
        'mushrooms': '🍄',
        'bell peppers': '🫑',
        'onions': '🧅',
        'tomatoes': '🍅',
        'olives': '🫒',
        'spinach': '🥬',
        'mozzarella cheese': '🧀',
        'parmesan cheese': '🧀',
        'cheddar cheese': '🧀',
      };

      const toppingPrices: Record<string, number> = {
        'pepperoni': 15000,
        'italian sausage': 18000,
        'bacon': 20000,
        'chicken': 22000,
        'ham': 17000,
        'mushrooms': 12000,
        'bell peppers': 10000,
        'onions': 8000,
        'tomatoes': 12000,
        'olives': 15000,
        'spinach': 10000,
        'mozzarella cheese': 18000,
        'parmesan cheese': 20000,
        'cheddar cheese': 16000,
      };

      const toppingsFromInventory: Topping[] = [];
      Object.entries(toppingCategories).forEach(([name, category]) => {
        if (inventoryMap.has(name)) {
          toppingsFromInventory.push({
            id: name.replace(/\s+/g, '-'),
            name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            category: category as any,
            price: toppingPrices[name] || 10000,
            image: toppingImages[name] || '🍕',
          });
        }
      });

      setAvailableToppings(toppingsFromInventory);

      const crustsFromInventory = crustTypes.filter(crust => {
        const crustName = `${crust.name.split(' ')[0]} Crust`.toLowerCase();
        return inventoryMap.has(crustName);
      });
      setAvailableCrusts(crustsFromInventory);

      const saucesFromInventory = baseSauces.filter(sauce => {
        const sauceName = sauce.name.includes('Tomato') ? 'tomato sauce' :
                          sauce.name.includes('White') ? 'white sauce' :
                          sauce.name.includes('BBQ') ? 'bbq sauce' : sauce.name.toLowerCase();
        return inventoryMap.has(sauceName);
      });
      setAvailableSauces(saucesFromInventory);

      if (saucesFromInventory.length > 0) {
        setSelectedSauce(saucesFromInventory[0].id);
      }
      if (crustsFromInventory.length > 0) {
        setSelectedCrust(crustsFromInventory[0].id as any);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const calculatePrice = () => {
    const sizePrice = pizzaSizes.find(s => s.id === selectedSize)?.basePrice || 0;
    const crustPrice = availableCrusts.find(c => c.id === selectedCrust)?.price || 0;
    const saucePrice = availableSauces.find(s => s.id === selectedSauce)?.price || 0;
    const toppingsPrice = selectedToppings.reduce((total, topping) => total + topping.price, 0);

    return sizePrice + crustPrice + saucePrice + toppingsPrice;
  };

  const handleComplete = () => {
    if (!pizzaName.trim()) {
      alert('Berikan nama untuk pizza kreasi kamu!');
      return;
    }

    const pizza: Pizza = {
      id: Date.now().toString(),
      name: pizzaName,
      size: selectedSize,
      crust: selectedCrust,
      sauce: selectedSauce,
      toppings: selectedToppings,
      price: calculatePrice(),
      likes: 0,
    };

    onPizzaComplete(pizza);
  };

  const toppingsByCategory = {
    meat: availableToppings.filter(t => t.category === 'meat'),
    vegetable: availableToppings.filter(t => t.category === 'vegetable'),
    cheese: availableToppings.filter(t => t.category === 'cheese'),
    sauce: availableToppings.filter(t => t.category === 'sauce'),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat bahan yang tersedia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
            🍕 Buat Pizza Impianmu!
          </h1>
          <p className="text-gray-600 text-lg">Kreativitas tanpa batas, rasa tak terbatas!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Preview Pizza</h2>
            <PizzaPreview
              size={selectedSize}
              crust={selectedCrust}
              sauce={selectedSauce}
              toppings={selectedToppings}
            />

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pizza Kamu ✨
              </label>
              <input
                type="text"
                value={pizzaName}
                onChange={(e) => setPizzaName(e.target.value)}
                placeholder="Contoh: Dragon Fire Special"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
              />
            </div>

            <div className="mt-6 text-center">
              <div className="bg-gradient-to-r from-yellow-400 to-red-500 text-white p-4 rounded-2xl mb-4">
                <p className="text-sm opacity-90">Total Harga</p>
                <p className="text-3xl font-bold">Rp {calculatePrice().toLocaleString()}</p>
              </div>

              <button
                onClick={handleComplete}
                disabled={!pizzaName.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Sparkles size={24} />
                <span>Tambahkan ke Keranjang</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🍕 Pilih Ukuran</h3>
              <div className="grid grid-cols-3 gap-3">
                {pizzaSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id as any)}
                    className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                      selectedSize === size.id
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-lg font-semibold">{size.name}</div>
                    <div className="text-sm text-gray-600">Rp {size.basePrice.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🥖 Jenis Adonan</h3>
              {availableCrusts.length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada adonan tersedia saat ini</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {availableCrusts.map((crust) => (
                  <button
                    key={crust.id}
                    onClick={() => setSelectedCrust(crust.id as any)}
                    className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                      selectedCrust === crust.id
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="font-semibold">{crust.name}</div>
                    <div className="text-sm text-gray-600">
                      {crust.price > 0 ? `+Rp ${crust.price.toLocaleString()}` : 'Gratis'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🥫 Pilih Saus</h3>
              {availableSauces.length === 0 && (
                <p className="text-gray-500 text-center py-4">Tidak ada saus tersedia saat ini</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {availableSauces.map((sauce) => (
                  <button
                    key={sauce.id}
                    onClick={() => setSelectedSauce(sauce.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedSauce === sauce.id
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="font-medium">{sauce.name}</div>
                    <div className="text-sm text-gray-600">
                      {sauce.price > 0 ? `+Rp ${sauce.price.toLocaleString()}` : 'Gratis'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {Object.entries(toppingsByCategory).map(([category, toppings]) => {
              if (toppings.length === 0) return null;
              return (
              <div key={category} className="bg-white rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {category === 'meat' && '🥩 Daging'}
                  {category === 'vegetable' && '🥬 Sayuran'}
                  {category === 'cheese' && '🧀 Keju'}
                  {category === 'sauce' && '🌶️ Saus Spesial'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toppings.map((topping) => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                          isSelected
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{topping.image}</div>
                        <div className="font-medium text-sm">{topping.name}</div>
                        <div className="text-xs text-gray-600">
                          +Rp {topping.price.toLocaleString()}
                        </div>
                        {isSelected && (
                          <div className="text-green-600 mt-1">
                            <Plus size={16} className="mx-auto" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaBuilder;
