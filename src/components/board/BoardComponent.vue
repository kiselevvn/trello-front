<template>
  <q-page class="q-pa-md board-page" v-if="board">
    <!-- Заголовок доски -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center">
          <q-btn flat round icon="arrow_back" @click="$router.push('/boards')" class="q-mr-sm" />
          <div>
            <h2 class="text-h4 q-ma-none" :style="{ color: board.background_color }">
              {{ board.title }}
            </h2>
            <div v-if="board.description" class="text-grey q-mt-sm">
              {{ board.description }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-auto">
        <div v-if="!showAddColumnForm">
          <q-btn
            flat
            icon="add"
            label="Добавить колонку"
            color="grey-7"
            @click="showAddColumnForm = true"
          />
        </div>
        <div class="row q-px-sm" v-else>
          <q-input
            v-model="newColumnTitle"
            label="Название колонки"
            dense
            autofocus
            @keyup.enter="createColumn"
          />
          <q-btn flat label="Отмена" @click="cancelAddColumn" />
          <q-btn
            color="primary"
            label="Добавить"
            :disable="!newColumnTitle"
            @click="createColumn"
          />
        </div>
      </div>
      <div class="col-auto">
        <q-btn-dropdown color="primary" label="Действия" icon="more_vert">
          <q-list>
            <q-item clickable v-close-popup @click="editBoard">
              <q-item-section avatar>
                <q-icon name="edit" />
              </q-item-section>
              <q-item-section>Редактировать доску</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showMembers = true">
              <q-item-section avatar>
                <q-icon name="people" />
              </q-item-section>
              <q-item-section>Участники ({{ board.members.length + 1 }})</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showLabels = true">
              <q-item-section avatar>
                <q-icon name="label" />
              </q-item-section>
              <q-item-section>Метки</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="addNewColumn" class="text-primary">
              <q-item-section avatar>
                <q-icon name="add" />
              </q-item-section>
              <q-item-section>Добавить колонку</q-item-section>
            </q-item>

            <q-separator />

            <q-item
              clickable
              v-close-popup
              @click="archiveBoard"
              class="text-negative"
              v-if="board.is_owner"
            >
              <q-item-section avatar>
                <q-icon name="archive" />
              </q-item-section>
              <q-item-section>{{
                board.is_archived ? 'Восстановить' : 'Архивировать'
              }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>
    {{ selectedTaskId }}
    <!-- {{ columns.map((a) => a.id) }} -->
    <!-- Колонки -->
    <div class="columns-container q-gutter-md row no-wrap scroll-x" ref="columnsContainer">
      <draggable
        id="board-col-tasks"
        v-model="columns"
        group="columns"
        item-key="id"
        class="row no-wrap"
        @end="onColumnDragEnd"
        v-bind="dragOptions"
        style="overflow: hidden"
      >
        <template #item="{ element: column }">
          <div class="col-auto">
            <column-component
              :column="column"
              :board="board"
              @task-moved="onTaskMoved"
              @task-clicked="onTaskClicked"
              @update-column="updateColumn"
              @delete-column="deleteColumn"
            />
          </div>
        </template>
      </draggable>

      <!-- Кнопка добавления колонки -->
      <!-- <Teleport to="board-col-tasks" defer> -->
      <!-- <div class="col-auto">
        <div v-if="!showAddColumnForm">
          <q-card class="add-column-card" flat bordered>
            <q-card-section class="text-center">
              <q-btn
                flat
                icon="add"
                label="Добавить колонку"
                color="grey-7"
                @click="showAddColumnForm = true"
              />
            </q-card-section>
          </q-card>
        </div>
        <div v-else>
          <q-card class="new-column-card" flat bordered>
            <q-card-section>
              <q-input
                v-model="newColumnTitle"
                label="Название колонки"
                dense
                autofocus
                @keyup.enter="createColumn"
              />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Отмена" @click="cancelAddColumn" />
              <q-btn
                color="primary"
                label="Добавить"
                :disable="!newColumnTitle"
                @click="createColumn"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div> -->
      <!-- </Teleport> -->
    </div>

    <div v-if="board">
      <board-members-dialog v-model="showMembers" :board="board" :is-owner="board.is_owner" />

      <labels-dialog v-model="showLabels" :board-id="board.id" />

      <task-dialog
        v-model="showTaskDialog"
        :task-id="selectedTaskId"
        :board-id="board.id"
        @task-updated="onTaskUpdated"
      />

      <board-edit-dialog
        v-model="showEditBoardDialog"
        :board="board"
        @board-updated="onBoardUpdated"
      />
    </div>
    <!-- Диалоги -->
  </q-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import ColumnComponent from './ColumnComponent.vue';
import BoardMembersDialog from './BoardMembersDialog.vue';
import LabelsDialog from './LabelsDialog.vue';
import TaskDialog from '../task/TaskDialog.vue';
import BoardEditDialog from './BoardEditDialog.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const boardStore = useBoardStore();

const board = ref(null);
const columns = ref([]);
const showAddColumnForm = ref(false);
const newColumnTitle = ref('');
const showMembers = ref(false);
const showLabels = ref(false);
const showTaskDialog = ref(false);
const showEditBoardDialog = ref(false);
const selectedTaskId = ref(null);
const columnsContainer = ref(null);

const dragOptions = computed(() => ({
  animation: 200,
  disabled: false,
  ghostClass: 'ghost-column',
  dragClass: 'drag-column',
  handle: '.column-header',
}));

// Загрузка данных доски
onMounted(async () => {
  try {
    board.value = await boardStore.fetchBoard(route.params.id);
    console.log(board.value);

    columns.value = await boardStore.fetchColumns(route.params.id);
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить доску',
    });
    router.push('/boards');
  }
});

// Обработчики событий
const onTaskClicked = (taskId) => {
  selectedTaskId.value = taskId;
  showTaskDialog.value = true;
};

const onTaskUpdated = (updatedTask: any) => {
  // Обновляем данные задач
  columns.value = columns.value.map((col) => ({
    ...col,
    tasks: col.tasks.map((task) =>
      task.id === selectedTaskId.value ? { ...task, ...updatedTask } : task,
    ),
  }));
};

const onBoardUpdated = (updatedBoard) => {
  board.value = { ...board.value, ...updatedBoard };
};

const addNewColumn = () => {
  showAddColumnForm.value = true;
  newColumnTitle.value = '';
};

const createColumn = async () => {
  try {
    const column = await boardStore.createColumn({
      title: newColumnTitle.value,
      board: board.value.id,
    });
    columns.value.push(column);
    showAddColumnForm.value = false;
    newColumnTitle.value = '';
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать колонку',
    });
  }
};

const cancelAddColumn = () => {
  showAddColumnForm.value = false;
  newColumnTitle.value = '';
};

const onColumnDragEnd = async (event) => {
  const column = columns.value[event.newIndex];
  try {
    await boardStore.moveColumn(column.id, { position: event.newIndex });
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось переместить колонку',
    });
    // Возвращаем колонку на исходную позицию
    columns.value = await boardStore.fetchColumns(board.value.id);
  }
};

const onTaskMoved = async ({ taskId, fromColumnId, toColumnId, newPosition }) => {
  try {
    await boardStore.moveTask(taskId, {
      column_id: toColumnId,
      position: newPosition,
    });

    // Обновляем локальное состояние
    const fromColumn = columns.value.find((col) => col.id === fromColumnId);
    const toColumn = columns.value.find((col) => col.id === toColumnId);

    if (fromColumn && toColumn) {
      const taskIndex = fromColumn.tasks.findIndex((t) => t.id === taskId);
      const task = fromColumn.tasks[taskIndex];

      // Удаляем из старой колонки
      fromColumn.tasks.splice(taskIndex, 1);

      // Добавляем в новую колонку
      toColumn.tasks.splice(newPosition, 0, task);

      // Обновляем позиции
      fromColumn.tasks.forEach((t, index) => (t.position = index));
      toColumn.tasks.forEach((t, index) => (t.position = index));
    }
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось переместить задачу',
    });
  }
};

const updateColumn = async (columnId, data) => {
  try {
    const updatedColumn = await boardStore.updateColumn(columnId, data);
    const index = columns.value.findIndex((col) => col.id === columnId);
    if (index !== -1) {
      columns.value[index] = { ...columns.value[index], ...updatedColumn };
    }
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить колонку',
    });
  }
};

const deleteColumn = async (columnId) => {
  $q.dialog({
    title: 'Удаление колонки',
    message: 'Вы уверены, что хотите удалить эту колонку? Все задачи будут удалены.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.deleteColumn(columnId);
      columns.value = columns.value.filter((col) => col.id !== columnId);
      $q.notify({
        type: 'positive',
        message: 'Колонка удалена',
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить колонку',
      });
    }
  });
};

const editBoard = () => {
  showEditBoardDialog.value = true;
};

const archiveBoard = async () => {
  const action = board.value.is_archived ? 'восстановить' : 'архивировать';
  $q.dialog({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} доску`,
    message: `Вы уверены, что хотите ${action} эту доску?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const updatedBoard = await boardStore.updateBoard(board.value.id, {
        is_archived: !board.value.is_archived,
      });
      board.value = { ...board.value, ...updatedBoard };
      $q.notify({
        type: 'positive',
        message: `Доска успешно ${action}на`,
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: `Не удалось ${action} доску`,
      });
    }
  });
};
</script>

<style lang="scss" scoped>
.board-page {
  background: linear-gradient(to bottom, #f0f2f5, #e0e5e9);
  min-height: 100vh;
}

.columns-container {
  display: flex;
  overflow-x: auto;
  padding-bottom: 20px;

  &::-webkit-scrollbar {
    height: 12px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.add-column-card {
  width: 300px;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
}

.new-column-card {
  width: 300px;
  min-height: 100px;
}

.ghost-column {
  opacity: 0.5;
  background: #f0f0f0;
}

.drag-column {
  cursor: grabbing;
}

.scroll-x {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
