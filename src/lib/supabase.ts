import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          name: string;
          category: 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'base';
          stock_quantity: number;
          unit: string;
          is_available: boolean;
          low_stock_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'base';
          stock_quantity?: number;
          unit?: string;
          is_available?: boolean;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'meat' | 'vegetable' | 'cheese' | 'sauce' | 'base';
          stock_quantity?: number;
          unit?: string;
          is_available?: boolean;
          low_stock_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          user_name: string;
          total_price: number;
          status: 'pending' | 'processing' | 'completed' | 'shipped';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email: string;
          user_name: string;
          total_price: number;
          status?: 'pending' | 'processing' | 'completed' | 'shipped';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          user_name?: string;
          total_price?: number;
          status?: 'pending' | 'processing' | 'completed' | 'shipped';
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          pizza_name: string;
          size: string;
          crust: string;
          sauce: string;
          toppings: unknown;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          pizza_name: string;
          size: string;
          crust: string;
          sauce: string;
          toppings?: unknown;
          quantity?: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          pizza_name?: string;
          size?: string;
          crust?: string;
          sauce?: string;
          toppings?: unknown;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
    };
  };
}
