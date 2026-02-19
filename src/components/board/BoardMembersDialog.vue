<template>
  <q-dialog v-model="dialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">Участники доски</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Поиск пользователей -->
        <div class="q-mb-md">
          <q-input
            v-model="searchQuery"
            placeholder="Поиск пользователей..."
            dense
            outlined
            clearable
            @update:model-value="searchUsers"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Список участников -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Текущие участники</div>

          <q-list separator>
            <!-- Владелец -->
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ getInitials(board.owner) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ board.owner.username }}
                </q-item-label>
                <q-item-label caption>
                  {{ board.owner.email }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge color="primary">Владелец</q-badge>
              </q-item-section>
            </q-item>

            <!-- Участники -->
            <q-item v-for="member in board.members" :key="member.id">
              <q-item-section avatar>
                <q-avatar color="green" text-color="white">
                  {{ getInitials(member) }}
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

        <!-- Добавление пользователей -->
        <div v-if="isOwner && searchResults.length > 0" class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Найденные пользователи</div>

          <q-list separator>
            <q-item v-for="user in searchResults" :key="user.id" class="q-py-sm">
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="grey-7">
                  {{ getInitials(user) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ user.username }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn color="primary" label="Добавить" size="sm" @click="addMember(user)" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Приглашение по email -->
        <div v-if="isOwner" class="q-mt-lg">
          <div class="text-subtitle1 q-mb-sm">Пригласить по email</div>
          <div class="row q-gutter-sm">
            <q-input v-model="inviteEmail" placeholder="Введите email" outlined dense class="col" />
            <q-btn color="primary" label="Отправить" @click="sendInvite" :disable="!isValidEmail" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import { useUserStore } from 'src/stores/user';

const $q = useQuasar();
const boardStore = useBoardStore();
const userStore = useUserStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  board: {
    type: Object,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const dialog = ref(props.modelValue);
const searchQuery = ref('');
const searchResults = ref([]);
const inviteEmail = ref('');
const searching = ref(false);

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(inviteEmail.value);
});

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
  },
);

watch(dialog, (val) => {
  emit('update:modelValue', val);
});

// Вспомогательные методы
const getInitials = (user) => {
  if (!user) return '?';
  const name = user.first_name || user.username;
  return name.charAt(0).toUpperCase();
};

const searchUsers = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    searching.value = true;
    const users = await userStore.fetchUsers(searchQuery.value);

    // Исключаем текущих участников и владельца
    const memberIds = props.board.members.map((m) => m.id);
    memberIds.push(props.board.owner.id);

    searchResults.value = users.filter(
      (user) => !memberIds.includes(user.id) && user.id !== userStore.currentUser?.id,
    );
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось найти пользователей',
    });
  } finally {
    searching.value = false;
  }
};

// Действия с участниками
const addMember = async (user) => {
  try {
    await boardStore.addMember(props.board.id, user.id);

    // Добавляем пользователя в локальный список
    props.board.members.push(user);

    // Удаляем из результатов поиска
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id);

    $q.notify({
      type: 'positive',
      message: 'Пользователь добавлен в доску',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось добавить пользователя',
    });
  }
};

const removeMember = (member) => {
  $q.dialog({
    title: 'Удалить участника',
    message: `Вы уверены, что хотите удалить ${member.username} из доски?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.removeMember(props.board.id, member.id);

      // Удаляем из локального списка
      const index = props.board.members.findIndex((m) => m.id === member.id);
      if (index !== -1) {
        props.board.members.splice(index, 1);
      }

      $q.notify({
        type: 'positive',
        message: 'Пользователь удален из доски',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить пользователя',
      });
    }
  });
};

const sendInvite = () => {
  // Здесь можно реализовать отправку приглашения по email
  $q.notify({
    type: 'info',
    message: 'Приглашение отправлено на ' + inviteEmail.value,
  });
  inviteEmail.value = '';
};
</script>
