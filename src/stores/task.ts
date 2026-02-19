import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useTaskStore = defineStore('task', {
  state: () => ({
    currentTask: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchTask(id) {
      try {
        this.isLoading = true;
        const response = await api.get(`/tasks/${id}/`);
        this.currentTask = response.data;
        return this.currentTask;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createTask(taskData) {
      try {
        this.isLoading = true;
        const response = await api.post('/tasks/', taskData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateTask(id, taskData) {
      try {
        this.isLoading = true;
        const response = await api.patch(`/tasks/${id}/`, taskData);

        if (this.currentTask?.id === id) {
          this.currentTask = response.data;
        }

        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteTask(id) {
      try {
        this.isLoading = true;
        await api.delete(`/tasks/${id}/`);

        if (this.currentTask?.id === id) {
          this.currentTask = null;
        }
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async moveTask(id, data) {
      try {
        await api.patch(`/tasks/${id}/move/`, data);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async archiveTask(id) {
      try {
        await api.post(`/tasks/${id}/archive/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async restoreTask(id) {
      try {
        await api.post(`/tasks/${id}/restore/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // Комментарии
    async fetchComments(taskId) {
      try {
        const response = await api.get(`/tasks/${taskId}/comments/`);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async createComment(taskId, commentData) {
      try {
        const response = await api.post('/comments/', { ...commentData, task: taskId });
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async updateComment(id, commentData) {
      try {
        const response = await api.patch(`/comments/${id}/`, commentData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async deleteComment(id) {
      try {
        await api.delete(`/comments/${id}/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // Вложения
    async fetchAttachments(taskId) {
      try {
        const response = await api.get(`/tasks/${taskId}/attachments/`);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async uploadAttachment(taskId, file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('task', taskId);

        const response = await api.post('/attachments/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async deleteAttachment(id) {
      try {
        await api.delete(`/attachments/${id}/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },
  },
});
