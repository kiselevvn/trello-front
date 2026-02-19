// src/utils/taskUtils.js
export const taskUtils = {
  // Поиск задачи в досках
  findTaskInBoards(boards, taskId) {
    for (const board of boards) {
      if (board.columns) {
        for (const column of board.columns) {
          if (column.tasks) {
            const task = column.tasks.find((t) => t.id === taskId);
            if (task) {
              return {
                board,
                column,
                task,
                boardId: board.id,
                columnId: column.id,
                taskIndex: column.tasks.findIndex((t) => t.id === taskId),
              };
            }
          }
        }
      }
    }
    return null;
  },

  // Проверка возможности перемещения задачи
  validateTaskMove(taskInfo, targetColumnId, targetPosition) {
    if (!taskInfo) {
      return { valid: false, reason: 'Task not found' };
    }

    // Проверяем, не пытаемся ли переместить задачу в ту же позицию
    if (taskInfo.columnId === targetColumnId && taskInfo.taskIndex === targetPosition) {
      return { valid: false, reason: 'Task is already at target position' };
    }

    // Проверяем, существует ли целевая колонка
    const targetColumn = taskInfo.board.columns?.find((col) => col.id === targetColumnId);
    if (!targetColumn) {
      return { valid: false, reason: 'Target column not found' };
    }

    // Проверяем, не превышает ли позиция допустимый диапазон
    const maxPosition = targetColumn.tasks?.length || 0;
    if (targetPosition < 0 || targetPosition > maxPosition) {
      return { valid: false, reason: 'Invalid target position' };
    }

    // Проверяем, не заблокирована ли колонка
    if (targetColumn.is_locked) {
      return { valid: false, reason: 'Target column is locked' };
    }

    // Проверяем, не заблокирована ли задача
    if (taskInfo.task.is_locked) {
      return { valid: false, reason: 'Task is locked' };
    }

    return { valid: true };
  },

  // Генерация уникального ID для временной задачи
  generateTempTaskId() {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Создание копии задачи с новым ID
  cloneTask(task, newId = null) {
    return {
      ...task,
      id: newId || this.generateTempTaskId(),
      is_temp: !!newId,
      cloned_from: task.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // Сравнение позиций задач
  compareTaskPositions(a, b) {
    if (a.column_id !== b.column_id) {
      return a.column_id - b.column_id;
    }
    return a.position - b.position;
  },

  // Сортировка задач по позиции
  sortTasksByPosition(tasks) {
    return [...tasks].sort((a, b) => a.position - b.position);
  },

  // Обновление позиций задач после перемещения
  updateTaskPositions(tasks) {
    return tasks.map((task, index) => ({
      ...task,
      position: index,
    }));
  },

  // Группировка задач по колонкам
  groupTasksByColumn(tasks) {
    const groups = {};

    tasks.forEach((task) => {
      if (!groups[task.column_id]) {
        groups[task.column_id] = [];
      }
      groups[task.column_id].push(task);
    });

    // Сортируем задачи в каждой группе
    Object.keys(groups).forEach((columnId) => {
      groups[columnId] = this.sortTasksByPosition(groups[columnId]);
    });

    return groups;
  },

  // Расчет оптимальной позиции для вставки задачи
  calculateOptimalPosition(columnTasks, dragPosition, dropPosition) {
    const positions = columnTasks.map((task) => task.position);
    positions.sort((a, b) => a - b);

    // Если позиция занята, находим ближайшую свободную
    if (positions.includes(dropPosition)) {
      // Ищем свободную позицию после указанной
      for (let i = dropPosition; i <= positions.length; i++) {
        if (!positions.includes(i)) {
          return i;
        }
      }
      // Если все позиции заняты, вставляем в конец
      return positions.length;
    }

    return dropPosition;
  },

  // Создание истории перемещений
  createMoveHistory(fromColumnId, toColumnId, taskId, fromPosition, toPosition) {
    return {
      id: `move_${Date.now()}_${taskId}`,
      task_id: taskId,
      from_column_id: fromColumnId,
      to_column_id: toColumnId,
      from_position: fromPosition,
      to_position: toPosition,
      timestamp: new Date().toISOString(),
    };
  },

  // Валидация данных для перемещения
  validateMoveData(moveData) {
    const requiredFields = ['taskId', 'fromColumnId', 'toColumnId', 'newPosition'];
    const missingFields = requiredFields.filter((field) => !moveData[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    if (typeof moveData.newPosition !== 'number' || moveData.newPosition < 0) {
      return {
        valid: false,
        errors: 'newPosition must be a non-negative number',
      };
    }

    return { valid: true };
  },
};
