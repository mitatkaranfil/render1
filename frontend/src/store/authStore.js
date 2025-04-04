import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      
      // Set authentication state
      setAuth: (isAuthenticated) => set({ isAuthenticated }),
      
      // Set authentication token
      setToken: (token) => set({ token }),
      
      // Set user data
      setUser: (user) => set({ user }),
      
      // Update user data partially
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      // Logout
      logout: () => {
        localStorage.removeItem('token');
        set({
          isAuthenticated: false,
          token: null,
          user: null
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
); 