import { Topping } from '../types';

export const availableToppings: Topping[] = [
  // Meat
  { id: 'pepperoni', name: 'Pepperoni', category: 'meat', price: 15000, image: '🍕' },
  { id: 'sausage', name: 'Italian Sausage', category: 'meat', price: 18000, image: '🌭' },
  { id: 'bacon', name: 'Crispy Bacon', category: 'meat', price: 20000, image: '🥓' },
  { id: 'chicken', name: 'Grilled Chicken', category: 'meat', price: 22000, image: '🍗' },
  { id: 'ham', name: 'Smoked Ham', category: 'meat', price: 17000, image: '🍖' },
  
  // Vegetables
  { id: 'mushrooms', name: 'Fresh Mushrooms', category: 'vegetable', price: 12000, image: '🍄' },
  { id: 'bell-peppers', name: 'Bell Peppers', category: 'vegetable', price: 10000, image: '🫑' },
  { id: 'onions', name: 'Red Onions', category: 'vegetable', price: 8000, image: '🧅' },
  { id: 'tomatoes', name: 'Cherry Tomatoes', category: 'vegetable', price: 12000, image: '🍅' },
  { id: 'olives', name: 'Black Olives', category: 'vegetable', price: 15000, image: '🫒' },
  { id: 'spinach', name: 'Fresh Spinach', category: 'vegetable', price: 10000, image: '🥬' },
  { id: 'jalapenos', name: 'Jalapeños', category: 'vegetable', price: 13000, image: '🌶️' },
  
  // Cheese
  { id: 'mozzarella', name: 'Extra Mozzarella', category: 'cheese', price: 18000, image: '🧀' },
  { id: 'parmesan', name: 'Parmesan', category: 'cheese', price: 20000, image: '🧀' },
  { id: 'cheddar', name: 'Sharp Cheddar', category: 'cheese', price: 16000, image: '🧀' },
  { id: 'goat-cheese', name: 'Goat Cheese', category: 'cheese', price: 25000, image: '🧀' },
  
  // Unique Sauces
  { id: 'truffle-oil', name: 'Truffle Oil', category: 'sauce', price: 30000, image: '🫒' },
  { id: 'ranch', name: 'Ranch Drizzle', category: 'sauce', price: 8000, image: '🥗' },
  { id: 'hot-sauce', name: 'Sriracha Swirl', category: 'sauce', price: 10000, image: '🌶️' },
  { id: 'pesto-drizzle', name: 'Pesto Drizzle', category: 'sauce', price: 15000, image: '🌿' },
];

export const baseSauces = [
  { id: 'tomato', name: 'Classic Tomato', price: 0 },
  { id: 'white', name: 'Garlic White Sauce', price: 5000 },
  { id: 'bbq', name: 'BBQ Sauce', price: 8000 },
  { id: 'pesto', name: 'Basil Pesto', price: 12000 },
  { id: 'spicy', name: 'Spicy Arrabbiata', price: 10000 },
];

export const crustTypes = [
  { id: 'thin', name: 'Thin Crust', price: 0 },
  { id: 'thick', name: 'Thick Crust', price: 8000 },
  { id: 'stuffed', name: 'Cheese Stuffed', price: 15000 },
];

export const pizzaSizes = [
  { id: 'small', name: 'Small (8")', basePrice: 45000 },
  { id: 'medium', name: 'Medium (12")', basePrice: 65000 },
  { id: 'large', name: 'Large (16")', basePrice: 85000 },
];