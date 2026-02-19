import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';

export const useBoardStore = defineStore('board', {
  state: () => ({
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    ownedBoards: (state) => state.boards.filter((board) => board.is_owner),
    memberBoards: (state) => state.boards.filter((board) => !board.is_owner),
    archivedBoards: (state) => state.boards.filter((board) => board.is_archived),
    activeBoards: (state) => state.boards.filter((board) => !board.is_archived),
  },

  actions: {
    async fetchBoards() {
      try {
        this.isLoading = true;
        const response = await api.get('/boards/');
        this.boards = response.data;
        return this.boards;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBoard(id) {
      try {
        this.isLoading = true;
        const response = await api.get(`/boards/${id}/`);
        this.currentBoard = response.data;
        return this.currentBoard;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createBoard(boardData) {
      try {
        this.isLoading = true;
        const response = await api.post('/boards/', boardData);
        this.boards.push(response.data);
        return response.data;
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateBoard(id, boardData) {
      try {
        this.isLoading = true;
        const response = await api.patch(`/boards/${id}/`, boardData);

        const index = this.boards.findIndex((board) => board.id === id);
        if (index !== -1) {
          this.boards[index] = response.data;
        }

        if (this.currentBoard?.id === id) {
          this.currentBoard = response.data;
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

    async deleteBoard(id) {
      try {
        this.isLoading = true;
        await api.delete(`/boards/${id}/`);
        this.boards = this.boards.filter((board) => board.id !== id);

        if (this.currentBoard?.id === id) {
          this.currentBoard = null;
        }
      } catch (error: any) {
        console.error(error);
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Колонки
    async fetchColumns(boardId) {
      try {
        const response = await api.get(`/boards/${boardId}/columns/`);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async createColumn(columnData) {
      try {
        const response = await api.post('/columns/', columnData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async updateColumn(id, columnData) {
      try {
        const response = await api.patch(`/columns/${id}/`, columnData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async deleteColumn(id) {
      try {
        await api.delete(`/columns/${id}/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async moveColumn(id, data) {
      try {
        await api.patch(`/columns/${id}/move/`, data);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // Участники
    async addMember(boardId, userId) {
      try {
        await api.post(`/boards/${boardId}/members/`, { user_id: userId });
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async removeMember(boardId, userId) {
      try {
        await api.delete(`/boards/${boardId}/members/`, { data: { user_id: userId } });
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // Метки
    async fetchLabels(boardId) {
      try {
        const response = await api.get(`/boards/${boardId}/labels/`);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async createLabel(boardId, labelData) {
      try {
        const response = await api.post('/labels/', { ...labelData, board: boardId });
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async updateLabel(id, labelData) {
      try {
        const response = await api.patch(`/labels/${id}/`, labelData);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    async deleteLabel(id) {
      try {
        await api.delete(`/labels/${id}/`);
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // Статистика
    async getBoardStatistics(boardId) {
      try {
        const response = await api.get(`/boards/${boardId}/statistics/`);
        return response.data;
      } catch (error: any) {
        console.error(error);
        throw error;
      }
    },

    // фцвфцвфцвфцвфцввввввввввввввввввввввввв

    async moveTask(taskId, moveData) {
      try {
        this.isLoading = true;

        // Отправляем запрос на перемещение
        const response = await api.patch(`/tasks/${taskId}/move/`, moveData);

        // Обновляем локальное состояние
        this.updateLocalTaskPosition(taskId, moveData);

        return response.data;
      } catch (error) {
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Обновление позиции задачи локально
    updateLocalTaskPosition(taskId, moveData) {
      const { column_id, position } = moveData;

      // Находим задачу во всех досках
      for (const board of this.boards) {
        if (board.columns) {
          for (const column of board.columns) {
            const taskIndex = column.tasks?.findIndex((task) => task.id === taskId);

            if (taskIndex !== -1 && taskIndex !== undefined) {
              // Нашли задачу
              const task = column.tasks[taskIndex];

              // Если задача перемещается в другую колонку
              if (column.id !== column_id) {
                // Удаляем из старой колонки
                column.tasks.splice(taskIndex, 1);

                // Находим новую колонку
                const newColumn = this.findColumnInBoard(board.id, column_id);
                if (newColumn) {
                  // Добавляем в новую колонку на нужную позицию
                  if (!newColumn.tasks) newColumn.tasks = [];
                  newColumn.tasks.splice(position, 0, task);

                  // Обновляем позиции в новой колонке
                  newColumn.tasks.forEach((t, idx) => {
                    t.position = idx;
                  });
                }
              } else {
                // Задача перемещается внутри той же колонки
                // Удаляем с текущей позиции
                column.tasks.splice(taskIndex, 1);

                // Вставляем на новую позицию
                column.tasks.splice(position, 0, task);

                // Обновляем позиции
                column.tasks.forEach((t, idx) => {
                  t.position = idx;
                });
              }

              // Обновляем позиции в старой колонке
              if (column.tasks) {
                column.tasks.forEach((t, idx) => {
                  t.position = idx;
                });
              }

              return; // Задача найдена и обработана
            }
          }
        }
      }
    },

    // Вспомогательный метод для поиска колонки в доске
    findColumnInBoard(boardId, columnId) {
      const board = this.boards.find((b) => b.id === boardId);
      if (!board || !board.columns) return null;

      return board.columns.find((col) => col.id === columnId);
    },

    // Оптимистичное обновление при перемещении задачи
    async optimisticMoveTask(taskId, fromColumnId, toColumnId, newPosition) {
      try {
        // Сохраняем исходное состояние для отката
        // const originalState = this.getTaskState(taskId, fromColumnId);

        // Применяем изменения локально
        this.applyLocalMove(taskId, fromColumnId, toColumnId, newPosition);

        // Отправляем запрос на сервер
        await this.moveTask(taskId, {
          column_id: toColumnId,
          position: newPosition,
        });
      } catch (error) {
        // В случае ошибки откатываем изменения
        this.rollbackMove(taskId, originalState);
        throw error;
      }
    },

    // Получение текущего состояния задачи
    getTaskState(taskId, columnId) {
      const board = this.boards.find((b) => b.columns?.some((col) => col.id === columnId));

      if (!board) return null;

      const column = board.columns.find((col) => col.id === columnId);
      if (!column || !column.tasks) return null;

      const task = column.tasks.find((t) => t.id === taskId);
      if (!task) return null;

      return {
        boardId: board.id,
        columnId,
        task,
        columnTasks: [...column.tasks],
        taskIndex: column.tasks.findIndex((t) => t.id === taskId),
      };
    },

    // Применение перемещения локально
    applyLocalMove(taskId, fromColumnId, toColumnId, newPosition) {
      // Находим задачу в исходной колонке
      const fromState = this.getTaskState(taskId, fromColumnId);
      if (!fromState) return;

      // Находим целевую колонку
      const toColumn = this.findColumnInBoard(fromState.boardId, toColumnId);
      if (!toColumn) return;

      // Создаем копию задачи
      const task = { ...fromState.task };

      // Удаляем из исходной колонки
      const fromColumn = this.findColumnInBoard(fromState.boardId, fromColumnId);
      if (fromColumn && fromColumn.tasks) {
        fromColumn.tasks = fromColumn.tasks.filter((t) => t.id !== taskId);

        // Обновляем позиции в исходной колонке
        fromColumn.tasks.forEach((t, idx) => {
          t.position = idx;
        });
      }

      // Добавляем в целевую колонку
      if (!toColumn.tasks) toColumn.tasks = [];

      // Вставляем на новую позицию
      toColumn.tasks.splice(newPosition, 0, task);

      // Обновляем позиции в целевой колонке
      toColumn.tasks.forEach((t, idx) => {
        t.position = idx;
      });

      // Обновляем ID колонки у задачи
      task.column = toColumnId;
    },

    // Откат перемещения
    rollbackMove(taskId, originalState) {
      if (!originalState) return;

      // Восстанавливаем исходную колонку
      const fromColumn = this.findColumnInBoard(originalState.boardId, originalState.columnId);
      if (fromColumn) {
        fromColumn.tasks = originalState.columnTasks;

        // Удаляем из целевой колонки
        const board = this.boards.find((b) => b.id === originalState.boardId);
        if (board && board.columns) {
          for (const column of board.columns) {
            if (column.id !== originalState.columnId && column.tasks) {
              column.tasks = column.tasks.filter((t) => t.id !== taskId);

              // Обновляем позиции
              if (column.tasks) {
                column.tasks.forEach((t, idx) => {
                  t.position = idx;
                });
              }
            }
          }
        }
      }
    },

    // Пакетное перемещение нескольких задач
    async batchMoveTasks(moves) {
      try {
        this.isLoading = true;

        // Применяем изменения локально
        const originalStates = [];

        for (const move of moves) {
          const state = this.getTaskState(move.taskId, move.fromColumnId);
          if (state) {
            originalStates.push({
              taskId: move.taskId,
              state,
            });
          }

          this.applyLocalMove(move.taskId, move.fromColumnId, move.toColumnId, move.newPosition);
        }

        // Отправляем запросы на сервер
        const promises = moves.map((move) =>
          this.moveTask(move.taskId, {
            column_id: move.toColumnId,
            position: move.newPosition,
          }),
        );

        await Promise.all(promises);

        return { success: true };
      } catch (error) {
        // Откатываем все изменения в случае ошибки
        for (const item of originalStates) {
          this.rollbackMove(item.taskId, item.state);
        }

        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Получение статистики по перемещениям
    getMoveStatistics(boardId) {
      const board = this.boards.find((b) => b.id === boardId);
      if (!board) return null;

      const stats = {
        totalMoves: 0,
        movesByColumn: {},
        recentMoves: [],
      };

      // TODO: Реализовать сбор статистики по перемещениям
      // Можно сохранять историю перемещений в localStorage

      return stats;
    },

    // Синхронизация позиций задач с сервером
    async syncTaskPositions(boardId) {
      try {
        this.isLoading = true;

        // Получаем актуальные данные с сервера
        const board = await this.fetchBoard(boardId);

        // Обновляем локальные данные
        this.currentBoard = board;

        // Находим доску в списке и обновляем
        const index = this.boards.findIndex((b) => b.id === boardId);
        if (index !== -1) {
          this.boards[index] = { ...this.boards[index], ...board };
        }

        return board;
      } catch (error) {
        this.error = error.response?.data || error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Сброс позиций задач (например, при возникновении конфликтов)
    resetTaskPositions(boardId) {
      const board = this.boards.find((b) => b.id === boardId);
      if (!board || !board.columns) return;

      for (const column of board.columns) {
        if (column.tasks) {
          // Сортируем задачи по позиции
          column.tasks.sort((a, b) => a.position - b.position);

          // Обновляем позиции (на случай если они сбились)
          column.tasks.forEach((task, index) => {
            task.position = index;
          });
        }
      }
    },

    // Проверка возможности перемещения задачи
    canMoveTask(taskId, fromColumnId, toColumnId) {
      // Получаем задачу
      const taskState = this.getTaskState(taskId, fromColumnId);
      if (!taskState) return false;

      // Проверяем, существует ли целевая колонка
      const targetColumn = this.findColumnInBoard(taskState.boardId, toColumnId);
      if (!targetColumn) return false;

      // TODO: Добавить дополнительные проверки
      // Например, ограничения на перемещение в архивные колонки

      return true;
    },

    // Перемещение задачи с проверкой ограничений
    async safeMoveTask(taskId, moveData) {
      const { column_id: targetColumnId, position } = moveData;

      // Получаем текущую колонку задачи
      const taskState = this.getTaskState(taskId, moveData.fromColumnId);
      if (!taskState) {
        throw new Error('Task not found');
      }

      // Проверяем возможность перемещения
      if (!this.canMoveTask(taskId, taskState.columnId, targetColumnId)) {
        throw new Error('Task cannot be moved to target column');
      }

      // Выполняем перемещение
      return await this.optimisticMoveTask(taskId, taskState.columnId, targetColumnId, position);
    },
  },
});
