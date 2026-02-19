import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    users: [],
    isLoading: false,
    error: null,
    token: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userInitials: (state) => {
      if (!state.currentUser) return '';
      const name = state.currentUser.first_name || state.currentUser.username;
      return name.charAt(0).toUpperCase();
    },
  },

  actions: {
    async login(credentials) {
      try {
        this.isLoading = true;
        const response = await api.post('/auth/login/', credentials);

        const { access, refresh } = response.data;
        this.token = access;
        this.refreshToken = refresh;

        // Сохраняем токены
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // Загружаем данные пользователя
        await this.fetchCurrentUser();

        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async register(userData) {
      try {
        this.isLoading = true;
        const response = await api.post('auth/register/', userData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCurrentUser() {
      try {
        this.isLoading = true;
        const response = await api.get('/users/me/');
        this.currentUser = response.data;
        return this.currentUser;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUsers(search = '') {
      try {
        this.isLoading = true;
        const params = search ? { search } : {};
        const response = await api.get('/users/', { params });
        this.users = response.data;
        return this.users;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateProfile(userData) {
      try {
        this.isLoading = true;
        const response = await api.patch('/users/me/', userData);
        this.currentUser = { ...this.currentUser, ...response.data };
        return this.currentUser;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async changePassword(passwordData) {
      try {
        this.isLoading = true;
        await api.post('/change-password/', passwordData);
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        // Опционально: отправляем запрос на сервер для инвалидации токена
        if (this.token) {
          await api.post('/auth/logout/', { refresh: this.refreshToken });
        }
      } catch (error: any) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuth();
      }
    },

    clearAuth() {
      this.currentUser = null;
      this.token = null;
      this.refreshToken = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },

    async refreshAccessToken() {
      try {
        if (!this.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await api.post('/token/refresh/', {
          refresh: this.refreshToken,
        });

        const { access } = response.data;
        this.token = access;
        localStorage.setItem('access_token', access);

        return access;
      } catch (error: any) {
        console.error(error);
        this.clearAuth();
        throw error;
      }
    },
  },
});
