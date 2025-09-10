/**
 * App Store using Zustand
 * Manages global application state (theme, notifications, etc.)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import type { NotificationState } from '@/types';
import { generateId } from '@/lib/utils';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationState[];
  sidebarOpen: boolean;
}

interface AppActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      notifications: [],
      sidebarOpen: false,

      /**
       * Set application theme
       */
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        const root = document.documentElement;

        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      /**
       * Add a new notification
       */
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: NotificationState = {
          ...notification,
          id,
          duration: notification.duration || 5000,
        };

        // Show toast immediately based on type
        switch (notification.type) {
          case 'success':
            toast.success(notification.title, {
              description: notification.message,
              duration: newNotification.duration,
            });
            break;
          case 'error':
            toast.error(notification.title, {
              description: notification.message,
              duration: newNotification.duration,
            });
            break;
          case 'warning':
            toast.warning(notification.title, {
              description: notification.message,
              duration: newNotification.duration,
            });
            break;
          case 'info':
            toast.info(notification.title, {
              description: notification.message,
              duration: newNotification.duration,
            });
            break;
          default:
            toast(notification.title, {
              description: notification.message,
              duration: newNotification.duration,
            });
        }

        // Still store in state for potential future use (analytics, history, etc.)
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto remove notification from state after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      },

      /**
       * Remove a notification by ID
       */
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      /**
       * Clear all notifications
       */
      clearAllNotifications: () => {
        set({ notifications: [] });
      },

      /**
       * Set sidebar open state
       */
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      /**
       * Toggle sidebar open/close
       */
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },
    }),
    {
      name: 'uniblox-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist theme and sidebar state
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Initialize theme on app load
const initializeTheme = () => {
  const { theme, setTheme } = useAppStore.getState();
  setTheme(theme);

  // Listen for system theme changes
  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (useAppStore.getState().theme === 'system') {
        setTheme('system'); // Re-apply system theme
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }
};

// Export initialization functions
export { initializeTheme };
