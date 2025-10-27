import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AdminUser {
  id: string;
  email: string;
  username: string;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  authUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (adminData) {
      setAdminUser(adminData);
      setAuthUser(user);
      return true;
    }

    return false;
  };

  useEffect(() => {
    checkAdminStatus().finally(() => setIsLoading(false));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const isAdmin = await checkAdminStatus();
          if (!isAdmin) {
            await supabase.auth.signOut();
            setAdminUser(null);
            setAuthUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setAdminUser(null);
          setAuthUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (adminError || !adminData) {
          await supabase.auth.signOut();
          return { success: false, error: 'Akun ini bukan admin' };
        }

        setAdminUser(adminData);
        setAuthUser(data.user);
        return { success: true };
      }

      return { success: false, error: 'Login gagal' };
    } catch (err) {
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setAuthUser(null);
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        authUser,
        isLoading,
        login,
        logout,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
