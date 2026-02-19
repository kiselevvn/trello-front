<template>
  <q-page class="home-page q-pa-lg">
    <!-- Приветствие -->
    <div class="row items-center q-mb-xl">
      <div class="col">
        <div class="text-h3 text-weight-bold q-mb-sm">Добро пожаловать! 👋</div>
        <div class="text-h6 text-grey-7">Организуйте свои задачи и проекты эффективно</div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Создать доску"
          @click="showCreateBoardDialog = true"
          size="lg"
        />
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="stat-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 text-grey-7">Всего досок</div>
                <div class="text-h4 text-weight-bold">{{ boardStore.boards.length }}</div>
              </div>
              <div class="col-auto">
                <q-icon name="dashboard" size="xl" color="primary" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="stat-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 text-grey-7">Мои доски</div>
                <div class="text-h4 text-weight-bold">{{ boardStore.ownedBoards.length }}</div>
              </div>
              <div class="col-auto">
                <q-icon name="folder" size="xl" color="green" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="stat-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 text-grey-7">Общие доски</div>
                <div class="text-h4 text-weight-bold">{{ boardStore.memberBoards.length }}</div>
              </div>
              <div class="col-auto">
                <q-icon name="people" size="xl" color="orange" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6 col-lg-3">
        <q-card class="stat-card" flat bordered>
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6 text-grey-7">Архив</div>
                <div class="text-h4 text-weight-bold">{{ boardStore.archivedBoards.length }}</div>
              </div>
              <div class="col-auto">
                <q-icon name="archive" size="xl" color="grey" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Недавние доски -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">Недавние доски</div>
        </div>
        <div class="col-auto">
          <q-btn flat label="Все доски" to="/boards" color="primary" />
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <template v-if="recentBoards.length > 0">
          <div
            v-for="board in recentBoards.slice(0, 4)"
            :key="board.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              class="board-card cursor-pointer"
              :style="{ backgroundColor: board.background_color }"
              @click="$router.push(`/boards/${board.id}`)"
            >
              <q-card-section class="text-white">
                <div class="text-h6 text-weight-bold">{{ board.title }}</div>
                <div v-if="board.description" class="q-mt-sm">
                  {{ truncateText(board.description, 60) }}
                </div>
                <div class="q-mt-md row items-center">
                  <q-icon name="person" size="sm" class="q-mr-xs" />
                  <span class="text-caption">{{ board.owner.username }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </template>
        <div v-else class="col-12">
          <q-card flat class="text-center q-pa-xl">
            <q-icon name="dashboard" size="xl" color="grey-4" class="q-mb-md" />
            <div class="text-h6 text-grey-6">Нет созданных досок</div>
            <div class="text-grey-5 q-mt-sm">Создайте свою первую доску!</div>
            <q-btn
              color="primary"
              label="Создать доску"
              @click="showCreateBoardDialog = true"
              class="q-mt-md"
            />
          </q-card>
        </div>
      </div>
    </div>

    <!-- Мои задачи -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">Мои задачи</div>
        </div>
        <div class="col-auto">
          <q-btn flat label="Показать все" color="primary" @click="showAllTasks = !showAllTasks" />
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <q-card class="task-section-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="schedule" color="warning" class="q-mr-sm" />
                Срочные задачи
              </div>

              <template v-if="urgentTasks.length > 0">
                <q-list separator>
                  <q-item
                    v-for="task in urgentTasks.slice(0, showAllTasks ? 10 : 3)"
                    :key="task.id"
                    clickable
                    @click="openTask(task)"
                    class="q-pa-sm q-mb-xs"
                  >
                    <q-item-section avatar>
                      <q-checkbox
                        :model-value="task.is_archived"
                        @click.stop="toggleTaskArchive(task)"
                        color="primary"
                      />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ task.title }}</q-item-label>
                      <q-item-label caption>
                        {{ task.column_title }} • {{ formatDate(task.due_date) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-badge :color="getPriorityColor(task.priority)">
                        {{ getPriorityLabel(task.priority) }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
              <div v-else class="text-center q-py-lg">
                <q-icon name="check_circle" size="xl" color="green-4" class="q-mb-sm" />
                <div class="text-grey-6">Нет срочных задач</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card class="task-section-card" flat bordered>
            <q-card-section>
              <div class="text-h6 text-weight-bold q-mb-md">
                <q-icon name="assignment" color="info" class="q-mr-sm" />
                Недавно созданные
              </div>

              <template v-if="recentTasks.length > 0">
                <q-list separator>
                  <q-item
                    v-for="task in recentTasks.slice(0, showAllTasks ? 10 : 3)"
                    :key="task.id"
                    clickable
                    @click="openTask(task)"
                    class="q-pa-sm q-mb-xs"
                  >
                    <q-item-section avatar>
                      <q-avatar :color="task.column?.color || 'grey-3'" size="sm">
                        <q-icon name="task_alt" size="xs" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ task.title }}</q-item-label>
                      <q-item-label caption>
                        {{ task.column_title }} • {{ formatDate(task.created_at) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon name="person" size="sm" v-if="task.assignee" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
              <div v-else class="text-center q-py-lg">
                <q-icon name="task_alt" size="xl" color="grey-4" class="q-mb-sm" />
                <div class="text-grey-6">Нет созданных задач</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Активность -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">Последняя активность</div>
        </div>
      </div>

      <q-card flat bordered>
        <q-card-section>
          <template v-if="recentActivities.length > 0">
            <q-timeline color="primary">
              <q-timeline-entry
                v-for="activity in recentActivities"
                :key="activity.id"
                :title="getActivityTitle(activity)"
                :subtitle="formatDateTime(activity.created_at)"
                :icon="getActivityIcon(activity.action)"
                :color="getActivityColor(activity.action)"
              >
                <div v-if="activity.details" class="text-caption">
                  {{ getActivityDetails(activity) }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </template>
          <div v-else class="text-center q-py-xl">
            <q-icon name="history" size="xl" color="grey-4" class="q-mb-sm" />
            <div class="text-grey-6">Активности пока нет</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Диалог создания доски -->
    <create-board-dialog v-model="showCreateBoardDialog" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import { useTaskStore } from 'src/stores/task';
import { useUserStore } from 'src/stores/user';
import { useActivityStore } from 'src/stores/activity';
import CreateBoardDialog from 'src/components/board/CreateBoardDialog.vue';

const $q = useQuasar();
const boardStore = useBoardStore();
const taskStore = useTaskStore();
const userStore = useUserStore();
const activityStore = useActivityStore();

const showCreateBoardDialog = ref(false);
const showAllTasks = ref(false);

// Получаем недавние доски
const recentBoards = computed(() => {
  return [...(boardStore.boards || [])]
    .filter((b) => !b.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);
});

// Получаем срочные задачи
const urgentTasks = computed(() => {
  const tasks = [];
  boardStore.boards.forEach((board) => {
    if (!board.is_archived) {
      board.columns?.forEach((column) => {
        column.tasks?.forEach((task) => {
          if (task.assignee?.id === userStore.currentUser?.id) {
            tasks.push({
              ...task,
              column_title: column.title,
              board_title: board.title,
            });
          }
        });
      });
    }
  });

  return tasks
    .filter((task) => task.priority === 'high' || task.is_overdue)
    .sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
});

// Получаем недавние задачи
const recentTasks = computed(() => {
  const tasks = [];
  boardStore.boards.forEach((board) => {
    if (!board.is_archived) {
      board.columns?.forEach((column) => {
        column.tasks?.forEach((task) => {
          tasks.push({
            ...task,
            column_title: column.title,
            board_title: board.title,
          });
        });
      });
    }
  });

  return tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
});

// Получаем недавнюю активность
const recentActivities = computed(() => {
  return activityStore.activities ? activityStore.activities.slice(0, 10) : [];
});

onMounted(async () => {
  try {
    await boardStore.fetchBoards();
    await activityStore.fetchRecentActivities();
  } catch (error: any) {
    console.error('Error loading home page data:', error);
  }
});

// Вспомогательные методы
const truncateText = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Без срока';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU');
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'negative';
    case 'medium':
      return 'warning';
    case 'low':
      return 'positive';
    default:
      return 'grey';
  }
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'high':
      return 'Высокий';
    case 'medium':
      return 'Средний';
    case 'low':
      return 'Низкий';
    default:
      return priority;
  }
};

const getActivityIcon = (action) => {
  const icons = {
    create_board: 'add_box',
    update_board: 'edit',
    create_column: 'add',
    update_column: 'edit',
    move_column: 'swap_horiz',
    create_task: 'task_alt',
    update_task: 'edit',
    move_task: 'swap_vert',
    add_comment: 'comment',
    add_member: 'person_add',
    remove_member: 'person_remove',
    archive_task: 'archive',
    delete_task: 'delete',
  };
  return icons[action] || 'notifications';
};

const getActivityColor = (action) => {
  if (action.includes('create')) return 'positive';
  if (action.includes('update') || action.includes('move')) return 'info';
  if (action.includes('delete') || action.includes('remove')) return 'negative';
  return 'primary';
};

const getActivityTitle = (activity) => {
  const user = activity.user?.username || 'Пользователь';
  const actions = {
    create_board: 'создал(а) доску',
    update_board: 'обновил(а) доску',
    create_column: 'создал(а) колонку',
    update_column: 'обновил(а) колонку',
    move_column: 'переместил(а) колонку',
    create_task: 'создал(а) задачу',
    update_task: 'обновил(а) задачу',
    move_task: 'переместил(а) задачу',
    add_comment: 'добавил(а) комментарий',
    add_member: 'добавил(а) участника',
    remove_member: 'удалил(а) участника',
    archive_task: 'архивировал(а) задачу',
    delete_task: 'удалил(а) задачу',
  };
  return `${user} ${actions[activity.action] || 'выполнил(а) действие'}`;
};

const getActivityDetails = (activity) => {
  if (!activity.details) return '';

  const details = activity.details;
  if (details.task_title) return `Задача: "${details.task_title}"`;
  if (details.board_title) return `Доска: "${details.board_title}"`;
  if (details.column_title) return `Колонка: "${details.column_title}"`;
  if (details.member_username) return `Пользователь: "${details.member_username}"`;

  return JSON.stringify(details);
};

const openTask = (task) => {
  $q.dialog({
    component: TaskDialog,
    componentProps: {
      taskId: task.id,
      boardId: task.board_id,
    },
  });
};

const toggleTaskArchive = async (task) => {
  try {
    if (task.is_archived) {
      await taskStore.restoreTask(task.id);
    } else {
      await taskStore.archiveTask(task.id);
    }
    $q.notify({
      type: 'positive',
      message: `Задача ${task.is_archived ? 'восстановлена' : 'архивирована'}`,
    });
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить статус задачи',
    });
  }
};
</script>

<style lang="scss" scoped>
.home-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.stat-card {
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
}

.board-card {
  height: 140px;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
    opacity: 0.2;
  }
}

.task-section-card {
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .q-item {
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }
  }
}
</style>
