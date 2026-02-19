<template>
  <q-card class="column-card" flat bordered>
    <!-- Заголовок колонки -->
    <div class="column-header q-pa-sm" :style="{ backgroundColor: column.color }">
      <div class="row items-center justify-between">
        <div class="col">
          <q-input
            v-if="isEditing"
            v-model="editTitle"
            dense
            autofocus
            @keyup.enter="saveEdit"
            @blur="saveEdit"
            class="edit-input"
          />
          <div v-else class="text-h6 cursor-pointer" @dblclick="startEdit">
            {{ column.title }}
            <!-- {{ column }} -->
            <q-badge v-if="column.tasks_count" color="grey" class="q-ml-sm">
              {{ column.tasks_count }}
            </q-badge>
          </div>
        </div>

        <div class="col-auto">
          <q-btn flat round dense icon="more_vert" size="sm">
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable @click="startEdit">
                  <q-item-section avatar>
                    <q-icon name="edit" size="xs" />
                  </q-item-section>
                  <q-item-section>Редактировать</q-item-section>
                </q-item>

                <q-item clickable @click="changeColor">
                  <q-item-section avatar>
                    <q-icon name="palette" size="xs" />
                  </q-item-section>
                  <q-item-section>Изменить цвет</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable @click="$emit('delete-column', column.id)" class="text-negative">
                  <q-item-section avatar>
                    <q-icon name="delete" size="xs" />
                  </q-item-section>
                  <q-item-section>Удалить</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Список задач -->
    <q-card-section class="tasks-container q-pa-sm" :style="{ minHeight: '100px' }">
      <draggable
        v-model="tasks"
        group="tasks"
        item-key="id"
        @end="(event) => onTaskDragEnd(event)"
        :data-column-id="column.id"
        v-bind="taskDragOptions"
      >
        <template #item="{ element: task }">
          <task-card :task="task" @click="$emit('task-clicked', task.id)" class="q-mb-sm" />
        </template>
      </draggable>

      <!-- Пустая колонка -->
      <div v-if="tasks.length === 0" class="empty-column text-center q-py-xl">
        <q-icon name="task_alt" size="xl" color="grey-4" />
        <div class="text-grey-6 q-mt-sm">Задач нет</div>
      </div>
    </q-card-section>

    <!-- Кнопка добавления задачи -->
    <q-card-actions v-if="!showAddTaskForm">
      <q-btn
        flat
        icon="add"
        label="Добавить задачу"
        color="grey-7"
        @click="showAddTaskForm = true"
        class="full-width"
      />
    </q-card-actions>

    <!-- Форма добавления задачи -->
    <q-card-section v-else>
      <q-input
        v-model="newTaskTitle"
        placeholder="Введите название задачи..."
        dense
        autofocus
        @keyup.enter="createTask"
        @keyup.esc="cancelAddTask"
        class="q-mb-sm"
      />
      <div class="row justify-end q-gutter-sm">
        <q-btn flat label="Отмена" size="sm" @click="cancelAddTask" />
        <q-btn
          color="primary"
          label="Добавить"
          size="sm"
          :disable="!newTaskTitle"
          @click="createTask"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import { useTaskStore } from 'src/stores/task';
import TaskCard from '../task/TaskCard.vue';
import { taskUtils } from 'src/utils/taskUtils';
import { useBoardStore } from 'src/stores/board';

const boardStore = useBoardStore();
const $q = useQuasar();
const taskStore = useTaskStore();

const props = defineProps({
  column: {
    type: Object,
    required: true,
  },
  board: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['task-moved', 'task-clicked', 'update-column', 'delete-column']);

const tasks = ref(props.column.tasks || []);
const isEditing = ref(false);
const editTitle = ref('');
const showAddTaskForm = ref(false);
const newTaskTitle = ref('');

const taskDragOptions = computed(() => ({
  animation: 150,
  ghostClass: 'ghost-task',
  dragClass: 'drag-task',
  disabled: false,
}));

// Методы колонки
const startEdit = () => {
  isEditing.value = true;
  editTitle.value = props.column.title;
};

const saveEdit = async () => {
  if (editTitle.value && editTitle.value !== props.column.title) {
    try {
      emit('update-column', props.column.id, { title: editTitle.value });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось обновить колонку',
      });
    }
  }
  isEditing.value = false;
};

const changeColor = () => {
  $q.dialog({
    title: 'Выберите цвет колонки',
    message: 'Выберите цвет для колонки:',
    options: {
      type: 'radio',
      model: props.column.color || '#ebecf0',
      items: [
        { label: 'Серый', value: '#ebecf0', color: '#ebecf0' },
        { label: 'Синий', value: '#dbeafe', color: '#dbeafe' },
        { label: 'Зеленый', value: '#d1fae5', color: '#d1fae5' },
        { label: 'Желтый', value: '#fef3c7', color: '#fef3c7' },
        { label: 'Красный', value: '#fee2e2', color: '#fee2e2' },
        { label: 'Фиолетовый', value: '#f3e8ff', color: '#f3e8ff' },
        { label: 'Розовый', value: '#fce7f3', color: '#fce7f3' },
      ],
    },
    cancel: true,
  }).onOk(async (color) => {
    try {
      emit('update-column', props.column.id, { color });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось изменить цвет',
      });
    }
  });
};

// Методы задач
const createTask = async () => {
  if (!newTaskTitle.value) return;

  try {
    const task = await taskStore.createTask({
      title: newTaskTitle.value,
      column: props.column.id,
    });
    tasks.value.push(task);
    newTaskTitle.value = '';
    showAddTaskForm.value = false;
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать задачу',
    });
  }
};

const cancelAddTask = () => {
  showAddTaskForm.value = false;
  newTaskTitle.value = '';
};

// const onTaskDragEnd = (event) => {
//   const task = tasks.value[event.oldIndex];

//   if (event.to && event.to.dataset.columnId) {
//     const toColumnId = parseInt(event.to.dataset.columnId);
//     console.log(event.to.dataset.columnId);
//     console.log(event.to.dataset);
//     console.log(event.to);

//     if (toColumnId !== props.column.id) {
//       // Задача перемещена в другую колонку
//       console.log('OTHJRES');

//       emit('task-moved', {
//         taskId: task.id,
//         fromColumnId: props.column.id,
//         toColumnId: toColumnId,
//         newPosition: event.newIndex,
//       });
//       tasks.value.splice(event.oldIndex, 1);
//     } else {
//       console.log('INNER');

//       // Задача перемещена внутри колонки
//       emit('task-moved', {
//         taskId: task.id,
//         fromColumnId: props.column.id,
//         toColumnId: props.column.id,
//         newPosition: event.newIndex,
//       });
//     }
//   }
// };
const onTaskDragEnd = async (event) => {
  console.log(boardStore.currentBoard);
  // const t = tasks.value[event.oldIndex];
  const oldCol = boardStore.currentBoard.columns.find(
    (c) => c.id === Number(event.to.dataset.columnId),
  );
  const newCol = boardStore.currentBoard.columns[event.newIndex];
  const task = oldCol.tasks[event.oldIndex];

  console.log(oldCol, newCol, Number(event.to.dataset.columnId));

  console.log(task, event.oldIndex, event.newIndex);

  // console.log(task);
  // console.log(event.oldIndex);

  if (event.to && event.to.dataset.columnId) {
    const toColumnId = parseInt(event.to.dataset.columnId);
    const newPosition = event.newIndex;

    // Валидация перемещения
    // const validation = taskUtils.validateMoveData({
    //   taskId: task.id,
    //   fromColumnId: props.column.id,
    //   toColumnId: toColumnId,
    //   newPosition: newPosition,
    // });

    // if (!validation.valid) {
    //   $q.notify({
    //     type: 'negative',
    //     message: validation.errors,
    //   });
    //   return;
    // }

    try {
      // Используем безопасное перемещение
      await boardStore.safeMoveTask(task.id, {
        column_id: toColumnId,
        position: newPosition,
        fromColumnId: props.column.id,
      });

      if (toColumnId !== props.column.id) {
        // Задача перемещена в другую колонку
        emit('task-moved', {
          taskId: task.id,
          fromColumnId: props.column.id,
          toColumnId: toColumnId,
          newPosition: newPosition,
        });
        tasks.value.splice(event.oldIndex, 1);
      }
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: error.message || 'Не удалось переместить задачу',
      });
      // Восстанавливаем исходное состояние
      tasks.value = [...tasks.value];
    }
  }
};

// Обновляем задачи при изменении пропса
watch(
  () => props.column.tasks,
  (newTasks) => {
    tasks.value = newTasks || [];
  },
);
</script>

<style lang="scss" scoped>
.column-card {
  width: 300px;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  .column-header {
    border-radius: 8px 8px 0 0;
    cursor: move;

    .edit-input {
      background: white;
      border-radius: 4px;
      padding: 0 4px;
    }
  }

  .tasks-container {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100vh - 300px);

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;

      &:hover {
        background: rgba(0, 0, 0, 0.2);
      }
    }
  }

  .empty-column {
    opacity: 0.5;

    &:hover {
      opacity: 0.8;
    }
  }
}

.ghost-task {
  opacity: 0.5;
  background: #f0f0f0;
  border-radius: 4px;
}

.drag-task {
  cursor: grabbing;
  transform: rotate(5deg);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
</style>
