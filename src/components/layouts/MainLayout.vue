<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none"> Trello App </router-link>
        </q-toolbar-title>

        <q-space />

        <q-btn-dropdown flat :label="userStore.currentUser?.username" icon="person">
          <q-list>
            <q-item clickable v-close-popup @click="$router.push('/profile')">
              <q-item-section avatar>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Профиль</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="showCreateBoardDialog = true">
              <q-item-section avatar>
                <q-icon name="add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Создать доску</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="logout">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Выйти</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="280">
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header>Навигация</q-item-label>

          <q-item clickable v-ripple to="/">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Главная</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/boards">
            <q-item-section avatar>
              <q-icon name="dashboard_customize" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Все доски</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item-label header>Мои доски</q-item-label>

          <template v-for="board in boardStore.ownedBoards" :key="board.id">
            <q-item clickable v-ripple :to="`/boards/${board.id}`" v-if="!board.is_archived">
              <q-item-section avatar>
                <q-icon name="folder" :color="board.background_color" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ board.title }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <q-item-label header>Общие доски</q-item-label>

          <template v-for="board in boardStore.memberBoards" :key="board.id">
            <q-item clickable v-ripple :to="`/boards/${board.id}`" v-if="!board.is_archived">
              <q-item-section avatar>
                <q-icon name="folder_shared" :color="board.background_color" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ board.title }}</q-item-label>
                <q-item-label caption>{{ board.owner.username }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" v-if="boardStore.archivedBoards.length > 0" />

          <q-expansion-item
            v-if="boardStore.archivedBoards.length > 0"
            label="Архив"
            icon="archive"
            default-closed
          >
            <template v-for="board in boardStore.archivedBoards" :key="board.id">
              <q-item clickable :to="`/boards/${board.id}`">
                <q-item-section avatar>
                  <q-icon name="archive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ board.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Диалог создания доски -->
    <q-dialog v-model="showCreateBoardDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Создать новую доску</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="createBoard">
            <q-input v-model="newBoard.title" label="Название доски" required class="q-mb-md" />

            <q-input
              v-model="newBoard.description"
              label="Описание"
              type="textarea"
              rows="3"
              class="q-mb-md"
            />

            <div class="q-mb-md">
              <div class="text-caption q-mb-sm">Цвет фона</div>
              <div class="row q-gutter-sm">
                <q-radio
                  v-for="color in backgroundColors"
                  :key="color.value"
                  v-model="newBoard.background_color"
                  :val="color.value"
                >
                  <template v-slot:default>
                    <div class="color-preview" :style="{ backgroundColor: color.value }"></div>
                    <div class="text-caption">{{ color.label }}</div>
                  </template>
                </q-radio>
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn
            color="primary"
            label="Создать"
            @click="createBoard"
            :loading="boardStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import { useUserStore } from 'src/stores/user';

const $q = useQuasar();
const router = useRouter();
const boardStore = useBoardStore();
const userStore = useUserStore();

const leftDrawerOpen = ref(false);
const showCreateBoardDialog = ref(false);
const newBoard = ref({
  title: '',
  description: '',
  background_color: '#0079bf',
});

const backgroundColors = [
  { label: 'Синий', value: '#0079bf' },
  { label: 'Зеленый', value: '#519839' },
  { label: 'Оранжевый', value: '#d29034' },
  { label: 'Красный', value: '#b04632' },
  { label: 'Фиолетовый', value: '#89609e' },
  { label: 'Темный', value: '#055a8c' },
];

onMounted(async () => {
  try {
    await boardStore.fetchBoards();
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить доски',
    });
  }
});

const createBoard = async () => {
  try {
    const board = await boardStore.createBoard(newBoard.value);
    showCreateBoardDialog.value = false;
    newBoard.value = {
      title: '',
      description: '',
      background_color: '#0079bf',
    };
    void router.push(`/boards/${board.id}`);
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать доску',
    });
  }
};

const logout = async () => {
  try {
    await userStore.logout();
    void router.push('/auth/login');
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось выйти',
    });
  }
};
</script>

<style lang="scss" scoped>
.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    border-color: #1976d2;
  }
}

.text-decoration-none {
  text-decoration: none;
}
</style>
