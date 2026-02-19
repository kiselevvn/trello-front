<template>
  <q-page class="profile-page q-pa-lg">
    <!-- Заголовок -->
    <div class="row items-center q-mb-xl">
      <div class="col">
        <div class="text-h3 text-weight-bold">Профиль</div>
        <div class="text-h6 text-grey-7">Управление вашим аккаунтом и настройками</div>
      </div>
    </div>

    <div class="row q-col-gutter-xl">
      <!-- Левая колонка - информация о пользователе -->
      <div class="col-12 col-md-4">
        <q-card class="profile-card" flat bordered>
          <q-card-section class="text-center">
            <!-- Аватар -->
            <div class="q-mb-md">
              <q-avatar size="120px" class="profile-avatar" color="primary">
                <span class="text-h2">
                  {{ userInitials }}
                </span>
                <q-badge
                  floating
                  rounded
                  color="green"
                  icon="check"
                  v-if="userStore.currentUser?.is_active"
                />
              </q-avatar>
            </div>

            <!-- Имя пользователя -->
            <div class="text-h5 text-weight-bold q-mb-xs">
              {{ userStore.currentUser?.username }}
            </div>

            <!-- Email -->
            <div class="text-grey-7 q-mb-lg">
              {{ userStore.currentUser?.email }}
            </div>

            <!-- Статистика -->
            <div class="row justify-center q-gutter-lg q-mb-lg">
              <div class="text-center">
                <div class="text-h5 text-weight-bold">{{ boardStore.ownedBoards.length }}</div>
                <div class="text-caption text-grey-7">Мои доски</div>
              </div>
              <div class="text-center">
                <div class="text-h5 text-weight-bold">{{ boardStore.memberBoards.length }}</div>
                <div class="text-caption text-grey-7">Общие доски</div>
              </div>
              <div class="text-center">
                <div class="text-h5 text-weight-bold">{{ totalTasks }}</div>
                <div class="text-caption text-grey-7">Задачи</div>
              </div>
            </div>

            <!-- Действия -->
            <div class="q-gutter-sm">
              <q-btn
                color="primary"
                label="Изменить профиль"
                @click="editProfile"
                outline
                class="full-width"
              />
              <q-btn
                color="grey-7"
                label="Сменить пароль"
                @click="changePassword"
                flat
                class="full-width"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Настройки -->
        <q-card class="settings-card q-mt-lg" flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">Настройки</div>

            <q-list separator>
              <q-item>
                <q-item-section>
                  <q-item-label>Тема</q-item-label>
                  <q-item-label caption>Выберите тему приложения</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle
                    v-model="darkMode"
                    checked-icon="dark_mode"
                    unchecked-icon="light_mode"
                    color="primary"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label>Уведомления</q-item-label>
                  <q-item-label caption>Получать уведомления о задачах</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="notifications" color="primary" />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label>Язык</q-item-label>
                  <q-item-label caption>Язык интерфейса</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-select
                    v-model="language"
                    :options="languages"
                    dense
                    borderless
                    style="width: 120px"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-card-actions>
            <q-btn
              color="primary"
              label="Сохранить настройки"
              @click="saveSettings"
              class="full-width"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Правая колонка - активность и статистика -->
      <div class="col-12 col-md-8">
        <!-- Статистика -->
        <q-card class="stats-card q-mb-lg" flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">Статистика</div>

            <div class="row q-col-gutter-lg">
              <div class="col-12 col-md-6">
                <q-card class="stat-detail-card" flat>
                  <q-card-section>
                    <div class="text-h5 text-weight-bold q-mb-sm">Задачи</div>
                    <q-linear-progress
                      :value="completedTasks / totalTasks"
                      color="green"
                      class="q-mb-sm"
                    />
                    <div class="row justify-between">
                      <span>Выполнено: {{ completedTasks }}</span>
                      <span>Всего: {{ totalTasks }}</span>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card class="stat-detail-card" flat>
                  <q-card-section>
                    <div class="text-h5 text-weight-bold q-mb-sm">Активность</div>
                    <div class="text-h3 text-weight-bold">{{ recentActivities.length }}</div>
                    <div class="text-caption text-grey-7">действий за последнюю неделю</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Недавняя активность -->
        <q-card class="activity-card q-mb-lg" flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">Недавняя активность</div>

            <template v-if="recentActivities.length > 0">
              <q-list separator>
                <q-item
                  v-for="activity in recentActivities.slice(0, 5)"
                  :key="activity.id"
                  class="q-py-md"
                >
                  <q-item-section avatar>
                    <q-avatar :color="getActivityColor(activity.action)" text-color="white">
                      <q-icon :name="getActivityIcon(activity.action)" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ getActivityTitle(activity) }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ formatDateTime(activity.created_at) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      icon="chevron_right"
                      @click="goToBoard(activity.board.id)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="text-center q-mt-md">
                <q-btn
                  flat
                  label="Показать всю активность"
                  color="primary"
                  @click="showAllActivities = !showAllActivities"
                />
              </div>

              <q-slide-transition>
                <div v-if="showAllActivities" class="q-mt-md">
                  <q-list separator>
                    <q-item
                      v-for="activity in recentActivities.slice(5)"
                      :key="activity.id"
                      class="q-py-sm"
                    >
                      <q-item-section avatar>
                        <q-icon :name="getActivityIcon(activity.action)" size="sm" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="text-caption">
                          {{ getActivityTitle(activity) }}
                        </q-item-label>
                        <q-item-label caption class="text-caption">
                          {{ formatDate(activity.created_at) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </q-slide-transition>
            </template>
            <div v-else class="text-center q-py-xl">
              <q-icon name="history" size="xl" color="grey-4" class="q-mb-sm" />
              <div class="text-grey-6">Активности пока нет</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Мои доски -->
        <q-card class="my-boards-card" flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold q-mb-md">Мои доски</div>

            <template v-if="boardStore.ownedBoards.length > 0">
              <div class="row q-col-gutter-md">
                <div
                  v-for="board in boardStore.ownedBoards.slice(0, 6)"
                  :key="board.id"
                  class="col-12 col-sm-6"
                >
                  <q-card
                    class="mini-board-card cursor-pointer"
                    :style="{ backgroundColor: board.background_color }"
                    @click="$router.push(`/boards/${board.id}`)"
                  >
                    <q-card-section class="text-white">
                      <div class="text-subtitle1 text-weight-bold">{{ board.title }}</div>
                      <div class="text-caption opacity-80 q-mt-xs">
                        {{ board.columns?.length || 0 }} колонок •
                        {{ board.members?.length || 0 }} участников
                      </div>
                      <div class="text-caption opacity-80 q-mt-xs">
                        Обновлено: {{ formatDate(board.updated_at) }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </template>
            <div v-else class="text-center q-py-xl">
              <q-icon name="dashboard" size="xl" color="grey-4" class="q-mb-sm" />
              <div class="text-grey-6">У вас нет собственных досок</div>
              <q-btn
                color="primary"
                label="Создать доску"
                @click="showCreateBoardDialog = true"
                class="q-mt-md"
                size="sm"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Диалоги -->
    <create-board-dialog v-model="showCreateBoardDialog" />
    <edit-profile-dialog
      v-model="showEditProfileDialog"
      :user="userStore.currentUser"
      @profile-updated="onProfileUpdated"
    />
    <change-password-dialog v-model="showChangePasswordDialog" />
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
import EditProfileDialog from 'src/components/user/EditProfileDialog.vue';
import ChangePasswordDialog from 'src/components/user/ChangePasswordDialog.vue';

const $q = useQuasar();
const boardStore = useBoardStore();
const taskStore = useTaskStore();
const userStore = useUserStore();
const activityStore = useActivityStore();

const darkMode = ref($q.dark.isActive);
const notifications = ref(true);
const language = ref('ru');
const showAllActivities = ref(false);
const showCreateBoardDialog = ref(false);
const showEditProfileDialog = ref(false);
const showChangePasswordDialog = ref(false);

const languages = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
];

// Инициалы пользователя
const userInitials = computed(() => {
  const user = userStore.currentUser;
  if (!user) return '?';

  const name = user.first_name || user.username;
  return name.charAt(0).toUpperCase();
});

// Общая статистика задач
const totalTasks = computed(() => {
  let count = 0;
  boardStore.boards.forEach((board) => {
    if (!board.is_archived) {
      board.columns?.forEach((column) => {
        count += column.tasks?.length || 0;
      });
    }
  });
  return count;
});

const completedTasks = computed(() => {
  let count = 0;
  boardStore.boards.forEach((board) => {
    if (!board.is_archived) {
      board.columns?.forEach((column) => {
        column.tasks?.forEach((task) => {
          if (task.is_archived) count++;
        });
      });
    }
  });
  return count;
});

// Недавняя активность
const recentActivities = computed(() => {
  return activityStore.activities
    .filter((activity) => activity.user?.id === userStore.currentUser?.id)
    .slice(0, 20);
});

onMounted(async () => {
  try {
    await boardStore.fetchBoards();
    await activityStore.fetchRecentActivities();
  } catch (error: any) {
    console.error('Error loading profile data:', error);
  }
});

// Вспомогательные методы
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU');
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
  if (action.includes('create')) return 'green';
  if (action.includes('update') || action.includes('move')) return 'blue';
  if (action.includes('delete') || action.includes('remove')) return 'red';
  return 'primary';
};

const getActivityTitle = (activity) => {
  const actions = {
    create_board: 'Создал(а) доску',
    update_board: 'Обновил(а) доску',
    create_column: 'Создал(а) колонку',
    update_column: 'Обновил(а) колонку',
    move_column: 'Переместил(а) колонку',
    create_task: 'Создал(а) задачу',
    update_task: 'Обновил(а) задачу',
    move_task: 'Переместил(а) задачу',
    add_comment: 'Добавил(а) комментарий',
    add_member: 'Добавил(а) участника',
    remove_member: 'Удалил(а) участника',
    archive_task: 'Архивировал(а) задачу',
    delete_task: 'Удалил(а) задачу',
  };
  const actionText = actions[activity.action] || 'Выполнил(а) действие';
  const boardTitle = activity.board?.title || '';

  return `${actionText}${boardTitle ? ` в доске "${boardTitle}"` : ''}`;
};

// Обработчики событий
const editProfile = () => {
  showEditProfileDialog.value = true;
};

const changePassword = () => {
  showChangePasswordDialog.value = true;
};

const goToBoard = (boardId) => {
  $router.push(`/boards/${boardId}`);
};

const saveSettings = () => {
  // Сохранение настроек
  $q.dark.set(darkMode.value);

  // Сохраняем в localStorage
  localStorage.setItem('darkMode', darkMode.value);
  localStorage.setItem('notifications', notifications.value);
  localStorage.setItem('language', language.value);

  $q.notify({
    type: 'positive',
    message: 'Настройки сохранены',
  });
};

const onProfileUpdated = (updatedUser) => {
  // Обновляем данные пользователя в store
  userStore.currentUser = { ...userStore.currentUser, ...updatedUser };
};
</script>

<style lang="scss" scoped>
.profile-page {
  background: #f5f7fa;
  min-height: 100vh;
}

.profile-card {
  .profile-avatar {
    border: 4px solid white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

.settings-card,
.stats-card,
.activity-card,
.my-boards-card {
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  }
}

.stat-detail-card {
  border-left: 4px solid #1976d2;
  background: linear-gradient(to right, rgba(25, 118, 210, 0.05), transparent);
}

.mini-board-card {
  height: 100px;
  transition:
    transform 0.3s,
    box-shadow 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  .opacity-80 {
    opacity: 0.8;
  }
}

.text-caption {
  font-size: 0.75rem;
}
</style>
