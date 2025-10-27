export interface User {
  id: string;
  email: string;
  username: string;
  points: number;
  achievements: Achievement[];
  createdAt: Date;
}

export interface Pizza {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  crust: 'thin' | 'thick' | 'stuffed';
  sauce: string;
  toppings: Topping[];
  price: number;
  createdBy?: string;
  likes: number;
  isTemplate?: boolean;
}

export interface Topping {
  id: string;
  name: string;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
  price: number;
  image: string;
}

export interface CartItem {
  id: string;
  pizza: Pizza;
  quantity: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  theme: string;
  prize: string;
  endDate: Date;
  submissions: Pizza[];
}