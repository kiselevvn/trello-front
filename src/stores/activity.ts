import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [] as any[],
    isLoading: false,
    error: null,
    lastFetched: null as Date | null,
  }),

  getters: {
    recentActivities: (state) => state.activities.slice(0, 20),
    groupedActivities: (state) => {
      const groups = {} as Record<string, any[]>;
      state.activities.forEach((activity) => {
        const date = new Date(activity.created_at).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(activity);
      });
      return groups;
    },
    boardActivities: (state) => (boardId: number) => {
      return state.activities.filter((activity) => activity.board?.id === boardId);
    },
  },

  actions: {
    async fetchActivities(params = {}) {
      try {
        this.isLoading = true;
        const response = await api.get('/activities/', { params });
        this.activities = response.data;
        this.lastFetched = new Date();
        return this.activities;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    fetchRecentActivities() {
      return this.fetchActivities({ limit: 50 });
    },

    async fetchBoardActivities(boardId: number) {
      try {
        this.isLoading = true;
        const response = await api.get(`/boards/${boardId}/activities/`);
        this.activities = response.data;
        return this.activities;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createActivity(activityData: number) {
      try {
        // Note: Обычно активности создаются сервером автоматически
        const response = await api.post('/activities/', activityData);
        this.activities.unshift(response.data);
        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      }
    },

    clearActivities() {
      this.activities = [];
      this.lastFetched = null;
    },

    // Реальное время обновлений через WebSocket
    subscribeToBoard(boardId: number) {
      // Здесь можно реализовать WebSocket соединение
      // для получения обновлений в реальном времени
      console.log(`Subscribed to board ${boardId} activities`);
    },

    unsubscribeFromBoard(boardId: number) {
      console.log(`Unsubscribed from board ${boardId} activities`);
    },
  },
});
