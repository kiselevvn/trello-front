<template>
  <q-dialog v-model="dialog" full-width persistent @hide="onDialogHide">
    <q-card class="task-dialog" style="min-width: 800px; max-width: 1000px">
      <!-- Заголовок -->
      <q-card-section class="row items-center q-pb-none">
        <div class="col">
          <q-input
            v-model="taskData.title"
            placeholder="Введите название задачи..."
            class="task-title-input"
            borderless
            :readonly="!isEditingTitle"
            @focus="isEditingTitle = true"
            @blur="saveTitle"
          >
            <template v-slot:append>
              <q-btn flat round icon="edit" size="sm" @click="isEditingTitle = true" />
            </template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-btn flat round icon="close" v-close-popup />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row q-col-gutter-lg">
        <!-- Левая колонка - основное содержимое -->
        <div class="col-12 col-md-8">
          <!-- Описание -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Описание</div>
            <q-editor
              v-model="taskData.description"
              min-height="150px"
              :toolbar="editorToolbar"
              placeholder="Добавьте более подробное описание..."
              @blur="saveDescription"
            />
          </div>

          <!-- Комментарии -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Комментарии ({{ comments.length }})</div>

            <!-- Список комментариев -->
            <div v-if="comments.length > 0" class="q-mb-md">
              <q-list separator>
                <q-item v-for="comment in comments" :key="comment.id" class="q-pa-none q-mb-md">
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">
                      {{ getInitials(comment.author) }}
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ comment.author.username }}
                      <span class="text-caption text-grey-6 q-ml-sm">
                        {{ formatDateTime(comment.created_at) }}
                      </span>
                    </q-item-label>
                    <q-item-label class="q-mt-xs">
                      {{ comment.text }}
                    </q-item-label>

                    <div class="row q-mt-xs">
                      <q-btn
                        v-if="comment.author.id === userStore.currentUser?.id"
                        flat
                        dense
                        label="Редактировать"
                        size="sm"
                        @click="editComment(comment)"
                      />
                      <q-btn
                        v-if="comment.author.id === userStore.currentUser?.id"
                        flat
                        dense
                        label="Удалить"
                        size="sm"
                        color="negative"
                        @click="deleteComment(comment.id)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Форма добавления комментария -->
            <div class="q-mt-lg">
              <q-input
                v-model="newComment"
                placeholder="Напишите комментарий..."
                type="textarea"
                rows="3"
                outlined
                @keydown.ctrl.enter="addComment"
              >
                <template v-slot:after>
                  <q-btn
                    color="primary"
                    icon="send"
                    :disable="!newComment.trim()"
                    @click="addComment"
                  />
                </template>
              </q-input>
            </div>
          </div>

          <!-- Вложения -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Вложения ({{ attachments.length }})</div>

            <!-- Список вложений -->
            <div v-if="attachments.length > 0" class="row q-col-gutter-sm q-mb-md">
              <div v-for="attachment in attachments" :key="attachment.id" class="col-12 col-sm-6">
                <q-card class="attachment-card" flat bordered>
                  <q-card-section class="row items-center">
                    <div class="col-auto">
                      <q-icon name="insert_drive_file" size="lg" color="grey-6" />
                    </div>
                    <div class="col q-ml-sm">
                      <div class="text-caption text-weight-medium">
                        {{ attachment.file_name }}
                      </div>
                      <div class="text-caption text-grey-6">
                        {{ formatFileSize(attachment.file_size) }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-btn
                        flat
                        round
                        icon="delete"
                        size="sm"
                        @click="deleteAttachment(attachment.id)"
                      />
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-actions>
                    <q-btn
                      flat
                      label="Скачать"
                      icon="download"
                      size="sm"
                      @click="downloadAttachment(attachment)"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </div>

            <!-- Загрузка файлов -->
            <div>
              <q-uploader
                label="Добавить вложение"
                :url="uploadUrl"
                :headers="uploadHeaders"
                multiple
                :max-files="5"
                @uploaded="onFileUploaded"
                @failed="onUploadFailed"
                style="width: 100%"
              />
            </div>
          </div>
        </div>

        <!-- Правая колонка - боковая панель -->
        <div class="col-12 col-md-4">
          <!-- Действия -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Действия</div>
            <q-list dense>
              <q-item clickable @click="archiveTask">
                <q-item-section avatar>
                  <q-icon name="archive" />
                </q-item-section>
                <q-item-section>
                  {{ taskData.is_archived ? 'Восстановить' : 'Архивировать' }}
                </q-item-section>
              </q-item>

              <q-item clickable @click="duplicateTask">
                <q-item-section avatar>
                  <q-icon name="content_copy" />
                </q-item-section>
                <q-item-section>Дублировать</q-item-section>
              </q-item>

              <q-item clickable @click="deleteTask" class="text-negative">
                <q-item-section avatar>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Удалить</q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Свойства задачи -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Свойства</div>

            <!-- Колонка -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Колонка</div>
              <q-select
                v-model="taskData.column"
                :options="columns"
                option-label="title"
                option-value="id"
                dense
                outlined
                @update:model-value="saveColumn"
              />
            </div>

            <!-- Исполнитель -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Исполнитель</div>
              <q-select
                v-model="taskData.assignee"
                :options="assigneeOptions"
                option-label="username"
                option-value="id"
                clearable
                dense
                outlined
                @update:model-value="saveAssignee"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white" size="sm">
                        {{ getInitials(scope.opt) }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.username }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Срок выполнения -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Срок выполнения</div>
              <q-input
                v-model="taskData.due_date"
                type="datetime-local"
                dense
                outlined
                clearable
                @update:model-value="saveDueDate"
              />
            </div>

            <!-- Приоритет -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Приоритет</div>
              <q-btn-toggle
                v-model="taskData.priority"
                :options="priorityOptions"
                toggle-color="primary"
                spread
                @update:model-value="savePriority"
              />
            </div>

            <!-- Метки -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Метки</div>
              <div class="row q-gutter-xs q-mb-xs">
                <q-chip
                  v-for="label in availableLabels"
                  :key="label.id"
                  :style="{ backgroundColor: label.color }"
                  text-color="white"
                  removable
                  @remove="removeLabel(label.id)"
                >
                  {{ label.name }}
                </q-chip>
              </div>
              <q-select
                v-model="selectedLabel"
                :options="unselectedLabels"
                option-label="name"
                option-value="id"
                dense
                outlined
                label="Добавить метку"
                @update:model-value="addLabel"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <div class="label-color" :style="{ backgroundColor: scope.opt.color }" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>

          <!-- Дополнительная информация -->
          <div class="q-mb-lg">
            <div class="text-h6 q-mb-sm">Информация</div>
            <q-list dense>
              <q-item>
                <q-item-section>Создана</q-item-section>
                <q-item-section side>
                  {{ formatDateTime(taskData.created_at) }}
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>Создатель</q-item-section>
                <q-item-section side>
                  {{ taskData.creator?.username }}
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>Обновлена</q-item-section>
                <q-item-section side>
                  {{ formatDateTime(taskData.updated_at) }}
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>ID задачи</q-item-section>
                <q-item-section side> #{{ taskData.id }} </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useTaskStore } from 'src/stores/task';
import { useBoardStore } from 'src/stores/board';
import { useUserStore } from 'src/stores/user';
import { useActivityStore } from 'src/stores/activity';

const $q = useQuasar();
const taskStore = useTaskStore();
const boardStore = useBoardStore();
const userStore = useUserStore();
const activityStore = useActivityStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  taskId: {
    type: Number,
    required: true,
  },
  boardId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'task-updated']);

const dialog = ref(props.modelValue);
const taskData = ref({});
const isEditingTitle = ref(false);
const newComment = ref('');
const selectedLabel = ref(null);
const comments = ref([]);
const attachments = ref([]);
const columns = ref([]);
const boardLabels = ref([]);

// Опции для редактора
const editorToolbar = [
  ['bold', 'italic', 'strike', 'underline'],
  ['unordered', 'ordered'],
  ['link'],
];

// Опции приоритета
const priorityOptions = [
  { label: 'Низкий', value: 'low', icon: 'south' },
  { label: 'Средний', value: 'medium', icon: 'east' },
  { label: 'Высокий', value: 'high', icon: 'north' },
];

// URL для загрузки файлов
const uploadUrl = computed(() => `${process.env.API_URL}/attachments/`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`,
}));

// Опции для исполнителя
const assigneeOptions = computed(() => {
  const members = boardStore.currentBoard?.members || [];
  const owner = boardStore.currentBoard?.owner;
  return [owner, ...members].filter(Boolean);
});

// Доступные метки
const availableLabels = computed(() => {
  return taskData.value.labels || [];
});

const unselectedLabels = computed(() => {
  const selectedIds = availableLabels.value.map((l) => l.id);
  return boardLabels.value.filter((label) => !selectedIds.includes(label.id));
});

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
    if (val) {
      loadData();
    }
  },
);

watch(dialog, (val) => {
  emit('update:modelValue', val);
});

onMounted(async () => {
  await loadBoardData();
});

const loadBoardData = async () => {
  try {
    // Загружаем колонки доски
    columns.value = await boardStore.fetchColumns(props.boardId);

    // Загружаем метки доски
    boardLabels.value = await boardStore.fetchLabels(props.boardId);
  } catch (error) {
    console.error('Error loading board data:', error);
  }
};

const loadData = async () => {
  try {
    // Загружаем задачу
    taskData.value = await taskStore.fetchTask(props.taskId);

    // Загружаем комментарии
    comments.value = await taskStore.fetchComments(props.taskId);

    // Загружаем вложения
    attachments.value = await taskStore.fetchAttachments(props.taskId);
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить данные задачи',
    });
    dialog.value = false;
  }
};

// Вспомогательные методы
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getInitials = (user) => {
  if (!user) return '?';
  const name = user.first_name || user.username;
  return name.charAt(0).toUpperCase();
};

// Действия с задачей
const saveTitle = async () => {
  if (!taskData.value.title.trim()) return;
  isEditingTitle.value = false;

  try {
    await taskStore.updateTask(props.taskId, {
      title: taskData.value.title,
    });
    emit('task-updated', { title: taskData.value.title });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить заголовок',
    });
  }
};

const saveDescription = async () => {
  try {
    await taskStore.updateTask(props.taskId, {
      description: taskData.value.description,
    });
    emit('task-updated', { description: taskData.value.description });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить описание',
    });
  }
};

const saveColumn = async (column) => {
  try {
    await taskStore.updateTask(props.taskId, {
      column: column.id,
    });
    emit('task-updated', { column: column.id });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить колонку',
    });
  }
};

const saveAssignee = async (assignee) => {
  try {
    await taskStore.updateTask(props.taskId, {
      assignee_id: assignee?.id || null,
    });
    emit('task-updated', { assignee });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить исполнителя',
    });
  }
};

const saveDueDate = async () => {
  try {
    await taskStore.updateTask(props.taskId, {
      due_date: taskData.value.due_date,
    });
    emit('task-updated', { due_date: taskData.value.due_date });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить срок выполнения',
    });
  }
};

const savePriority = async () => {
  try {
    await taskStore.updateTask(props.taskId, {
      priority: taskData.value.priority,
    });
    emit('task-updated', { priority: taskData.value.priority });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось изменить приоритет',
    });
  }
};

// Метки
const addLabel = async (label) => {
  try {
    const currentLabels = taskData.value.label_ids || [];
    await taskStore.updateTask(props.taskId, {
      label_ids: [...currentLabels, label.id],
    });

    // Обновляем локальные данные
    taskData.value.labels = [...availableLabels.value, label];
    selectedLabel.value = null;

    emit('task-updated', { label_ids: [...currentLabels, label.id] });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось добавить метку',
    });
  }
};

const removeLabel = async (labelId) => {
  try {
    const currentLabels = taskData.value.label_ids || [];
    const newLabels = currentLabels.filter((id) => id !== labelId);

    await taskStore.updateTask(props.taskId, {
      label_ids: newLabels,
    });

    // Обновляем локальные данные
    taskData.value.labels = availableLabels.value.filter((l) => l.id !== labelId);

    emit('task-updated', { label_ids: newLabels });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить метку',
    });
  }
};

// Комментарии
const addComment = async () => {
  if (!newComment.value.trim()) return;

  try {
    const comment = await taskStore.createComment(props.taskId, {
      text: newComment.value,
    });
    comments.value.unshift(comment);
    newComment.value = '';

    // Логируем действие
    activityStore.createActivity({
      board: props.boardId,
      action: 'add_comment',
      details: {
        task_id: props.taskId,
        task_title: taskData.value.title,
      },
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось добавить комментарий',
    });
  }
};

const editComment = (comment) => {
  $q.dialog({
    title: 'Редактировать комментарий',
    prompt: {
      model: comment.text,
      type: 'textarea',
    },
    cancel: true,
    persistent: true,
  }).onOk(async (text) => {
    try {
      await taskStore.updateComment(comment.id, { text });
      comment.text = text;
      $q.notify({
        type: 'positive',
        message: 'Комментарий обновлен',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось обновить комментарий',
      });
    }
  });
};

const deleteComment = async (commentId) => {
  $q.dialog({
    title: 'Удалить комментарий',
    message: 'Вы уверены, что хотите удалить этот комментарий?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await taskStore.deleteComment(commentId);
      comments.value = comments.value.filter((c) => c.id !== commentId);
      $q.notify({
        type: 'positive',
        message: 'Комментарий удален',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить комментарий',
      });
    }
  });
};

// Вложения
const onFileUploaded = ({ files }) => {
  $q.notify({
    type: 'positive',
    message: 'Файл успешно загружен',
  });
  loadData(); // Перезагружаем вложения
};

const onUploadFailed = ({ xhr }) => {
  $q.notify({
    type: 'negative',
    message: 'Не удалось загрузить файл',
  });
};

const downloadAttachment = (attachment) => {
  window.open(attachment.file_url, '_blank');
};

const deleteAttachment = async (attachmentId) => {
  $q.dialog({
    title: 'Удалить вложение',
    message: 'Вы уверены, что хотите удалить это вложение?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await taskStore.deleteAttachment(attachmentId);
      attachments.value = attachments.value.filter((a) => a.id !== attachmentId);
      $q.notify({
        type: 'positive',
        message: 'Вложение удалено',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить вложение',
      });
    }
  });
};

// Действия
const archiveTask = async () => {
  const action = taskData.value.is_archived ? 'восстановить' : 'архивировать';

  $q.dialog({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} задачу`,
    message: `Вы уверены, что хотите ${action} эту задачу?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      if (taskData.value.is_archived) {
        await taskStore.restoreTask(props.taskId);
        taskData.value.is_archived = false;
      } else {
        await taskStore.archiveTask(props.taskId);
        taskData.value.is_archived = true;
      }

      emit('task-updated', { is_archived: taskData.value.is_archived });
      $q.notify({
        type: 'positive',
        message: `Задача успешно ${action}на`,
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: `Не удалось ${action} задачу`,
      });
    }
  });
};

const duplicateTask = async () => {
  $q.dialog({
    title: 'Дублировать задачу',
    message: 'Создать копию этой задачи?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const newTask = await taskStore.createTask({
        title: `${taskData.value.title} (Копия)`,
        description: taskData.value.description,
        column: taskData.value.column.id,
        assignee_id: taskData.value.assignee?.id,
        due_date: taskData.value.due_date,
        priority: taskData.value.priority,
        label_ids: taskData.value.label_ids || [],
      });

      $q.notify({
        type: 'positive',
        message: 'Задача успешно скопирована',
      });
      dialog.value = false;
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось скопировать задачу',
      });
    }
  });
};

const deleteTask = async () => {
  $q.dialog({
    title: 'Удалить задачу',
    message: 'Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await taskStore.deleteTask(props.taskId);
      $q.notify({
        type: 'positive',
        message: 'Задача удалена',
      });
      dialog.value = false;
      emit('task-updated', { deleted: true });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить задачу',
      });
    }
  });
};

const onDialogHide = () => {
  // Очищаем данные при закрытии
  taskData.value = {};
  comments.value = [];
  attachments.value = [];
  newComment.value = '';
  selectedLabel.value = null;
  isEditingTitle.value = false;
};
</script>

<style lang="scss" scoped>
.task-dialog {
  max-height: 90vh;

  .task-title-input {
    font-size: 1.5rem;
    font-weight: 500;

    :deep(.q-field__control) {
      padding: 0;
    }

    :deep(.q-field__native) {
      padding: 0;
    }
  }

  .attachment-card {
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .label-color {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  .q-editor {
    border: 1px solid #e0e0e0;
    border-radius: 4px;

    :deep(.q-editor__content) {
      min-height: 100px;
    }
  }
}
</style>
