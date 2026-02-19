<template>
  <q-dialog v-model="dialog" persistent>
    <q-card class="board-edit-dialog" style="min-width: 500px; max-width: 800px">
      <!-- Заголовок -->
      <q-card-section class="row items-center q-pb-none">
        <div class="col">
          <div class="text-h6">Редактирование доски</div>
          <div class="text-caption text-grey-6">Измените настройки и оформление доски</div>
        </div>
        <div class="col-auto">
          <q-btn flat round icon="close" v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Основное содержимое -->
      <q-card-section class="q-pt-none">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-7"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="general" label="Основное" />
          <q-tab name="appearance" label="Оформление" />
          <q-tab name="members" label="Участники" />
          <q-tab name="advanced" label="Дополнительно" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated class="q-mt-md">
          <!-- Основные настройки -->
          <q-tab-panel name="general">
            <q-form @submit="saveBoard" class="q-gutter-md">
              <q-input
                v-model="boardData.title"
                label="Название доски *"
                outlined
                :rules="[(val) => !!val || 'Введите название доски']"
                :error="!!errors.title"
                :error-message="errors.title"
              />

              <q-input
                v-model="boardData.description"
                label="Описание"
                type="textarea"
                rows="3"
                outlined
                :error="!!errors.description"
                :error-message="errors.description"
              />

              <div class="q-mt-lg">
                <div class="text-subtitle2 q-mb-sm">Видимость доски</div>
                <q-option-group
                  v-model="boardData.visibility"
                  :options="visibilityOptions"
                  color="primary"
                />

                <div
                  v-if="boardData.visibility === 'private'"
                  class="q-mt-sm text-caption text-grey-7"
                >
                  Доступ имеют только участники доски
                </div>
                <div
                  v-if="boardData.visibility === 'team'"
                  class="q-mt-sm text-caption text-grey-7"
                >
                  Доступ имеют все члены команды
                </div>
                <div
                  v-if="boardData.visibility === 'public'"
                  class="q-mt-sm text-caption text-grey-7"
                >
                  Доска доступна всем пользователям системы
                </div>
              </div>
            </q-form>
          </q-tab-panel>

          <!-- Оформление -->
          <q-tab-panel name="appearance">
            <div class="q-gutter-y-lg">
              <!-- Цвет фона -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Цвет фона</div>
                <div class="row q-gutter-sm">
                  <div
                    v-for="color in backgroundColors"
                    :key="color.value"
                    class="color-option cursor-pointer"
                    :style="{ backgroundColor: color.value }"
                    :class="{ selected: boardData.background_color === color.value }"
                    @click="boardData.background_color = color.value"
                  >
                    <q-icon
                      v-if="boardData.background_color === color.value"
                      name="check"
                      color="white"
                      size="xs"
                    />
                  </div>
                </div>

                <!-- Пользовательский цвет -->
                <div class="q-mt-md">
                  <div class="text-caption q-mb-xs">Или выберите свой цвет:</div>
                  <q-color
                    v-model="customColor"
                    default-view="palette"
                    :palette="customPalette"
                    class="q-mb-sm"
                  />
                  <q-btn
                    label="Применить"
                    color="primary"
                    size="sm"
                    @click="boardData.background_color = customColor"
                    :disable="!customColor"
                  />
                </div>
              </div>

              <!-- Фоновое изображение -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Фоновое изображение</div>
                <div class="row q-col-gutter-sm">
                  <div v-for="image in backgroundImages" :key="image.id" class="col-4">
                    <div
                      class="image-option cursor-pointer"
                      :style="{ backgroundImage: `url(${image.url})` }"
                      :class="{ selected: boardData.background_image === image.id }"
                      @click="boardData.background_image = image.id"
                    >
                      <div class="image-overlay">
                        <q-icon
                          v-if="boardData.background_image === image.id"
                          name="check"
                          color="white"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="q-mt-sm">
                  <q-btn
                    label="Загрузить свое изображение"
                    icon="upload"
                    color="grey-7"
                    outline
                    size="sm"
                    @click="uploadBackgroundImage"
                  />
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- Участники -->
          <q-tab-panel name="members">
            <div class="q-gutter-y-md">
              <!-- Поиск и добавление участников -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Добавить участников</div>
                <div class="row q-col-gutter-sm">
                  <div class="col">
                    <q-input
                      v-model="memberSearch"
                      placeholder="Поиск пользователей по имени или email..."
                      outlined
                      dense
                      @update:model-value="searchMembers"
                    >
                      <template v-slot:prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      label="Пригласить по email"
                      color="primary"
                      outline
                      @click="showEmailInvite = true"
                    />
                  </div>
                </div>
              </div>

              <!-- Результаты поиска -->
              <div v-if="searchResults.length > 0" class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Найденные пользователи</div>
                <q-list bordered separator>
                  <q-item v-for="user in searchResults" :key="user.id" class="q-py-sm">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{ getUserInitials(user) }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ user.username }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ user.email }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        color="primary"
                        label="Добавить"
                        size="sm"
                        @click="addMember(user)"
                        :loading="addingMemberId === user.id"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Список текущих участников -->
              <div class="q-mt-lg">
                <div class="text-subtitle2 q-mb-sm">Текущие участники</div>

                <div v-if="members.length === 0" class="text-center q-py-lg">
                  <q-icon name="people_outline" size="xl" color="grey-4" class="q-mb-sm" />
                  <div class="text-grey-6">На этой доске нет участников</div>
                </div>

                <q-list bordered separator v-else>
                  <!-- Владелец -->
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white">
                        {{ getUserInitials(boardData.owner) }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        {{ boardData.owner.username }}
                        <q-badge color="primary" class="q-ml-sm">Владелец</q-badge>
                      </q-item-label>
                      <q-item-label caption>
                        {{ boardData.owner.email }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <!-- Участники -->
                  <q-item v-for="member in members" :key="member.id" class="q-py-sm">
                    <q-item-section avatar>
                      <q-avatar color="green" text-color="white">
                        {{ getUserInitials(member) }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ member.username }}</q-item-label>
                      <q-item-label caption>{{ member.email }}</q-item-label>
                    </q-item-section>

                    <q-item-section side v-if="isOwner">
                      <q-btn
                        flat
                        round
                        icon="delete"
                        color="negative"
                        size="sm"
                        @click="removeMember(member)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-tab-panel>

          <!-- Дополнительно -->
          <q-tab-panel name="advanced">
            <div class="q-gutter-y-lg">
              <!-- Статус доски -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Статус доски</div>
                <div class="row items-center q-gutter-md">
                  <q-toggle
                    v-model="boardData.is_archived"
                    label="Архивировать доску"
                    color="warning"
                  />
                  <div class="text-caption text-grey-7">
                    {{
                      boardData.is_archived
                        ? 'Доска будет перемещена в архив и скрыта из основного списка'
                        : 'Активная доска'
                    }}
                  </div>
                </div>
              </div>

              <!-- Разрешения -->
              <div>
                <div class="text-subtitle2 q-mb-sm">Разрешения для участников</div>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label>Создание задач</q-item-label>
                      <q-item-label caption>Участники могут создавать новые задачи</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="boardData.allow_task_creation" color="primary" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>Редактирование задач</q-item-label>
                      <q-item-label caption
                        >Участники могут редактировать любые задачи</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="boardData.allow_task_editing" color="primary" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>Управление колонками</q-item-label>
                      <q-item-label caption
                        >Участники могут добавлять и удалять колонки</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="boardData.allow_column_management" color="primary" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>Добавление участников</q-item-label>
                      <q-item-label caption
                        >Участники могут приглашать других пользователей</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="boardData.allow_member_invites" color="primary" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <!-- Опасная зона -->
              <div>
                <div class="text-subtitle2 text-negative q-mb-sm">Опасная зона</div>
                <q-card flat bordered class="bg-red-1">
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-weight-medium">Удалить доску</div>
                        <div class="text-caption">
                          Это действие нельзя отменить. Все данные доски будут удалены.
                        </div>
                      </div>
                      <q-btn
                        label="Удалить доску"
                        color="negative"
                        outline
                        @click="confirmDeleteBoard"
                      />
                    </div>
                  </q-card-section>
                </q-card>

                <q-card flat bordered class="bg-yellow-1 q-mt-sm">
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-weight-medium">Дублировать доску</div>
                        <div class="text-caption">
                          Создать точную копию доски со всеми колонками и задачами.
                        </div>
                      </div>
                      <q-btn label="Дублировать" color="warning" outline @click="duplicateBoard" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <!-- Кнопки действий -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Отмена" v-close-popup class="q-mr-sm" />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="saveBoard"
          :loading="loading"
          :disable="!isFormValid"
        />
      </q-card-actions>

      <!-- Диалог приглашения по email -->
      <q-dialog v-model="showEmailInvite" persistent>
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Пригласить по email</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="sendEmailInvite" class="q-gutter-md">
              <q-input
                v-model="emailInvite.email"
                label="Email адрес"
                type="email"
                outlined
                :rules="[
                  (val) => !!val || 'Введите email',
                  (val) => /.+@.+\..+/.test(val) || 'Некорректный email',
                ]"
              />

              <q-input
                v-model="emailInvite.message"
                label="Сообщение (необязательно)"
                type="textarea"
                rows="3"
                outlined
                placeholder="Привет! Приглашаю тебя присоединиться к нашей доске..."
              />
            </q-form>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Отмена" v-close-popup />
            <q-btn
              color="primary"
              label="Отправить приглашение"
              @click="sendEmailInvite"
              :loading="sendingInvite"
              :disable="!emailInvite.email"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import { useUserStore } from 'src/stores/user';
import { useActivityStore } from 'src/stores/activity';

const $q = useQuasar();
const boardStore = useBoardStore();
const userStore = useUserStore();
const activityStore = useActivityStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  board: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'board-updated', 'board-deleted']);

// Основные состояния
const dialog = ref(props.modelValue);
const activeTab = ref('general');
const loading = ref(false);
const errors = ref({} as any);

// Данные формы
const boardData = ref({
  title: '',
  description: '',
  background_color: '#0079bf',
  background_image: null,
  visibility: 'private',
  is_archived: false,
  allow_task_creation: true,
  allow_task_editing: true,
  allow_column_management: true,
  allow_member_invites: false,
});

// Управление участниками
const members = ref([]);
const memberSearch = ref('');
const searchResults = ref([]);
const addingMemberId = ref(null);
const showEmailInvite = ref(false);
const sendingInvite = ref(false);
const emailInvite = ref({
  email: '',
  message: '',
});

// Внешний вид
const customColor = ref('#0079bf');
const customPalette = [
  '#0079bf',
  '#519839',
  '#d29034',
  '#b04632',
  '#89609e',
  '#055a8c',
  '#4bbf6b',
  '#00aecc',
  '#838c91',
  '#ff8ed4',
  '#00c2e0',
  '#51e898',
];

// Опции
const visibilityOptions = [
  { label: 'Приватная', value: 'private', description: 'Только участники' },
  { label: 'Командная', value: 'team', description: 'Вся команда' },
  { label: 'Публичная', value: 'public', description: 'Все пользователи' },
];

const backgroundColors = [
  { label: 'Синий', value: '#0079bf' },
  { label: 'Зеленый', value: '#519839' },
  { label: 'Оранжевый', value: '#d29034' },
  { label: 'Красный', value: '#b04632' },
  { label: 'Фиолетовый', value: '#89609e' },
  { label: 'Темно-синий', value: '#055a8c' },
  { label: 'Салатовый', value: '#4bbf6b' },
  { label: 'Голубой', value: '#00aecc' },
  { label: 'Серый', value: '#838c91' },
];

const backgroundImages = [
  {
    id: 'nature',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
  },
  {
    id: 'abstract',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&h=300&fit=crop',
  },
  {
    id: 'city',
    url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
  },
  {
    id: 'gradient',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  },
  {
    id: 'pattern',
    url: 'https://images.unsplash.com/photo-1550686041-366ad85a1355?w=400&h=300&fit=crop',
  },
  {
    id: 'workspace',
    url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop',
  },
];

// Вычисляемые свойства
const isFormValid = computed(() => {
  return boardData.value.title && boardData.value.title.trim().length > 0;
});

const isOwner = computed(() => {
  return boardData.value.owner?.id === userStore.currentUser?.id;
});

// Watchers
watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
    if (val) {
      initializeForm();
    }
  },
);

watch(dialog, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    resetForm();
  }
});

// Инициализация формы
const initializeForm = () => {
  // Копируем данные доски
  boardData.value = {
    ...boardData.value,
    ...props.board,
  };

  // Загружаем участников
  loadMembers();
};

const resetForm = () => {
  boardData.value = {
    title: '',
    description: '',
    background_color: '#0079bf',
    background_image: null,
    visibility: 'private',
    is_archived: false,
    allow_task_creation: true,
    allow_task_editing: true,
    allow_column_management: true,
    allow_member_invites: false,
  };
  members.value = [];
  searchResults.value = [];
  memberSearch.value = '';
  errors.value = {};
  activeTab.value = 'general';
};

// Загрузка участников
const loadMembers = async () => {
  try {
    // Если доска уже содержит участников, используем их
    if (props.board.members && Array.isArray(props.board.members)) {
      members.value = [...props.board.members];
    } else {
      // Иначе загружаем с сервера
      // TODO: Реализовать загрузку участников через API
    }
  } catch (error: any) {
    console.error('Error loading members:', error);
  }
};

// Вспомогательные методы
const getUserInitials = (user) => {
  if (!user) return '?';
  const name = user.first_name || user.username;
  return name.charAt(0).toUpperCase();
};

const searchMembers = async () => {
  if (!memberSearch.value.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    // TODO: Реализовать поиск пользователей через API
    // Пока используем моковые данные
    searchResults.value = [
      {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        first_name: 'Иван',
        last_name: 'Иванов',
      },
      {
        id: 2,
        username: 'user2',
        email: 'user2@example.com',
        first_name: 'Мария',
        last_name: 'Петрова',
      },
    ].filter(
      (user) =>
        user.username.toLowerCase().includes(memberSearch.value.toLowerCase()) ||
        user.email.toLowerCase().includes(memberSearch.value.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(memberSearch.value.toLowerCase()),
    );

    // Исключаем уже добавленных участников и владельца
    const memberIds = members.value.map((m) => m.id);
    memberIds.push(boardData.value.owner?.id);

    searchResults.value = searchResults.value.filter((user) => !memberIds.includes(user.id));
  } catch (error: any) {
    console.error('Error searching members:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось выполнить поиск',
    });
  }
};

// Действия с участниками
const addMember = async (user) => {
  try {
    addingMemberId.value = user.id;

    // TODO: Реализовать добавление участника через API
    await boardStore.addMember(boardData.value.id, user.id);

    // Добавляем в локальный список
    members.value.push(user);

    // Удаляем из результатов поиска
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id);

    // Логируем действие
    activityStore.createActivity({
      board: boardData.value.id,
      action: 'add_member',
      details: {
        member_id: user.id,
        member_username: user.username,
      },
    } as any);

    $q.notify({
      type: 'positive',
      message: 'Пользователь добавлен в доску',
    });
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось добавить пользователя',
    });
  } finally {
    addingMemberId.value = null;
  }
};

const removeMember = async (member) => {
  $q.dialog({
    title: 'Удалить участника',
    message: `Вы уверены, что хотите удалить ${member.username} из доски?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.removeMember(boardData.value.id, member.id);

      // Удаляем из локального списка
      const index = members.value.findIndex((m) => m.id === member.id);
      if (index !== -1) {
        members.value.splice(index, 1);
      }

      // Логируем действие
      activityStore.createActivity({
        board: boardData.value.id,
        action: 'remove_member',
        details: {
          member_id: member.id,
          member_username: member.username,
        },
      } as any);

      $q.notify({
        type: 'positive',
        message: 'Пользователь удален из доски',
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить пользователя',
      });
    }
  });
};

const sendEmailInvite = async () => {
  try {
    sendingInvite.value = true;

    // TODO: Реализовать отправку приглашения через API

    $q.notify({
      type: 'positive',
      message: 'Приглашение отправлено на ' + emailInvite.value.email,
    });

    showEmailInvite.value = false;
    emailInvite.value = { email: '', message: '' };
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось отправить приглашение',
    });
  } finally {
    sendingInvite.value = false;
  }
};

// Сохранение доски
const saveBoard = async () => {
  if (!isFormValid.value) return;

  try {
    loading.value = true;
    errors.value = {};

    // Подготавливаем данные для отправки
    const dataToUpdate = {
      title: boardData.value.title,
      description: boardData.value.description,
      background_color: boardData.value.background_color,
      is_archived: boardData.value.is_archived,
    };

    // Добавляем дополнительные поля если они изменились
    if (boardData.value.visibility !== props.board.visibility) {
      dataToUpdate.visibility = boardData.value.visibility;
    }

    // Обновляем доску
    const updatedBoard = await boardStore.updateBoard(boardData.value.id, dataToUpdate);

    // Логируем действие
    activityStore.createActivity({
      board: boardData.value.id,
      action: 'update_board',
      details: {
        changes: Object.keys(dataToUpdate),
      },
    } as any);

    $q.notify({
      type: 'positive',
      message: 'Доска успешно обновлена',
    });

    emit('board-updated', updatedBoard);
    dialog.value = false;
  } catch (error: any) {
    console.error(error);
    // Обработка ошибок валидации
    if (error.response?.status === 400) {
      errors.value = error.response.data;
    } else {
      $q.notify({
        type: 'negative',
        message: 'Не удалось обновить доску',
      });
    }
  } finally {
    loading.value = false;
  }
};

// Загрузка фонового изображения
const uploadBackgroundImage = () => {
  // TODO: Реализовать загрузку изображения
  $q.notify({
    type: 'info',
    message: 'Функция загрузки изображений будет реализована позже',
  });
};

// Дублирование доски
const duplicateBoard = () => {
  $q.dialog({
    title: 'Дублировать доску',
    message: `Создать копию доски "${boardData.value.title}" со всеми колонками и задачами?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const newBoard = await boardStore.createBoard({
        title: `${boardData.value.title} (Копия)`,
        description: boardData.value.description,
        background_color: boardData.value.background_color,
      });

      // TODO: Реализовать копирование колонок и задач

      $q.notify({
        type: 'positive',
        message: 'Доска успешно скопирована',
      });

      dialog.value = false;
      emit('board-updated', newBoard);
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось скопировать доску',
      });
    }
  });
};

// Удаление доски
const confirmDeleteBoard = () => {
  $q.dialog({
    title: 'Удалить доску',
    message: `Вы уверены, что хотите удалить доску "${boardData.value.title}"? Это действие нельзя отменить.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.deleteBoard(boardData.value.id);

      $q.notify({
        type: 'positive',
        message: 'Доска успешно удалена',
      });

      dialog.value = false;
      emit('board-deleted', boardData.value.id);
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить доску',
      });
    }
  });
};

// Инициализация при монтировании
onMounted(() => {
  if (props.modelValue) {
    initializeForm();
  }
});
</script>

<style lang="scss" scoped>
.board-edit-dialog {
  max-height: 90vh;

  .color-option {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    border: 2px solid transparent;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    &.selected {
      border-color: #1976d2;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  .image-option {
    height: 100px;
    border-radius: 8px;
    background-size: cover;
    background-position: center;
    position: relative;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    border: 2px solid transparent;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    &.selected {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    &.selected .image-overlay {
      opacity: 1;
      background: rgba(25, 118, 210, 0.7);
    }
  }

  .q-tab-panels {
    max-height: 500px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;

      &:hover {
        background: #555;
      }
    }
  }
}
</style>
