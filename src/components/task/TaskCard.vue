<template>
  <q-card class="task-card cursor-pointer" flat bordered @click="$emit('click')">
    <q-card-section class="q-pa-sm">
      <!-- Метки -->
      <div v-if="task.labels && task.labels.length > 0" class="row q-gutter-xs q-mb-xs">
        <q-badge
          v-for="label in task.labels"
          :key="label.id"
          :style="{ backgroundColor: label.color }"
          class="label-badge"
        />
      </div>

      <!-- Заголовок задачи -->
      <div class="task-title text-body1 q-mb-xs">
        {{ task.title }}
      </div>

      <!-- Описание -->
      <div v-if="task.description" class="task-description text-caption text-grey-7">
        {{ truncateText(task.description, 60) }}
      </div>

      <!-- Дополнительная информация -->
      <div class="row items-center justify-between q-mt-sm">
        <div class="col-auto">
          <!-- Назначенный пользователь -->
          <q-avatar
            v-if="task.assignee"
            size="24px"
            color="primary"
            text-color="white"
            class="q-mr-xs"
          >
            {{ getInitials(task.assignee) }}
          </q-avatar>

          <!-- Срок выполнения -->
          <q-badge
            v-if="task.due_date"
            :color="getDueDateColor(task.due_date)"
            text-color="white"
            class="q-mr-xs"
          >
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            {{ formatDate(task.due_date) }}
          </q-badge>

          <!-- Приоритет -->
          <q-badge
            v-if="task.priority !== 'medium'"
            :color="getPriorityColor(task.priority)"
            text-color="white"
          >
            {{ getPriorityIcon(task.priority) }}
          </q-badge>
        </div>

        <!-- Количество комментариев -->
        <div class="col-auto">
          <q-icon
            v-if="task.comments_count"
            name="comment"
            size="sm"
            color="grey-5"
            class="q-mr-xs"
          />
          <span v-if="task.comments_count" class="text-caption text-grey-7">
            {{ task.comments_count }}
          </span>

          <!-- Количество вложений -->
          <q-icon
            v-if="task.attachments_count"
            name="attach_file"
            size="sm"
            color="grey-5"
            class="q-ml-xs"
          />
          <span v-if="task.attachments_count" class="text-caption text-grey-7">
            {{ task.attachments_count }}
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click']);

// Вспомогательные методы
const truncateText = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const getInitials = (user) => {
  if (!user) return '?';
  const name = user.first_name || user.username;
  return name.charAt(0).toUpperCase();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Завтра';
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  }
};

const getDueDateColor = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'negative'; // Просрочено
  if (diffDays === 0) return 'warning'; // Сегодня
  if (diffDays === 1) return 'warning'; // Завтра
  if (diffDays <= 3) return 'info'; // В течение 3 дней
  return 'grey';
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

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'high':
      return '▲';
    case 'medium':
      return '▶';
    case 'low':
      return '▼';
    default:
      return '';
  }
};
</script>

<style lang="scss" scoped>
.task-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  background: white;
  border-left: 4px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-left-color: #1976d2;
  }

  .task-title {
    line-height: 1.3;
    font-weight: 500;
  }

  .task-description {
    line-height: 1.4;
  }

  .label-badge {
    height: 8px;
    width: 40px;
    border-radius: 4px;
  }

  .q-avatar {
    font-size: 0.75rem;
  }
}
</style>
